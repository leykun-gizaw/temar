# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```sh
# Install
pnpm install

# Dev servers
pnpm nx serve @temar/web                      # Next.js frontend (port 5173)
pnpm nx serve @temar/fsrs-service              # FSRS service (port 3334)
pnpm nx serve @temar/question-gen-service      # Question gen (port 3335)
pnpm nx serve @temar/answer-analysis-service   # Answer analysis (port 3336)
pnpm nx serve @temar/admin                     # Admin panel (port 3000)

# Build
pnpm nx build @temar/web                       # single project
pnpm nx run-many -t build                      # all projects
pnpm nx affected -t build                      # changed only

# Test
pnpm nx test @temar/fsrs-service               # single project
pnpm nx affected -t test                       # changed only

# Lint
pnpm nx lint @temar/web                        # single project
pnpm nx affected -t lint                       # changed only

# DB migrations
pnpm migrate                                   # runs drizzle-kit migrate from libs/db-client

# Docker
docker compose -f docker-compose.dev.yml up    # local dev
docker build --target web-app-service -t temar-web .
docker build --target fsrs-service -t temar-fsrs .
```

---

## Architecture

**Temar** is a spaced-repetition learning platform. Users organize study material as **Topics -> Notes -> Chunks**, create content via a **Lexical rich-text editor**, and review it through AI-powered question generation and FSRS-based scheduling.

### Core data flow

```
User <-> Next.js (web) <-> NestJS microservices <-> PostgreSQL
              |                    |
         Lexical editor       LLM providers (via question-gen / answer-analysis)
         (content CRUD)
```

- **Monorepo:** Nx 22.x + pnpm workspaces
- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind 4 + shadcn/ui
- **Backend:** NestJS microservices, each with Swagger docs at `/api/docs`
- **Database:** PostgreSQL 16 + Drizzle ORM (schemas in `libs/db-client/src/schema/`)
- **AI:** Vercel AI SDK (`ai` package), multi-provider (OpenAI, Anthropic, Google), BYOK support
- **Editor:** Lexical (migrated from Plate.js) for both chunk content authoring and review answers
- **Payments:** Paddle v2 (migrated from Stripe), Pass-based billing
- **Deploy:** Docker multi-stage -> GHCR -> VPS + Caddy

### Applications (`apps/`)

| App                       | Port | Purpose                                                                    | Status                    |
| ------------------------- | ---- | -------------------------------------------------------------------------- | ------------------------- |
| `web`                     | 5173 | Next.js frontend -- dashboard, materials browser, review sessions, billing | **Active**                |
| `fsrs-service`            | 3334 | NestJS -- ts-fsrs engine, tracking cascades, review lifecycle              | **Active**                |
| `question-gen-service`    | 3335 | NestJS -- LLM question + rubric generation per chunk                       | **Active**                |
| `answer-analysis-service` | 3336 | NestJS -- LLM semantic answer evaluation, mapped to FSRS ratings           | **Active**                |
| `admin`                   | 3000 | Next.js admin panel -- analytics, AI model management                      | **Active**                |
| `notion_sync-service`     | 3333 | NestJS -- Notion sync (OAuth, webhooks, markdown conversion)               | **Retired, not deployed** |
| `api`                     | --   | NestJS API scaffold                                                        | **Vestigial, ignore**     |

### Libraries (`libs/`)

| Library           | Purpose                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `db-client`       | Drizzle ORM client, all schema definitions, crypto utilities, re-exported Drizzle operators  |
| `shared-types`    | Cross-app TypeScript interfaces and DTOs (`ModelConfig`, `OperationType`, etc.)              |
| `pricing-service` | In-memory cached pricing engine -- computes Pass costs, records usage with balance deduction |

### Inter-service communication

All HTTP REST with `x-api-key` headers. The web app calls services via server-side fetch wrappers (`fsrsServiceFetch`, `questionGenServiceFetch`, etc.) -- never from the browser. All NestJS services use `app.setGlobalPrefix('api')`, so endpoint env vars **must include `/api`** (e.g., `http://fsrs-service:3334/api`).

Authentication lives in the Next.js app via `better-auth`. Backend services have **no user session awareness** -- they authenticate callers via `x-api-key` and receive user identity via `x-user-id` headers.

### Dual data paths in the web app

