# Temar

Temar is an Nx monorepo for a Notion-connected learning system: users manage topic/note/chunk content in Notion, while Temar syncs that content into Postgres and builds workflows for recall, scheduling, and analytics.

## Monorepo Overview

### Applications

- `apps/web` (`@temar/web`): Next.js frontend (dev server default: `5173`).
- `apps/notion_sync-service` (`@temar/notion_sync-service`): NestJS service that integrates with Notion APIs and webhooks.
- `apps/api` (`@temar/api`): NestJS API scaffold for broader domain/business API expansion.

### Libraries

- `libs/db-client`: Drizzle ORM client and schema definitions (`topic`, `note`, `chunk`, etc.).
- `libs/shared-types`: Shared type definitions for cross-app usage.

## Current Architecture (High Level)

1. `web` triggers actions (create/update/delete).
2. `notion_sync-service` performs Notion operations and receives webhooks.
3. Sync service writes canonical records to Postgres via `db-client`.
4. Sync service triggers web cache revalidation (`/api/revalidate`) so UI reflects Notion-side changes.

## Notion Sync Service Highlights

- Swagger docs available at: `/api/docs`
- API capabilities include:
  - create cascades: `POST /topic/create`, `POST /note/create`, `POST /chunk/create`
  - property updates: `PATCH /page/:pageId/properties`
  - content retrieval: `GET /block/:blockId/children_with_md`
  - deletion/archive flows: `DELETE /page/:pageId`, `DELETE /page/:pageId/cascade`
- Webhook events currently handled:
  - `page.created`
  - `page.properties_updated`
  - `page.content_updated`
  - `page.deleted`

## Planned Services

1. **Notion Sync Service** _(exists, partially built)_ — Evolve from REST-call model to **webhook-driven** real-time sync. Add status state machine (`ACTIVE`/`ARCHIVED`/`ORPHANED`) and robust content caching. **Webhooks are already working in production.**

2. **Question Generation Service** _(does not exist)_ — LLM-powered recall question + rubric generation per chunk. Triggered on new tracking or post-review. Requires a `recall_items` table.

3. **Answer Analysis Service** _(does not exist)_ — LLM-powered semantic evaluation of free-text answers (Plate.js JSON), mapped to FSRS ratings.

4. **FSRS Scheduling Service** _(does not exist)_ — Spaced-repetition engine for stability/difficulty/interval calculation with fuzzing, session lifecycle management, and Google Calendar push integration.

5. **Analytics & Restoration Service** _(does not exist)_ — Progress/mastery analytics (heatmaps, retention views) and Notion restoration for orphaned records from content cache.

## Local Development

### Prerequisites

- Node.js 20+
- pnpm (workspace uses `pnpm@10.x`)
- PostgreSQL

### Install

```sh
pnpm install
```

### Run apps

```sh
pnpm nx serve @temar/web
pnpm nx serve @temar/notion_sync-service
pnpm nx serve @temar/api
```

### Build apps

```sh
pnpm nx build @temar/web
pnpm nx build @temar/notion_sync-service
pnpm nx build @temar/api
```

## Essential Environment Variables

- `NOTION_SYNC_API_KEY` - shared API key between web and sync-service.
- `NOTION_SERVICE_API_ENDPOINT` - web app URL target for sync-service calls.
- `WEB_APP_URL` - sync-service callback target for cache revalidation (`/api/revalidate`).
- `NOTION_OAUTH_CLIENT_ID`, `NOTION_OAUTH_CLIENT_SECRET` - Notion OAuth credentials.
- `NOTION_SYNC_SERVICE_PORT` - port used by sync service (commonly `3333` in deployment).

For production/staging deployment env setup, see `docs/deployment.md`.

## Database and Migrations

- Drizzle config lives in `libs/db-client`.
- Run migrations with:

```sh
pnpm migrate
```

## Deployment

See the full operational guide in `docs/deployment.md` (Docker, Caddy, GHCR, VPS bootstrap, staging/prod rollout, rollback).
