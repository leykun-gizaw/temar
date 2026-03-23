# FSRS Scheduling Engine

## Overview

Temar uses the [Free Spaced Repetition Scheduler (FSRS)](https://github.com/open-spaced-repetition/ts-fsrs) algorithm to determine when each recall item should next be reviewed. The fsrs-service wraps the `ts-fsrs` library and manages card state transitions, review logging, and due-item queries.

### Key Source Files

| File | Purpose |
|------|---------|
| `apps/fsrs-service/src/app/services/fsrs-engine.service.ts` | ts-fsrs wrapper -- `applyRating()`, `getSchedulingOptions()` |
| `apps/fsrs-service/src/app/services/review.service.ts` | `submitReview()` transaction -- state update + review_log insert |
| `apps/fsrs-service/src/app/services/recall-item.service.ts` | `getDueItems()`, `getAllItems()` queries |
| `apps/fsrs-service/src/app/controllers/schedule.controller.ts` | Schedule preview endpoints |
| `apps/fsrs-service/src/app/controllers/review.controller.ts` | Review submission endpoints |

---

## 1. FSRS State Machine

Each recall item exists in one of four states. Transitions depend on the user's rating after each review.

```mermaid
stateDiagram-v2
    [*] --> New: recall_item created<br>(tracking activated)

    New --> Learning: First review<br>(any rating)

    Learning --> Learning: Again (1) /<br>Hard (2)
    Learning --> Review: Good (3) /<br>Easy (4)

    Review --> Review: Hard (2) /<br>Good (3) /<br>Easy (4)<br>(longer intervals)
    Review --> Relearning: Again (1)<br>(lapse)

    Relearning --> Relearning: Again (1) /<br>Hard (2)
    Relearning --> Review: Good (3) /<br>Easy (4)
```

### State Descriptions

| State | Code | Description |
|-------|------|-------------|
| New | 0 | Initial state when a recall_item is created via tracking activation. No reviews yet. |
| Learning | 1 | Card has been reviewed at least once but is not yet mature. Short intervals. |
| Review | 2 | Mature card with stable recall. Intervals grow with each successful review. |
| Relearning | 3 | Previously mature card that was failed (rated Again). Returns to short intervals until recovered. |

---

## 2. applyRating Flow

When a user submits a review, the fsrs-service calculates the next scheduling state.

```mermaid
flowchart TD
    A[submitReview called<br>with recallItemId, rating,<br>durationMs, answerJson, analysisJson] --> B[Fetch recall_item by id]

    B --> C[Read FSRS card state:<br>state, due, stability, difficulty,<br>scheduledDays, reps, lapses,<br>learningSteps, lastReview]

    C --> D["Calculate elapsed_days =<br>max(0, floor((now - lastReview) / 86400000))"]

    D --> E[Build CardInput object<br>from recall_item fields]

    E --> F["fsrsEngine.applyRating(cardInput, rating)"]

    F --> G["Internally calls ts-fsrs<br>repeat(card, now)[rating]"]

    G --> H["Returns { card: nextCard,<br>log: reviewLogEntry }"]

    H --> I[Begin database transaction]

    I --> J["UPDATE recall_item SET<br>state = nextCard.state<br>due = nextCard.due<br>stability = nextCard.stability<br>difficulty = nextCard.difficulty<br>scheduledDays = nextCard.scheduled_days<br>reps = nextCard.reps<br>lapses = nextCard.lapses<br>learningSteps = nextCard.learning_steps<br>lastReview = now"]

    J --> K["INSERT review_log:<br>rating, state, due,<br>stability, difficulty,<br>elapsedDays, scheduledDays,<br>durationMs, answerJson, analysisJson"]

    K --> L[Commit transaction]

    L --> M["Return { newDue, state,<br>stability, difficulty }"]
```

### Card Fields Updated Per Review

| Field | Description |
|-------|-------------|
| `state` | New (0), Learning (1), Review (2), or Relearning (3) |
| `due` | Next review datetime |
| `stability` | Memory stability (higher = longer intervals) |
| `difficulty` | Card difficulty (0--10 scale, higher = harder) |
| `scheduledDays` | Days until next review |
| `reps` | Total number of successful reviews |
| `lapses` | Number of times the card was forgotten (rated Again from Review state) |
| `learningSteps` | Current position in learning/relearning step sequence |
| `lastReview` | Timestamp of this review |

---

## 3. getDueItems Query

The due items query retrieves recall items that are ready for review, with full context for display.

```mermaid
flowchart TD
    A[getDueItems called<br>with userId, optional topicId/noteId] --> B[Build base query]

    B --> C["recall_item<br>JOIN chunk ON recall_item.chunk_id = chunk.id<br>JOIN note ON chunk.note_id = note.id<br>JOIN topic ON note.topic_id = topic.id<br>JOIN chunk_tracking ON chunk.id = chunk_tracking.chunk_id"]

    C --> D[Apply base filters]

    D --> E["WHERE userId = X<br>AND due <= now<br>AND chunk_tracking.status != 'untracked'"]

    E --> F{Optional filters?}

    F -- topicId provided --> G["Append: AND topic.id = topicId<br>(via $dynamic().where())"]
    F -- noteId provided --> H["Append: AND note.id = noteId<br>(via $dynamic().where())"]
    F -- No filters --> I[Continue]

    G --> I
    H --> I

    I --> J["ORDER BY due ASC<br>LIMIT N"]

    J --> K["Return items with context:<br>recallItem fields +<br>chunk.name, chunk.content_markdown,<br>note.name, topic.name,<br>question, rubric"]
```

> **Important:** Each `.where()` call on a `$dynamic()` query **replaces** the previous filter. All conditions must be accumulated in an array and applied as a single `.where(and(...conditions))` call. See [Critical Build Gotchas](../../CLAUDE.md) for details.

---

## 4. Scheduling Preview

Before the user confirms a rating, the UI can show what each rating would produce. This lets the user make an informed override decision.

```mermaid
flowchart TD
    A["getSchedulingOptions(cardInput)"] --> B["Call ts-fsrs repeat(card, now)"]

    B --> C["Returns all 4 rating outcomes"]

    C --> D["Again (1):<br>due = X, state = Y,<br>stability = Z"]
    C --> E["Hard (2):<br>due = X, state = Y,<br>stability = Z"]
    C --> F["Good (3):<br>due = X, state = Y,<br>stability = Z"]
    C --> G["Easy (4):<br>due = X, state = Y,<br>stability = Z"]

    D --> H["UI displays:<br>'Again: due in 10 min'<br>'Hard: due in 1 day'<br>'Good: due in 3 days'<br>'Easy: due in 7 days'"]
    E --> H
    F --> H
    G --> H
```

The `getSchedulingOptions()` method calls `ts-fsrs repeat()` once, which internally computes all four possible outcomes. The UI formats the `due` timestamps as relative durations ("in 10 minutes", "in 3 days", etc.) and displays them on the four rating buttons.

---

## Review Log (Append-Only)

Every review creates an immutable `review_log` entry. This provides a complete audit trail of the user's learning history and enables future analytics (retention curves, difficulty trends, session duration tracking).

```
recall_item (1) ---- (N) review_log
```

Each `review_log` entry captures the rating, the full FSRS state at review time, elapsed/scheduled days, session duration, the user's answer (as Lexical JSON), and the AI analysis result. Logs are never updated or deleted.
