# Migration 0017 — Make Notion-Specific Columns Nullable

## Summary

This migration drops `NOT NULL` constraints on Notion-specific columns (`parent_database_id`, `datasource_id`) across the `topic`, `note`, and `chunk` tables, and removes the foreign key from `topic.parent_page_id` → `user.notion_page_id`.

These changes allow new users to create topics, notes, and chunks **without** a Notion integration. The columns remain in place for backward compatibility with existing Notion-connected users.

## What Changed

### Schema (`libs/db-client/src/schema/notion-cache-schema.ts`)

| Table   | Column                | Before                                                        | After                   |
|---------|-----------------------|---------------------------------------------------------------|-------------------------|
| `topic` | `parent_page_id`      | `uuid` with FK → `user.notion_page_id`                       | `uuid` (no FK)          |
| `topic` | `parent_database_id`  | `uuid NOT NULL`                                               | `uuid` (nullable)       |
| `topic` | `datasource_id`       | `uuid NOT NULL`                                               | `uuid` (nullable)       |
| `note`  | `parent_database_id`  | `uuid NOT NULL`                                               | `uuid` (nullable)       |
| `note`  | `datasource_id`       | `uuid NOT NULL`                                               | `uuid` (nullable)       |
| `chunk` | `parent_database_id`  | `uuid NOT NULL`                                               | `uuid` (nullable)       |
| `chunk` | `datasource_id`       | `uuid NOT NULL`                                               | `uuid` (nullable)       |

### Migration SQL

File: `libs/db-client/src/drizzle/0017_make_notion_columns_nullable.sql`

```sql
ALTER TABLE "topic" DROP CONSTRAINT IF EXISTS "topic_parent_page_id_user_notion_page_id_fk";
ALTER TABLE "topic" ALTER COLUMN "parent_database_id" DROP NOT NULL;
ALTER TABLE "topic" ALTER COLUMN "datasource_id" DROP NOT NULL;
ALTER TABLE "note"  ALTER COLUMN "parent_database_id" DROP NOT NULL;
ALTER TABLE "note"  ALTER COLUMN "datasource_id" DROP NOT NULL;
ALTER TABLE "chunk" ALTER COLUMN "parent_database_id" DROP NOT NULL;
ALTER TABLE "chunk" ALTER COLUMN "datasource_id" DROP NOT NULL;
```

## Pre-requisites

1. A `.env` file at the repo root with valid database credentials:
   ```
   DATABASE_HOST=...
   DATABASE_USER=...
   DATABASE_PASSWORD=...
   DATABASE_NAME=...
   DATABASE_PORT=5432
   ```

2. Dependencies installed:
   ```bash
   pnpm install
   ```

## How to Run

### Option A — Nx target (recommended)

```bash
npx nx run db-client:migrate
```

This runs `drizzle-kit migrate` using the config at `libs/db-client/drizzle.config.ts`, which reads the migration files from `libs/db-client/src/drizzle/`.

### Option B — Root script

```bash
pnpm migrate
```

This runs the same command via the root `package.json` script.

### Option C — Manual / CI

```bash
pnpm drizzle-kit migrate --config=libs/db-client/drizzle.config.ts
```

## Verification

After running the migration, verify the columns are nullable:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name IN ('topic', 'note', 'chunk')
  AND column_name IN ('parent_database_id', 'datasource_id', 'parent_page_id')
ORDER BY table_name, column_name;
```

Expected output: all rows should show `is_nullable = 'YES'`.

Verify the FK was dropped:

```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'topic'
  AND constraint_name = 'topic_parent_page_id_user_notion_page_id_fk';
```

Expected: **0 rows** returned.

## Rollback

If you need to revert (only safe if no rows have NULL values in these columns):

```sql
-- Re-add NOT NULL constraints
ALTER TABLE "topic" ALTER COLUMN "parent_database_id" SET NOT NULL;
ALTER TABLE "topic" ALTER COLUMN "datasource_id" SET NOT NULL;
ALTER TABLE "note"  ALTER COLUMN "parent_database_id" SET NOT NULL;
ALTER TABLE "note"  ALTER COLUMN "datasource_id" SET NOT NULL;
ALTER TABLE "chunk" ALTER COLUMN "parent_database_id" SET NOT NULL;
ALTER TABLE "chunk" ALTER COLUMN "datasource_id" SET NOT NULL;

-- Re-add FK (only if user.notion_page_id still exists and has matching values)
ALTER TABLE "topic" ADD CONSTRAINT "topic_parent_page_id_user_notion_page_id_fk"
  FOREIGN KEY ("parent_page_id") REFERENCES "public"."user"("notion_page_id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;
```

> **Warning:** The rollback will fail if any rows already have NULL values in these columns (i.e., rows created by non-Notion users after this migration was applied).

## Impact on Services

| Service                    | Impact |
|----------------------------|--------|
| **web** (Next.js)          | Server actions rewritten to be DB-only; no longer call `syncServiceFetch` for create/update/delete. New rows will have `NULL` for Notion columns. |
| **fsrs-service**           | No impact — does not reference Notion-specific columns. |
| **question-gen-service**   | No impact — does not reference Notion-specific columns. |
| **answer-analysis-service**| No impact — does not reference Notion-specific columns. |
| **notion_sync-service**    | Minor — removed unused `retrievePageMarkdown` endpoint. Existing Notion sync functionality unchanged. |

## Related Changes (same PR)

- Route renamed: `/dashboard/topics` → `/dashboard/materials`
- Server actions (`create`, `update`, `delete`, `tracking`, `reset`) rewritten to be DB-only
- New `MaterialsBrowser` component with tree sidebar + inline Lexical editor
- Lexical editor infrastructure: `AnswerEditor`, `OnChangePlugin`, `SlashCommandPlugin`, `theme`, `serialize` utilities
- Lexical packages (`lexical`, `@lexical/*`) re-added to `apps/web/package.json`
- Sidebar navigation updated to `/dashboard/materials`
- Notion OAuth callback redirects updated to `/dashboard/materials`
