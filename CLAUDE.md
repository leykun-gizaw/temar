# CLAUDE.md — Temar State of the Union

> Generated 2026-03-16. Intended as onboarding context for any AI agent or new contributor picking up this codebase.

---

## 1. Project DNA

### What is Temar?

Temar is a **spaced-repetition learning platform** where users organize study material as Topics → Notes → Chunks, create and edit content via a **Lexical rich-text editor**, and review it through AI-powered question generation and FSRS-based scheduling.

> **Key pivot:** The project originally synced content from Notion via a dedicated `notion_sync-service`. That service is **being retired**. Content creation now happens natively in Temar's Lexical-based materials browser. The Notion OAuth flow and sync infrastructure still exist in the codebase but are no longer deployed or actively developed.

### Why this tech stack?

| Layer                | Choice                                                                    | Rationale                                                                                                                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo**         | Nx 22.x + pnpm workspaces                                                 | Shared `libs/` (db-client, pricing-service, shared-types) across 6+ apps. Nx handles build orchestration, caching, affected-target CI.                                                                                                                                                           |
| **Frontend**         | Next.js 15 (App Router) + React 19 + Tailwind 4 + shadcn/ui               | Server Components for data fetching, Server Actions for mutations. `force-dynamic` on review pages, ISR/static where possible.                                                                                                                                                                   |
| **Backend services** | NestJS (4 microservices)                                                  | Each domain gets its own service: `notion_sync-service`, `fsrs-service`, `question-gen-service`, `answer-analysis-service`. All share `libs/db-client` for DB access. All use Swagger for API docs (`/api/docs`).                                                                                |
| **Database**         | PostgreSQL 16 + Drizzle ORM                                               | Single Postgres instance. Drizzle gives type-safe schema-as-code and push-based migrations. All schemas live in `libs/db-client/src/schema/`.                                                                                                                                                    |
| **AI**               | Vercel AI SDK (`ai` package) + multi-provider (OpenAI, Anthropic, Google) | BYOK support. Per-model pricing tables, markup configs, Pass-based billing. Provider selection is per-request via `x-ai-*` headers.                                                                                                                                                              |
| **Rich text editor** | Lexical (migrated from Plate.js)                                          | Primary content authoring for chunks AND review answers. Supports tables, code blocks, equations (KaTeX), Mermaid diagrams, images, YouTube embeds, collapsibles, slash commands, markdown shortcuts. Stores as `content_json` (Lexical `SerializedEditorState`) + `content_markdown` (derived). |
| **Payments**         | Paddle v2 (migrated from Stripe)                                          | Subscription plans + top-up Pass packs. Paddle.js v2 client-side SDK. Sandbox uses different CDN (`sandbox-cdn.paddle.com`).                                                                                                                                                                     |
| **Deployment**       | Docker multi-stage → GHCR → VPS + Caddy                                   | Single `Dockerfile` with per-service build stages. GitHub Actions CI/CD. Caddy for automatic TLS + reverse proxy.                                                                                                                                                                                |

### Core architectural pattern

```
User ↔ Next.js (web) ↔ NestJS microservices ↔ PostgreSQL
         │                    ↕
    Lexical editor       LLM providers (via question-gen / answer-analysis)
    (content CRUD)
```

All inter-service communication is HTTP REST with shared API keys (`x-api-key` headers). The web app calls services via server-side `fetch` wrappers (`fsrsServiceFetch`, `questionGenServiceFetch`, etc.) — never from the browser directly.

> `notion_sync-service` still exists in the codebase but is **not deployed**. It was removed from the CI build matrix (`deploy.yml`) and from the Caddy reverse proxy config.

---

## 2. Repository Map

### Applications (`apps/`)