1. **Server Actions** (`createChunk`, `updateChunkContent`, `deleteTopic`, etc.) -- write directly to DB via `dbClient`
2. **Next.js API routes** (`/api/topics/[topicId]/notes`, `/api/notes/[noteId]/chunks`) -- tree sidebar fetches children lazily via client-side `fetch()`

Schema changes can break both microservices AND the web app's direct DB access.

### Lexical dual-storage model

Chunks store content in two columns: `content_json` (Lexical `SerializedEditorState` as JSONB, source of truth) and `content_markdown` (derived via `lexicalToMarkdown()` at save time, used for AI prompts, review display, and search).

### Database schema (key relationships)

```
user (better-auth)
 +-- pass_balance (1:1)
 +-- pass_transaction (1:N)
 +-- ai_usage_log (1:N)
 +-- topic (1:N)
      +-- note (1:N)
           +-- chunk (1:N)
                +-- recall_item (1:1 per user, FSRS card state)
                     +-- review_log (1:N, append-only)

ai_models -> ai_model_pricing (versioned, append-only)
          -> ai_markup_config (versioned, append-only)
```

Key constraints: `recall_item` unique on `(chunk_id, user_id)`. All Notion-sourced tables use Notion page UUIDs as PKs. `ai_model_pricing` and `ai_markup_config` are append-only with `effective_from`/`effective_to`.

The `dbClient` is a singleton import from `@temar/db-client`, not NestJS DI-injected. Testing requires mocking the module export.

---

## Critical Build Gotchas

### 1. Library bundling (most common build breakage)

pnpm workspace symlinks (`node_modules/@temar/*`) conflict with lib tsconfigs during Docker/webpack builds. The fix has multiple parts:

- **`tsconfig.base.json` path aliases** resolve `@temar/*` imports directly to `libs/*/src/index.ts`
- **`rm -rf node_modules/@temar`** in every Dockerfile builder stage forces webpack to use path aliases
- **`rm -rf libs/*/tsconfig*.json`** in NestJS builder stages prevents `composite: true` interference
- **`extensionAlias`** in `next.config.js` maps `.js` imports to `.ts`/`.tsx` (required by `module: "nodenext"`)
- **`safeWithNx`** wrapper in `next.config.js` handles CI/Docker Nx project graph failures
- **Service `tsconfig.app.json`** must explicitly `include` lib source paths and add `references`

**When adding a new `@temar/*` library or service**, update ALL of:

1. `tsconfig.base.json` -- path alias
2. `Dockerfile` -- COPY + rm -rf commands in relevant stages
3. `docker-compose.prod.yml` -- service entry
4. `.github/workflows/deploy.yml` -- build matrix + `docker compose up -d`
5. Service `tsconfig.app.json` -- include + references
6. Deps stage -- COPY the new `package.json`

### 2. Drizzle `$dynamic()` `.where()` overwrites (not appends)

Each `.where()` call on a `$dynamic()` query **replaces** the previous filter. Accumulate conditions in an array, then apply a single `.where(and(...conditions))`.

### 3. `NEXT_PUBLIC_*` env vars in Docker

Statically inlined at build time. Use bracket notation `process.env['NEXT_PUBLIC_X']` to prevent inlining, or pass values from server-side at runtime.

### 4. `onConflictDoNothing` masks insert feedback

Returns no error on duplicates, so code returning `{ success: true }` unconditionally gives false positives. Use `.onConflictDoUpdate()`, check row count, or use `.returning()`.

### 5. Chunk `userId` filtering in cascade queries

`chunk.userId` is nullable (from Notion sync era) and may not match current user. In cascade operations (trackNote, trackTopic), filter by noteId/topicId only -- user ownership is enforced at the `recallItem` level.

---

## Dead Code

- **`apps/notion_sync-service/`** -- retired, not deployed. Caddyfile still has dead `/api/webhook/*` route.
- **`apps/api/`** and **`apps/api-e2e/`** -- vestigial scaffolds, not deployed.
- **`apps/web/src/app/api/stripe/`** -- replaced by Paddle, dead route handlers.
- **`NOTION_*` env vars** -- unused since sync retirement.

## Environment Variables

Full list in `.env.template`. Critical note: service endpoint vars (e.g., `FSRS_SERVICE_API_ENDPOINT`) **must include `/api`** suffix. Paddle sandbox uses different CDN (`sandbox-cdn.paddle.com`) and `test_` prefixed tokens.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
