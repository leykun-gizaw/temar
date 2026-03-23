# Materials Management (CRUD)

## Overview

Study materials in Temar follow a three-level hierarchy: **Topic > Note > Chunk**. All entities are user-owned. Chunks hold the actual study content in a dual-storage model -- Lexical JSON for the editor and derived Markdown for AI consumption.

### Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/actions/topics.ts` | `createTopic()` server action |
| `apps/web/src/lib/actions/notes.ts` | `createNote()` server action |
| `apps/web/src/lib/actions/chunks.ts` | `createChunk()`, `updateChunkContent()` server actions |
| `apps/web/src/lib/actions/update.ts` | `updateTopic()`, `updateNote()`, `updateChunk()` metadata updates |
| `apps/web/src/lib/actions/delete.ts` | `deleteTopic()`, `deleteNote()`, `deleteChunk()` with cascade |
| `apps/web/src/app/api/topics/[topicId]/notes/route.ts` | Lazy-load notes under a topic (GET) |
| `apps/web/src/app/api/notes/[noteId]/chunks/route.ts` | Lazy-load chunks under a note (GET) |
| `apps/web/src/app/dashboard/materials/_components/materials-browser.tsx` | Tree UI component |
| `apps/web/src/components/lexical-editor/LexicalEditor.tsx` | Rich text editor (Lexical) |
| `apps/web/src/components/lexical-editor/utils/serialize.ts` | `lexicalToMarkdown()` converter |
| `libs/db-client/src/schema/notion-cache-schema.ts` | `topic`, `note`, `chunk` table definitions |

---

## 1. Data Hierarchy

```mermaid
flowchart LR
    U["user<br/>(uuid PK)"]
    T["topic<br/>(uuid PK)"]
    N["note<br/>(uuid PK)"]
    C["chunk<br/>(uuid PK)"]
    CJ["content_json<br/>(JSONB)<br/>Lexical SerializedEditorState"]
    CM["content_markdown<br/>(TEXT)<br/>Derived via lexicalToMarkdown()"]
    RI["recall_item<br/>(1:1 per user)<br/>FSRS card state"]

    U -- "1 : N" --> T
    T -- "1 : N" --> N
    N -- "1 : N" --> C
    C --- CJ
    C --- CM
    C -- "1 : 1" --> RI
```

### Foreign Key Cascades

All parent-child relationships use `ON DELETE CASCADE`:

```
user -> topic -> note -> chunk -> recall_item -> review_log
```

Deleting a topic removes all its notes, chunks, recall items, and review logs.

---

## 2. Create Flow

```mermaid
sequenceDiagram
    actor User as Browser
    participant UI as Materials Browser<br>(Popover Form)
    participant SA as Server Action<br>(createTopic / createNote / createChunk)
    participant Zod as Zod Schema<br>(TopicInputSchema / NoteInputSchema / ChunkInputSchema)
    participant Auth as getLoggedInUser()
    participant DB as PostgreSQL<br>(Drizzle ORM)
    participant Next as Next.js Cache

    User->>UI: Click "+" button, fill popover form
    UI->>SA: Submit FormData via server action

    SA->>Zod: safeParse({ title, description })
    alt Validation fails
        Zod-->>SA: { success: false, error }
        SA-->>UI: { errors: fieldErrors, message: "Failed to create..." }
        UI-->>User: Show validation errors
    end

    Zod-->>SA: { success: true, data }
    SA->>Auth: await getLoggedInUser()
    Auth-->>SA: user object (or throw)

    SA->>DB: SELECT gen_random_uuid() AS id
    DB-->>SA: newId (UUID)

    SA->>DB: INSERT INTO topic/note/chunk<br>(id=newId, name, description,<br>userId, topicId?, noteId?, createdAt)
    DB-->>SA: inserted row

    SA->>Next: revalidatePath('/dashboard/materials')
    SA-->>UI: { errors: {}, message: "Created successfully." }
    UI-->>User: UI refreshes with new item
```

---

## 3. Content Editing (Chunk Dual Storage)