| App                       | Package name                     | Port | Purpose                                                                                                     | Status                     |
| ------------------------- | -------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- | -------------------------- |
| `web`                     | `@temar/web`                     | 5173 | Next.js frontend — dashboard, materials browser, review sessions, billing, settings, landing page           | **Active, primary**        |
| `notion_sync-service`     | `@temar/notion_sync-service`     | 3333 | NestJS — Notion OAuth, CRUD cascades, webhook handler, markdown conversion, cache revalidation              | **Retired — not deployed** |
| `fsrs-service`            | `@temar/fsrs-service`            | 3334 | NestJS — `ts-fsrs` engine, tracking (topic/note/chunk cascade), review lifecycle, scheduling preview        | **Active**                 |
| `question-gen-service`    | `@temar/question-gen-service`    | 3335 | NestJS — LLM-powered question + rubric generation per chunk, async tracking, retry with rate-limit handling | **Active**                 |
| `answer-analysis-service` | `@temar/answer-analysis-service` | 3336 | NestJS — LLM-powered semantic evaluation of free-text answers, mapped to FSRS ratings                       | **Active**                 |
| `admin`                   | `@temar/admin`                   | 3000 | Next.js admin panel — analytics dashboard, AI model management, user admin                                  | **Active**                 |
| `api`                     | `@temar/api`                     | —    | NestJS API scaffold                                                                                         | **To be decommissioned**   |

### Libraries (`libs/`)

| Library           | Purpose                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `db-client`       | Drizzle ORM client, all schema definitions (`auth-schema`, `notion-cache-schema`, `fsrs-schema`, `pass-schema`, `ai-pricing-schema`), crypto utilities, re-exported Drizzle operators |
| `shared-types`    | Cross-app TypeScript interfaces and DTOs (`ModelConfig`, `OperationType`, etc.)                                                                                                       |
| `pricing-service` | In-memory cached pricing engine — computes Pass costs from DB-driven model pricing × markup, records usage atomically with balance deduction                                          |

### Key files at root

