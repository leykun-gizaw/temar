# Database Entity-Relationship Diagram

## ER Diagram

```mermaid
erDiagram
    %% ===== AUTH DOMAIN =====

    user {
        uuid id PK
        text name
        text email UK
        boolean email_verified
        text image
        text ai_provider
        text ai_model
        text ai_api_key_encrypted
        boolean use_byok
        integer max_question_reviews
        text provider_key
        text provider_customer_id
        text plan
        text provider_subscription_id
        timestamp pass_reset_at
        timestamp created_at
        timestamp updated_at
    }

    session {
        uuid id PK
        uuid user_id FK
        text token UK
        timestamp expires_at
        text ip_address
        text user_agent
        timestamp created_at
        timestamp updated_at
    }

    account {
        uuid id PK
        uuid user_id FK
        text account_id
        text provider_id
        text access_token
        text refresh_token
        timestamp access_token_expires_at
        timestamp created_at
        timestamp updated_at
    }

    verification {
        uuid id PK
        text identifier
        text value
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }

    %% ===== CONTENT HIERARCHY =====

    topic {
        uuid id PK
        uuid user_id FK
        text name
        text description
        uuid parent_page_id
        uuid datasource_id
        timestamp created_at
    }

    note {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        text name
        text description
        uuid datasource_id
        timestamp created_at
    }

    chunk {
        uuid id PK
        uuid user_id FK
        uuid note_id FK
        text name
        text description
        jsonb content_json
        text content_markdown
        timestamp content_updated_at
        uuid datasource_id
        timestamp created_at
    }

    %% ===== SPACED REPETITION =====

    recall_item {
        uuid id PK
        uuid chunk_id FK
        uuid user_id FK
        text question_title
        text question_text
        jsonb answer_rubric
        text question_type
        smallint state
        timestamp due
        real stability
        real difficulty
        integer scheduled_days
        integer reps
        integer lapses
        integer learning_steps
        timestamp last_review
        jsonb answer_draft_json
        uuid generation_batch_id
        timestamp created_at
        timestamp updated_at
    }

    recall_item_archive {
        uuid id PK
        uuid chunk_id FK
        uuid user_id FK
        text question_title
        text question_text
        jsonb answer_rubric
        smallint state
        timestamp due
        real stability
        real difficulty
        integer scheduled_days
        integer reps
        integer lapses
        timestamp archived_at
        timestamp retired_at
        uuid generation_batch_id
        timestamp created_at
        timestamp updated_at
    }

    review_log {
        uuid id PK
        uuid recall_item_id FK
        uuid user_id FK
        smallint rating
        smallint state
        timestamp due
        real stability
        real difficulty
        integer elapsed_days
        integer scheduled_days
        integer duration_ms
        jsonb answer_json
        jsonb analysis_json
        timestamp reviewed_at
    }

    chunk_tracking {
        uuid id PK
        uuid chunk_id FK
        uuid user_id FK
        enum status
        text error_message
        integer retry_count
        timestamp last_attempt_at
        timestamp created_at
    }

    %% ===== BILLING & PRICING =====

    pass_balance {
        uuid id PK
        uuid user_id FK "UK"
        real balance_usd
        timestamp updated_at
    }

    pass_transaction {
        uuid id PK
        uuid user_id FK
        real delta_usd
        text operation_type
        text description
        text provider_transaction_id
        timestamp created_at
    }

    ai_models {
        text id PK
        text provider
        text label
        text provider_model_id
        boolean is_active
        timestamp created_at
    }

    ai_model_pricing {
        uuid id PK
        text model_id FK
        real input_price_per_1m
        real output_price_per_1m
        timestamp effective_from
        timestamp effective_to
        text change_reason
    }

    ai_markup_config {
        uuid id PK
        text model_id FK
        real markup_factor
        timestamp effective_from
        timestamp effective_to
        text change_reason
    }

    operation_configs {
        text operation_type PK
        text label
        integer max_input_tokens
        integer max_output_tokens
        boolean is_current_feature
        boolean is_active
        timestamp created_at
    }

    ai_usage_log {
        uuid id PK
        uuid user_id FK
        text model_id FK
        text operation_type FK
        integer input_tokens
        integer output_tokens
        real input_price_per_1m_snapshot
        real output_price_per_1m_snapshot
        real markup_factor_snapshot
        real computed_cost_usd
        real amount_charged_usd
        boolean is_byok
        timestamp created_at
    }

    %% ===== RELATIONSHIPS =====

    %% Auth
    user ||--o{ session : "has"
    user ||--o{ account : "has"

    %% Content hierarchy
    user ||--o{ topic : "owns"
    topic ||--o{ note : "contains"
    note ||--o{ chunk : "contains"

    %% Spaced repetition
    chunk ||--o| recall_item : "generates"
    chunk ||--o| chunk_tracking : "tracks status"
    chunk ||--o| recall_item_archive : "archives"
    recall_item ||--o{ review_log : "logs reviews"
    user ||--o{ recall_item : "studies"
    user ||--o{ recall_item_archive : "archived"
    user ||--o{ review_log : "reviews"
    user ||--o{ chunk_tracking : "tracks"

    %% Billing
    user ||--o| pass_balance : "has balance"
    user ||--o{ pass_transaction : "has transactions"

    %% AI pricing
    ai_models ||--o{ ai_model_pricing : "priced by"
    ai_models ||--o{ ai_markup_config : "marked up by"
    user ||--o{ ai_usage_log : "incurs usage"
    ai_models ||--o{ ai_usage_log : "used in"
    operation_configs ||--o{ ai_usage_log : "categorizes"
```