```mermaid
sequenceDiagram
    actor User as Browser
    participant Editor as Lexical Editor<br>(LexicalEditor.tsx)
    participant State as Local React State
    participant MB as Materials Browser
    participant SA as updateChunkContent()<br>(Server Action)
    participant DB as PostgreSQL

    User->>Editor: Edit content in rich text editor
    Editor->>Editor: OnChangePlugin fires
    Editor->>State: Update local SerializedEditorState

    User->>MB: Click Save button
    MB->>MB: Call lexicalToMarkdown(editorState)<br>to derive Markdown

    MB->>SA: updateChunkContent(chunkId, contentJson, contentMd)
    SA->>SA: getLoggedInUser() -- verify auth
    SA->>DB: SELECT chunk WHERE id=chunkId AND userId=user.id
    DB-->>SA: existing chunk (or throw)

    SA->>DB: UPDATE chunk SET<br>content_json = SerializedEditorState (JSONB),<br>content_markdown = derived Markdown (TEXT),<br>content_updated_at = now()
    DB-->>SA: updated

    SA-->>MB: Success
    MB-->>User: Save confirmed
```

### Dual Storage Model

| Column | Type | Purpose |
|--------|------|---------|
| `content_json` | `JSONB` | Lexical `SerializedEditorState` -- source of truth for the editor |
| `content_markdown` | `TEXT` | Derived via `lexicalToMarkdown()` at save time -- used for AI prompts, review display, and search |

The `lexicalToMarkdown()` function handles: headings, paragraphs, lists, code blocks, tables, blockquotes, horizontal rules, images, equations (LaTeX), Mermaid diagrams, YouTube embeds, collapsible sections, and inline formatting (bold, italic, code, strikethrough, highlight).

---

## 4. Delete Flow

```mermaid
sequenceDiagram
    actor User as Browser
    participant UI as Materials Browser
    participant SA as Server Action<br>(deleteTopic / deleteNote / deleteChunk)
    participant Auth as getLoggedInUser()
    participant DB as PostgreSQL
    participant Next as Next.js Cache

    User->>UI: Click delete on item
    UI->>SA: deleteTopic(topicId) /<br>deleteNote(noteId) /<br>deleteChunk(chunkId)

    SA->>Auth: await getLoggedInUser()
    Auth-->>SA: user object (or throw)

    SA->>DB: SELECT id FROM topic/note/chunk<br>WHERE id = ? AND user_id = ?
    DB-->>SA: existing row

    alt Not found or wrong owner
        SA-->>SA: throw Error("Not found")
    end

    SA->>DB: DELETE FROM topic/note/chunk WHERE id = ?
    Note over DB: FK CASCADE deletes children:<br>topic -> notes -> chunks -> recall_items -> review_logs
    DB-->>SA: deleted

    SA->>Next: revalidatePath('/dashboard/materials')
    SA-->>UI: Success
    UI-->>User: Item removed from tree
```

---

## 5. Lazy-Loading Tree (Sidebar)

The materials browser tree loads children on demand: topics are fetched initially, then notes and chunks are loaded when a parent node is expanded.

```mermaid
sequenceDiagram
    actor User as Browser
    participant Tree as Materials Browser<br>(Client Component)
    participant API1 as GET /api/topics/{topicId}/notes
    participant API2 as GET /api/notes/{noteId}/chunks
    participant Fetcher1 as getFilteredNotes()
    participant Fetcher2 as getFilteredChunks()
    participant DB as PostgreSQL

    Note over Tree: Initial render: topics passed<br>as server-fetched props

    User->>Tree: Expand topic node
    Tree->>API1: fetch(`/api/topics/${topicId}/notes`)
    API1->>Fetcher1: getFilteredNotes('', topicId)
    Fetcher1->>DB: SELECT * FROM note<br>WHERE topic_id = ? AND user_id = ?
    DB-->>Fetcher1: note rows
    Fetcher1-->>API1: notes[]
    API1-->>Tree: JSON response
    Tree-->>User: Render note children

    User->>Tree: Expand note node
    Tree->>API2: fetch(`/api/notes/${noteId}/chunks`)
    API2->>Fetcher2: getFilteredChunks('', noteId)
    Fetcher2->>DB: SELECT * FROM chunk<br>WHERE note_id = ? AND user_id = ?
    DB-->>Fetcher2: chunk rows
    Fetcher2-->>API2: chunks[]
    API2-->>Tree: JSON response
    Tree-->>User: Render chunk children

    User->>Tree: Click on chunk
    Tree-->>User: Open Lexical editor<br>with chunk content_json
```

---

## Update Flow (Metadata)

For renaming or updating descriptions (not content), the `updateTopic()`, `updateNote()`, and `updateChunk()` server actions follow the same pattern:

1. `getLoggedInUser()` -- verify authentication
2. `SELECT` to verify ownership (`WHERE id = ? AND user_id = ?`)
3. `UPDATE ... SET name, description WHERE id = ?`
4. `revalidatePath('/dashboard/materials')`

These actions are triggered from the `EditDialog` component in the materials browser.
