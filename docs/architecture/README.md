# Temar Architecture

Temar is a spaced-repetition learning platform. Users organize study material as **Topics > Notes > Chunks**, author content via a Lexical rich-text editor, and review it through AI-powered question generation and FSRS-based scheduling. The system is built as an Nx monorepo with a Next.js frontend, three NestJS microservices, and shared libraries, deployed via Docker to a VPS behind Caddy.

---

## Architecture at a Glance

| Application | Port | Purpose |
|---|---|---|
| `web` | 5173 | Next.js frontend — dashboard, materials browser, review sessions, billing |
| `fsrs-service` | 3334 | NestJS — FSRS scheduling engine, tracking cascades, review lifecycle |
| `question-gen-service` | 3335 | NestJS — LLM question + rubric generation per chunk |
| `answer-analysis-service` | 3336 | NestJS — LLM semantic answer evaluation, FSRS rating mapping |
| `admin` | 3000 | Next.js admin panel — analytics, AI model management |

| Library | Purpose |
|---|---|
| `@temar/db-client` | Drizzle ORM client, schema definitions, crypto utilities |
| `@temar/shared-types` | Cross-app TypeScript interfaces and DTOs |
| `@temar/pricing-service` | In-memory cached pricing engine, cost computation, usage recording |
| `@temar/payment-provider` | Strategy-pattern payment abstraction (Paddle adapter, Dodo stub) |
| `@temar/ui` | Shared shadcn/ui component library — 24 components used by both web and admin |

---

## Diagrams

| # | Diagram | Description |
|---|---|---|
| 01 | [System Overview](01-system-overview.md) | All applications, services, shared libraries, and external dependencies with communication patterns |
| 02 | [Database ER](02-database-er.md) | Full entity-relationship diagram — all tables, columns, and foreign key relationships |
| 03 | [Authentication](03-authentication.md) | better-auth flows: email/password signup, Google OAuth, session validation, protected routes |
| 04 | [Materials CRUD](04-materials-crud.md) | Topic/Note/Chunk hierarchy — create, edit (Lexical dual-storage), delete (cascade), lazy-load tree |
| 05 | [Tracking & Question Generation](05-tracking-question-gen.md) | Track click through pass check, FSRS service, question-gen service, LLM call, and back |
| 06 | [Review Session](06-review-session.md) | Full review cycle: question display, answer input, AI analysis, FSRS rating, review log |
| 07 | [FSRS Scheduling](07-fsrs-scheduling.md) | FSRS state machine (New/Learning/Review/Relearning), applyRating flow, getDueItems query |
| 08 | [Pass Billing](08-pass-billing.md) | Cost computation formula, pass availability check, atomic usage recording with cache |
| 09 | [Payment Lifecycle](09-payment-lifecycle.md) | Checkout, webhook processing, subscription events, monthly pass reset with rollover |
| 10 | [AI Provider Routing](10-ai-provider-routing.md) | Provider/model resolution chain, header propagation, BYOK fallbacks, dual model ID system |
| 11 | [Dashboard Data Pipeline](11-dashboard-data-pipeline.md) | 10 parallel DB queries, derived metrics, UTC date alignment, component data flow |
| 12 | [CI/CD & Deployment](12-cicd-deployment.md) | CI pipeline, Docker multi-stage build, GHCR push, VPS deploy, Caddy routing |

---

## Recommended Reading Order

**New to the project?** Start here:

1. **[System Overview](01-system-overview.md)** — understand all the moving parts
2. **[Database ER](02-database-er.md)** — learn the data model (referenced by every other diagram)
3. **[Authentication](03-authentication.md)** — understand how users are identified
4. **[Materials CRUD](04-materials-crud.md)** — the content hierarchy that everything else builds on

Then pick the area you're working on:

- **Review flow:** [Tracking & QGen](05-tracking-question-gen.md) → [Review Session](06-review-session.md) → [FSRS Scheduling](07-fsrs-scheduling.md)
- **Billing:** [Pass Billing](08-pass-billing.md) → [Payment Lifecycle](09-payment-lifecycle.md)
- **AI integration:** [AI Provider Routing](10-ai-provider-routing.md)
- **Dashboard:** [Dashboard Data Pipeline](11-dashboard-data-pipeline.md)
- **DevOps:** [CI/CD & Deployment](12-cicd-deployment.md)

---

## Viewing Mermaid Diagrams

- **GitHub** renders Mermaid blocks natively in markdown preview
- **VS Code** with the [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension
- **CLI** via `mmdc` from the `@mermaid-js/mermaid-cli` package