| File                      | Purpose                                                                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`              | Multi-stage build (11 stages) — one builder + runner per service                                                                          |
| `docker-compose.prod.yml` | Production stack: `db`, `migrate`, `web`, `fsrs-service`, `question-gen-service`, `answer-analysis-service`, `admin`, `caddy`, `appsmith` |
| `docker-compose.dev.yml`  | Local development with hot reload                                                                                                         |
| `Caddyfile`               | Reverse proxy: `/*` → web:5173, `/api/webhook/*` → notion_sync:3333, admin subdomain → appsmith                                           |
| `nx.json`                 | Nx plugins config, release groups, cacheable operations                                                                                   |
| `tsconfig.base.json`      | Path aliases: `@temar/db-client`, `@temar/shared-types`, `@temar/pricing-service`                                                         |
| `.env.template`           | All 30+ env vars documented                                                                                                               |

---

## 3. Feature Map (chronological, from ~160 commits)

### Phase 1 — Foundation

- Nx monorepo scaffolding with Next.js web app and NestJS API
- PostgreSQL + Drizzle ORM setup with migration scripts
- Dashboard with calendar, topics data table, and card grid layout
- shadcn/ui component library integration

### Phase 2 — Notion Integration (now retired)

- `notion_sync-service` with OAuth flow and REST API
- Topic → Note → Chunk hierarchy synced from Notion to Postgres
- Webhook handlers (`page.created`, `page.properties_updated`, `page.content_updated`, `page.deleted`)
- Cascade CRUD operations (create/update/delete propagate through hierarchy)
- Markdown conversion with rich text formatting, tables, and comprehensive block types
- Cache revalidation: sync service calls `web/api/revalidate` to bust Next.js caches
- **Status:** Retired. Service removed from deploy pipeline. Content creation moved to native Lexical editor.

### Phase 3 — Spaced Repetition (FSRS)

- `fsrs-service` powered by `ts-fsrs` library
- `recall_item` + `review_log` database tables
- Cascade tracking: track a topic → tracks all its notes → all their chunks
- Review session UI with reveal-then-rate flow (Again/Hard/Good/Easy)
- Scheduling preview (shows next due date for each rating option)
- Due item queries with topic/note filters
- Tracking toggle buttons on chunk cards, note pages, and topic pages

### Phase 4 — AI Question Generation

- `question-gen-service` with multi-provider LLM support (OpenAI, Anthropic, Google)
- Per-chunk question + rubric generation with structured output
- Type-specific rubric schemas (MCQ, LeetCode, free-text)
- Async generation tracking with queue UI
- Question titles, retry logic for rate limits

### Phase 5 — Answer Analysis & Editor Migration

- `answer-analysis-service` for semantic evaluation of free-text answers
- **Plate.js → Lexical migration:** Originally used Plate.js for review answer input. Migrated fully to Lexical for both answer editing AND chunk content editing.
- Three-column review layout: question | answer editor | analysis display
- Review history viewer with detailed analysis display
- Lexical editor now supports: headings, lists, code blocks (with syntax highlighting), tables, equations (KaTeX), Mermaid diagrams, images, YouTube embeds, collapsible sections, slash commands, markdown shortcuts, and auto-linking

### Phase 6 — Monetization & Billing

- Pass-based billing system (`pass_balance`, `pass_transaction` tables)
- AI pricing engine: `ai_models` → `ai_model_pricing` → `ai_markup_config` (all append-only/versioned)
- `pricing-service` library with in-memory caching (5-min TTL)
- **Stripe → Paddle migration:** Originally built Stripe integration (checkout, portal, webhooks). Fully migrated to Paddle v2 with subscription management and webhook handling. Dead Stripe routes still exist at `apps/web/src/app/api/stripe/`.
- BYOK (Bring Your Own Key) toggle — AI usage logged but no Passes deducted
- Usage tracking via `ai_usage_log` with denormalized pricing snapshots

### Phase 7 — Admin & Polish

- Admin panel (`apps/admin`) with analytics dashboard and AI model management
- Landing page redesign with 3D knowledge network hero (Three.js)
- Botanical theme with vintage library green palette
- Settings page (account, security, danger zone)
- Materials route rename (topics → materials) with tree sidebar + Lexical content panel
- Native CRUD for topics, notes, chunks (no longer depends on Notion sync)
- Resizable panels in review UI
- Configurable AI provider per-request via headers
- `notion_sync-service` removed from deploy pipeline

### Phase 8 — Infrastructure

- Multi-stage Dockerfile (per-service build isolation)
- CI: `nx affected` lint/test/build on `dev` push
- CD: Docker build matrix → GHCR → SSH deploy to VPS on `main`/`staging`
- Dedicated migration service stage
- Nx release configuration with conventional commits
- Docker dev environment with health checks

---

## 4. The 'Cascade Wisdom' — Top Recurring Bugs & How They Were Solved

### 1. The Library Bundling Saga (most persistent, spans dozens of commits)

**The core problem:** pnpm workspaces create `node_modules/@temar/*` symlinks that point to `libs/` source directories. When webpack/Next.js follows these symlinks during build, it encounters conflicting TypeScript configurations — the lib's own `tsconfig.json` (with `composite: true`, project references) clashes with the app's tsconfig.

**How it manifests:**

- TypeScript compilation errors during Docker builds
- Webpack resolution failures for `@temar/db-client`, `@temar/shared-types`, `@temar/pricing-service`
- Errors like "cannot find module" or "declaration emit" or unexpected `.js` extension resolution failures
- Works locally but fails in Docker/CI

**The evolving fix (applied across many commits):**

1. **`tsconfig.base.json` path aliases** — All `@temar/*` imports resolve via `paths` in the base tsconfig, pointing directly to `libs/*/src/index.ts`. This is the canonical resolution path.

2. **`rm -rf node_modules/@temar` in Dockerfile** — Every builder stage deletes the workspace symlinks before building, forcing webpack to use tsconfig path aliases instead of following symlinks.

3. **`rm -rf libs/*/tsconfig*.json` in Dockerfile** — NestJS service builders also delete the lib project tsconfigs to prevent the `composite: true` setting from interfering with the service's own compilation.

4. **`extensionAlias` in `next.config.js`** — Next.js (both `web` and `admin`) needs explicit webpack config to resolve `.js` imports to `.ts`/`.tsx` files, because `tsconfig.base.json` uses `module: "nodenext"` which requires `.js` extensions in imports:

   ```js
   config.resolve.extensionAlias = {
     '.jsx': ['.tsx', '.jsx'],
     '.js': ['.ts', '.tsx', '.js'],
   };
   ```

5. **`safeWithNx` wrapper in `next.config.js`** — CI/Docker builds sometimes fail inside the forked Next.js build process because the Nx project graph can't resolve the build target. The `safeWithNx` wrapper catches this and falls back to manual `distDir` configuration from `NX_NEXT_OUTPUT_PATH`.

6. **Service `tsconfig.app.json` includes lib sources** — Each NestJS service explicitly includes `../../libs/db-client/src/**/*.ts` in its `include` array and has a project reference to `../../libs/db-client`, so it compiles lib code as part of its own build.

7. **Lib tsconfigs disable `composite`** — `tsconfig.lib.json` in each lib sets `composite: false`, `declarationMap: false`, and `emitDeclarationOnly: false` to avoid conflicting with service builds.

**Key lesson:** Every time a new library or service is added, the Dockerfile builder stage AND the service's `tsconfig.app.json` both need to be updated with the correct COPY commands, include paths, and `rm -rf` commands. This is the single most common source of build breakages.

### 2. Drizzle `$dynamic()` `.where()` overwrites (not appends)

**Pattern:** Building a query with an initial `.where()`, then conditionally calling `.where()` again on a `$dynamic()` query. Each call **replaces** the previous filter instead of ANDing.

**Where it hit:** `RecallItemService.getDueItems()` — topicId/noteId filters silently dropped the base userId+due condition.

**Fix:** Accumulate all conditions in an array first, then apply a single `.where(and(...conditions))` at the end.

**Watch for this in:** Any Drizzle query that uses `$dynamic()` with conditional filters.

### 3. `NEXT_PUBLIC_*` env vars in Docker builds

**Pattern:** `process.env.NEXT_PUBLIC_X` is statically inlined at **build time** by Next.js. In Docker builds where env vars aren't available during `RUN nx build`, they become empty strings.

**Where it hit:** Paddle SDK initialization, any client component reading `NEXT_PUBLIC_*` props passed from server components.

**Fix:** Use bracket notation `process.env['NEXT_PUBLIC_X']` to prevent static inlining, or pass values from server-side at runtime. Paddle sandbox vs live requires different CDN URLs — `sandbox-cdn.paddle.com` vs `cdn.paddle.com`.

### 4. Workspace symlinks breaking Docker/webpack builds

**See Bug #1 above (Library Bundling Saga) for the comprehensive write-up.** This is the same root cause — pnpm workspace symlinks + conflicting tsconfigs. It's listed separately here because it surfaces as a distinct error from the Drizzle `.where()` bug, but it's the same underlying theme.

**Quick summary:** `rm -rf node_modules/@temar` + `rm -rf libs/*/tsconfig*.json` in every Dockerfile builder stage. `extensionAlias` in Next.js webpack config. `safeWithNx` wrapper for CI resilience. Service tsconfigs must explicitly `include` lib source directories.

### 5. `onConflictDoNothing` masking insert feedback

**Pattern:** Using `.onConflictDoNothing()` on an upsert means the DB silently swallows duplicates. If the code then returns `{ tracked: true }` unconditionally (as in `trackChunk`), callers get false-positive feedback. Catch blocks for unique constraint violations become dead code.

**Where it hit:** `RecallItemService.trackChunk()` — the error catch for `recall_item_chunk_user_idx` is unreachable because `onConflictDoNothing` never throws.

**Fix:** Either use `.onConflictDoUpdate()`, check the returned row count, or use `.returning()` to detect whether an actual insert occurred.

### 6. Chunk `userId` filtering in service-level cascade queries

**Pattern:** When cascading an operation (e.g., "track all chunks in a note"), queries filter `chunk` rows by `chunk.userId`. But the `chunk.userId` column is nullable and populated by Notion sync — it may not match the current user or may be null.

**Where it hit:** `trackNote`, `trackTopic`, `untrackNote`, `untrackTopic` — all return 0 results if `chunk.userId` doesn't match.

**Fix:** Remove `eq(chunk.userId, userId)` from chunk lookups in cascade operations. User ownership is enforced at the `recallItem` level (which has its own `userId` column). Similar issue exists for `note.userId` in topic cascades.

---

## 5. Invisible Context — Architectural Gotchas

### Notion sync is retired but code remains

`apps/notion_sync-service/` and related code (`apps/web/src/app/api/notion/callback/`) still exist in the repo. The service is **not in the Docker build matrix** and **not in the deploy `up -d` command**. The Caddyfile still has a `/api/webhook/*` route pointing to it (dead route). The web app's `NOTION_SERVICE_API_ENDPOINT` env var is unused. Content creation now goes through the materials browser → Lexical editor → direct DB writes via Server Actions (`createChunk`, `updateChunkContent`).

### Lexical dual-storage model

Chunks store content in **two columns**: `content_json` (Lexical `SerializedEditorState` as JSONB) and `content_markdown` (derived markdown string). The `content_json` is the source of truth for rendering in the Lexical editor. The `content_markdown` is generated client-side via `lexicalToMarkdown()` at save time and used for: (a) AI question generation (LLM prompt input), (b) review session display, (c) search/previews.

### Dead Stripe routes

The Stripe integration (`apps/web/src/app/api/stripe/checkout/`, `stripe/portal/`, `stripe/webhook/`) was replaced by Paddle but the old route handlers still exist. They're dead code and can be removed.

### Service communication requires `/api` prefix

All NestJS services use `app.setGlobalPrefix('api')`. The web app's `fsrsServiceFetch` (and similar wrappers) prepend the path to `FSRS_SERVICE_API_ENDPOINT`. If `FSRS_SERVICE_API_ENDPOINT` is set to `http://fsrs-service:3334` (without `/api`), **all calls will 404**. The endpoint must be `http://fsrs-service:3334/api`.

### The `dbClient` is a singleton import, not injected

All NestJS services import `dbClient` directly from `@temar/db-client` rather than using NestJS dependency injection. This means:

- No request-scoped DB connections
- Transaction isolation depends on Drizzle's `dbClient.transaction()` API
- Testing requires mocking the module export, not a DI token

Authentication lives entirely in the Next.js app via `better-auth` (sessions stored in Postgres). Backend services authenticate callers via `x-api-key` header guards — they have **no user session awareness**. The web app passes user identity to services via `x-user-id` headers.

### The `web` app makes direct DB queries in Server Components AND via API routes

The materials browser uses two data paths:

1. **Server Actions** (`createChunk`, `updateChunkContent`, `deleteTopic`, etc.) — write directly to DB via `dbClient`
2. **Next.js API routes** (`/api/topics/[topicId]/notes`, `/api/notes/[noteId]/chunks`) — the tree sidebar fetches children lazily via client-side `fetch()` to these routes, which also query `dbClient` directly

FSRS/question-gen/answer-analysis data comes from microservices via `fetch` wrappers. This dual data path means schema changes can break both the services **and** the web app.

### Adding a new library or service requires updating multiple files

When adding a new `@temar/*` library or a new NestJS service, you must update **all of the following** or builds will break:

1. `tsconfig.base.json` — add path alias
2. `Dockerfile` — add `COPY` for the new lib/app in the deps stage AND in every builder stage that depends on it, plus `rm -rf` commands
3. `docker-compose.prod.yml` — add service entry
4. `.github/workflows/deploy.yml` — add to build matrix AND to `docker compose up -d` command
5. Service `tsconfig.app.json` — add `include` for lib sources and `references`
6. `package.json` of the deps stage — `COPY` the new package.json

### `apps/api` is vestigial

`apps/api` and `apps/api-e2e` are scaffolds from early development. They're not in the Docker build matrix, not deployed, and marked for decommissioning in the README. Safe to ignore or remove.

### `apps/notion_sync-service` is vestigial

`apps/notion_sync-service` and `apps/notion_sync-service-e2e` are from the Notion integration era. Not in the Docker build matrix, not deployed. The web app no longer calls it. The Caddyfile still has a dead `/api/webhook/*` route. Safe to ignore.

### Paddle.js v2 sandbox gotcha

Sandbox uses a **different CDN** (`https://sandbox-cdn.paddle.com/paddle/v2/paddle.js`), not the live one. Sandbox client tokens start with `test_`, live with `live_`. The `Paddle.Initialize()` call accepts only `token`, `pwCustomer`, `checkout`, `eventCallback` — there is **no `environment` parameter**.

---

## 6. Database Schema Overview

```
user (better-auth)
 ├── session
 ├── account
 ├── verification
 ├── pass_balance (1:1)
 ├── pass_transaction (1:N)
 ├── ai_usage_log (1:N)
 ├── topic (1:N, from Notion sync)
 │    └── note (1:N)
 │         └── chunk (1:N)
 │              └── recall_item (1:1 per user, FSRS card state)
 │                   └── review_log (1:N, append-only)
 └── recall_item (direct FK)

ai_models → ai_model_pricing (versioned, append-only)
          → ai_markup_config (versioned, append-only)
operation_configs (token budgets per operation type)
```

Key constraints:

- `recall_item` has a unique constraint on `(chunk_id, user_id)` — one FSRS card per chunk per user
- `review_log` cascades on `recall_item` delete
- All Notion-sourced tables (`topic`, `note`, `chunk`) use Notion page UUIDs as primary keys
- `ai_model_pricing` and `ai_markup_config` are append-only with `effective_from`/`effective_to` for versioning

---

## 7. Environment Variables Quick Reference

The full list is in `.env.template`. Critical groupings:

- **Auth:** `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`
- **Database:** `DATABASE_HOST/USER/PASSWORD/NAME/PORT`
- **Notion sync:** `NOTION_SERVICE_API_ENDPOINT`, `NOTION_SYNC_API_KEY`, `NOTION_OAUTH_CLIENT_ID/SECRET`
- **FSRS:** `FSRS_SERVICE_API_ENDPOINT` (must include `/api`), `FSRS_SERVICE_API_KEY`, `FSRS_SERVICE_PORT`
- **Question gen:** `QUESTION_GEN_SERVICE_API_ENDPOINT`, `QUESTION_GEN_SERVICE_API_KEY`
- **Answer analysis:** `ANSWER_ANALYSIS_SERVICE_API_ENDPOINT`, `ANSWER_ANALYSIS_SERVICE_API_KEY`
- **Paddle:** `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, price IDs
- **Admin:** `ADMIN_SECRET`, `ADMIN_PORT`
- **Docker:** `IMAGE_PREFIX`, `IMAGE_TAG`, `DOMAIN`
- **Crypto:** `TOKEN_ENCRYPTION_KEY` (for encrypting BYOK API keys at rest)

---

## 8. Next Steps — Where We Left Off

### Immediate priorities

1. **Fix known bugs in `fsrs-service`** (from last code review):

   - `getDueItems` `.where()` overwrite — needs single-pass condition building
   - `trackNote`/`trackTopic` cascade queries filtering by `chunk.userId` — should filter only by `noteId`/`topicId`
   - `trackChunk` `onConflictDoNothing` returning false-positive `tracked: true`
   - Review session showing placeholder text instead of actual chunk content (need to pipe `chunkContentMd` through the due items endpoint)

2. **Clean up dead code from Notion sync retirement** — remove dead Caddyfile webhook route, dead `NOTION_*` env vars from `.env.template`, dead Stripe routes (`apps/web/src/app/api/stripe/`).

3. **Staging environment parity** — the staging deploy script doesn't include `answer-analysis-service` or `admin`.

### In-progress work (uncommitted changes visible from working tree)

- Admin panel with analytics dashboard and AI model management
- Pricing service integration across AI operations
- Paddle subscription sync with billing dashboard
- BYOK toggle with Pass balance notifications
- 3D AI orb animation on landing page
- Lexical editor is now the **primary content authoring tool** (materials browser + review answers)

### Planned but not started

- **Analytics dashboard improvements** — heatmaps, retention curves, mastery views
- **Google Calendar push integration** — sync review schedules to calendar
- **Import/export** — now that Notion sync is retired, an alternative import mechanism for existing content may be needed
- **Full cleanup of Notion sync artifacts** — remove `notion_sync-service` app, dead API routes, dead env vars

---

## 9. Commands Cheat Sheet

```sh
# Install
pnpm install

# Serve (dev)
pnpm nx serve @temar/web
pnpm nx serve @temar/fsrs-service
pnpm nx serve @temar/question-gen-service
pnpm nx serve @temar/answer-analysis-service
pnpm nx serve @temar/notion_sync-service
pnpm nx serve @temar/admin

# Build
pnpm nx build <project>
pnpm nx run-many -t build        # all
pnpm nx affected -t build        # changed only

# Test / Lint
pnpm nx affected -t test
pnpm nx affected -t lint

# DB migrations
pnpm migrate                     # runs drizzle-kit migrate

# Docker (local)
docker compose -f docker-compose.dev.yml up

# Docker (prod-like)
docker build --target web-app-service -t temar-web .
docker build --target fsrs-service -t temar-fsrs .
```