---

## Domain Groupings

### Auth (better-auth)

| Table | Purpose |
|-------|---------|
| `user` | Core user record; stores profile, AI preferences (BYOK), billing provider IDs, and plan tier |
| `session` | Active sessions with expiry, IP, and user-agent tracking |
| `account` | OAuth provider links (Google, GitHub, etc.) with token storage |
| `verification` | Email verification and password-reset tokens |

### Content Hierarchy

| Table | Purpose |
|-------|---------|
| `topic` | Top-level study subject owned by a user |
| `note` | A study note belonging to a topic |
| `chunk` | Atomic study unit within a note; stores content in **dual-storage model** (see below) |

### Spaced Repetition (FSRS)

| Table | Purpose |
|-------|---------|
| `recall_item` | Active FSRS card state for a chunk+user pair; holds question text, rubric, and all scheduling parameters (stability, difficulty, due date, reps, lapses) |
| `recall_item_archive` | Retired recall items preserved for historical analysis; mirrors `recall_item` columns plus `archived_at` and `retired_at` |
| `review_log` | Append-only log of every review event; captures rating, FSRS state snapshot, duration, answer content, and AI analysis |
| `chunk_tracking` | Tracks question-generation pipeline status per chunk+user (`pending` -> `generating` -> `ready`/`failed`/`untracked`) |

### Billing & Pricing

| Table | Purpose |
|-------|---------|
| `pass_balance` | 1:1 with user; current USD balance for Pass-based billing |
| `pass_transaction` | Append-only ledger of balance changes (top-ups, deductions, refunds) |
| `ai_models` | Master registry of available AI models across providers |
| `ai_model_pricing` | Versioned provider token pricing (input/output per 1M tokens); append-only with `effective_from`/`effective_to` |
| `ai_markup_config` | Versioned per-model markup factors applied on top of provider pricing; append-only |
| `operation_configs` | Defines operation types (question generation, answer analysis, etc.) with token budgets |
| `ai_usage_log` | Append-only audit trail of every AI call; denormalizes pricing snapshots for immutable cost records |

---

## Key Constraints and Patterns

### Dual-storage model (chunk)

Every chunk stores content in two columns:

- **`content_json`** (JSONB) -- Lexical `SerializedEditorState`, the source of truth for the rich-text editor
- **`content_markdown`** (text) -- derived via `lexicalToMarkdown()` at save time, used for AI prompts, review display, and full-text search

Both columns must be kept in sync on every content update.

### Append-only tables

The following tables are insert-only by design (no updates or deletes in application code):

- **`review_log`** -- immutable record of every review event
- **`ai_usage_log`** -- immutable audit trail with denormalized pricing snapshots
- **`ai_model_pricing`** -- old rows are closed (`effective_to` set) rather than updated; new rows inserted
- **`ai_markup_config`** -- same versioning pattern as `ai_model_pricing`
- **`pass_transaction`** -- immutable ledger of all balance mutations

### Unique constraints

- `recall_item` is unique on `(chunk_id, user_id)` -- one active card per chunk per user
- `chunk_tracking` is unique on `(chunk_id, user_id)` -- one tracking record per chunk per user
- `pass_balance` has a unique constraint on `user_id` -- exactly one balance row per user
- `user.email` is unique
- `ai_usage_log` has a unique index on `(user_id, created_at)` to prevent duplicate log entries

### Soft-delete / status-based lifecycle (chunk_tracking)

`chunk_tracking` uses a `status` enum (`pending`, `generating`, `ready`, `failed`, `untracked`) rather than hard deletion. When a user untracks a chunk, the status is set to `untracked` instead of deleting the row, preserving the generation history.

### Cascade deletes

All foreign keys referencing `user.id` use `ON DELETE CASCADE`, so deleting a user removes all associated data. Similarly:

- Deleting a `topic` cascades to its `note` rows
- Deleting a `note` cascades to its `chunk` rows
- Deleting a `chunk` cascades to `recall_item`, `recall_item_archive`, and `chunk_tracking`
- Deleting a `recall_item` cascades to `review_log`
- Deleting an `ai_models` row cascades to `ai_model_pricing` and `ai_markup_config`

### Nullable `user_id` on content tables

`topic.user_id`, `note.user_id`, and `chunk.user_id` are nullable (legacy from Notion sync era). User ownership in cascade operations (track note, track topic) is enforced at the `recall_item` level rather than filtering by `chunk.user_id`.

---

## Source Schema Files

- [`libs/db-client/src/schema/auth-schema.ts`](../../libs/db-client/src/schema/auth-schema.ts) -- `user`, `session`, `account`, `verification`
- [`libs/db-client/src/schema/pass-schema.ts`](../../libs/db-client/src/schema/pass-schema.ts) -- `pass_balance`, `pass_transaction`
- [`libs/db-client/src/schema/ai-pricing-schema.ts`](../../libs/db-client/src/schema/ai-pricing-schema.ts) -- `ai_models`, `ai_model_pricing`, `ai_markup_config`, `operation_configs`, `ai_usage_log`
- [`libs/db-client/src/schema/fsrs-schema.ts`](../../libs/db-client/src/schema/fsrs-schema.ts) -- `recall_item`, `recall_item_archive`, `review_log`, `chunk_tracking`
- [`libs/db-client/src/schema/notion-cache-schema.ts`](../../libs/db-client/src/schema/notion-cache-schema.ts) -- `topic`, `note`, `chunk`
