# System Architecture Overview

## 1. High-Level System Architecture

```mermaid
flowchart TD
    %% ── External actors ──────────────────────────────────
    User([User / Browser])
    Admin([Admin])

    %% ── Edge layer ───────────────────────────────────────
    subgraph Edge ["Edge Layer"]
        Caddy["Caddy\nReverse Proxy + TLS"]
    end

    %% ── Application layer ────────────────────────────────
    subgraph Apps ["Application Layer"]
        Web["web\nNext.js 15 &bull; :5173\nDashboard, Materials Browser,\nReview Sessions, Billing"]
        AdminApp["admin\nNext.js &bull; :3000\nAnalytics, AI Model Mgmt,\nPricing Config"]
        FSRS["fsrs-service\nNestJS &bull; :3334\nFSRS Scheduling,\nTracking Cascades,\nReview Lifecycle"]
        QGen["question-gen-service\nNestJS &bull; :3335\nLLM Question &\nRubric Generation"]
        AAna["answer-analysis-service\nNestJS &bull; :3336\nLLM Answer Evaluation,\nFSRS Rating Mapping"]
    end

    %% ── Data layer ───────────────────────────────────────
    subgraph Data ["Data Layer"]
        PG[("PostgreSQL 16\nDrizzle ORM")]
    end

    %% ── External services ────────────────────────────────
    subgraph External ["External Services"]
        LLM["LLM Providers\nGoogle Gemini &bull; OpenAI\nAnthropic &bull; DeepSeek\n(via Vercel AI SDK)"]
        Payments["Payment Providers\nPaddle v2 &bull; Dodo Payments\n(via @temar/payment-provider)"]
        BetterAuth["better-auth\nSession Management\n(in-process, web app)"]
    end

    %% ── User flows ───────────────────────────────────────
    User -->|HTTPS| Caddy
    Admin -->|HTTPS| AdminApp
    Caddy -->|"all routes"| Web
    Caddy -->|"/api/webhooks/*"| Web

    %% ── Web app → microservices (server-side only) ───────
    Web -- "fsrsServiceFetch\nx-api-key, x-user-id" --> FSRS
    Web -- "questionGenServiceFetch\nx-api-key, x-user-id,\nx-ai-provider, x-ai-model,\nx-ai-api-key, x-byok" --> QGen
    Web -- "analysisServiceFetch\nx-api-key, x-user-id,\nx-ai-provider, x-ai-model,\nx-ai-api-key, x-byok" --> AAna

    %% ── Dual data paths in web app ───────────────────────
    Web -- "Server Actions\n(direct writes)" --> PG
    Web -. "API Routes\n(lazy tree fetches)" .-> PG

    %% ── Microservice → DB ────────────────────────────────
    FSRS --> PG
    QGen --> PG
    AAna --> PG
    AdminApp --> PG

    %% ── LLM access ──────────────────────────────────────
    QGen --> LLM
    AAna --> LLM

    %% ── Payments ─────────────────────────────────────────
    Payments -- "webhooks" --> Web

    %% ── Auth ─────────────────────────────────────────────
    Web --- BetterAuth

    %% ── Styling ──────────────────────────────────────────
    classDef app fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef svc fill:#8b5cf6,stroke:#5b21b6,color:#fff
    classDef db fill:#f59e0b,stroke:#b45309,color:#fff
    classDef ext fill:#10b981,stroke:#047857,color:#fff
    classDef edge fill:#64748b,stroke:#334155,color:#fff

    class Web,AdminApp app
    class FSRS,QGen,AAna svc
    class PG db
    class LLM,Payments,BetterAuth ext
    class Caddy edge
```

### Key architectural patterns

**Server-side-only service calls.** The web app communicates with NestJS microservices exclusively from the server (all fetch wrappers are marked `'use server'`). The browser never talks to backend services directly. This keeps API keys and service URLs out of client bundles.

**Stateless backend services.** The NestJS microservices have no user session awareness. Authentication is handled entirely by `better-auth` inside the Next.js app. Backend services authenticate callers via `x-api-key` and receive user identity through the `x-user-id` header.

**Dual data paths.** The web app accesses PostgreSQL in two ways:
1. **Server Actions** (`createChunk`, `updateChunkContent`, `deleteTopic`, etc.) write directly via `dbClient`.
2. **API Routes** (`/api/topics/[topicId]/notes`, `/api/notes/[noteId]/chunks`) serve lazy-loaded tree sidebar data via client-side `fetch()`.

**BYOK (Bring Your Own Key).** Users can supply their own LLM API keys. The web app forwards them to question-gen and answer-analysis services via `x-ai-provider`, `x-ai-model`, `x-ai-api-key`, and `x-byok` headers.

**Global API prefix.** All NestJS services use `app.setGlobalPrefix('api')`, so endpoint environment variables (e.g. `FSRS_SERVICE_API_ENDPOINT`) must include the `/api` suffix.

---

## 2. Shared Library Dependency Graph

```mermaid
flowchart TD
    %% ── Libraries ────────────────────────────────────────
    SharedTypes["@temar/shared-types\nTypeScript interfaces & DTOs\nModelConfig, OperationType,\nquestion schemas"]
    DbClient["@temar/db-client\nDrizzle ORM client,\nall schema definitions,\ncrypto utilities"]
    PricingSvc["@temar/pricing-service\nIn-memory cached pricing,\ncost computation,\nusage recording"]
    PaymentProv["@temar/payment-provider\nStrategy-pattern abstraction\nPaddle adapter, Dodo stub,\nshared event handler"]
    UI["@temar/ui\nShared shadcn/ui components\n24 components: Button, Card,\nDialog, Table, Pagination, etc."]

    %% ── Library interdependencies ────────────────────────
    PricingSvc --> DbClient
    PricingSvc --> SharedTypes
    PaymentProv --> DbClient
    PaymentProv --> SharedTypes
    PaymentProv --> PricingSvc

    %% ── Application consumers ────────────────────────────
    subgraph Consumers ["Application Consumers"]
        Web["web"]
        AdminApp["admin"]
        FSRS["fsrs-service"]
        QGen["question-gen-service"]
        AAna["answer-analysis-service"]
    end

    Web --> DbClient
    Web --> SharedTypes
    Web --> PricingSvc
    Web --> PaymentProv
    Web --> UI

    AdminApp --> DbClient
    AdminApp --> SharedTypes
    AdminApp --> PricingSvc
    AdminApp --> UI

    FSRS --> DbClient

    QGen --> DbClient
    QGen --> SharedTypes
    QGen --> PricingSvc

    AAna --> DbClient
    AAna --> SharedTypes
    AAna --> PricingSvc

    %% ── Styling ──────────────────────────────────────────
    classDef lib fill:#f97316,stroke:#c2410c,color:#fff
    classDef app fill:#3b82f6,stroke:#1e40af,color:#fff

    class SharedTypes,DbClient,PricingSvc,PaymentProv,UI lib
    class Web,AdminApp,FSRS,QGen,AAna app
```

### Library roles and relationships

| Library | Dependencies | Consumed by | Purpose |
|---|---|---|---|
| `@temar/shared-types` | None (leaf) | web, admin, question-gen, answer-analysis | Pure TypeScript types shared across the entire monorepo. Zero runtime dependencies. |
| `@temar/db-client` | None (leaf among `@temar/*`) | All 5 apps, pricing-service, payment-provider | Single source of truth for all Drizzle schema definitions. Exports `dbClient` singleton, table references, query operators (`eq`, `and`, `inArray`, `sql`), and crypto utilities (`encrypt`/`decrypt`). |
| `@temar/pricing-service` | db-client, shared-types | web, admin, question-gen, answer-analysis | In-memory cached pricing engine. Computes per-operation costs using active model pricing + markup configs, and records usage with balance deduction. |
| `@temar/payment-provider` | db-client, shared-types, pricing-service | web | Strategy-pattern abstraction that decouples billing logic from specific payment providers. Ships a Paddle adapter (production) and a Dodo Payments stub. The shared event handler normalizes webhook events and delegates to `pricing-service` for cost calculations. |
| `@temar/ui` | None (leaf) | web, admin | 24 shared shadcn/ui components (Button, Card, Dialog, Table, Pagination, etc.) with design-system fixes applied. Eliminates component duplication between web and admin. Requires Tailwind v4 `@source` directive in consuming apps' CSS. |

### Dependency layering

The libraries form a clean DAG with three leaf nodes:

```
shared-types (leaf)     db-client (leaf)      ui (leaf)
       \                   /    \              /    \
        \                 /      \            /      \
       pricing-service --+       |       web --+-- admin
              \                  |
               \                 |
            payment-provider ----+
```

`shared-types`, `db-client`, and `ui` are fully independent leaf nodes. `ui` is a pure frontend library with no `@temar/*` dependencies — it only depends on Radix UI, Tailwind utilities, and lucide-react. `pricing-service` depends on both `shared-types` and `db-client`. `payment-provider` sits at the top of the backend dependency chain. Schema changes in `db-client` can ripple through every library and application in the monorepo.
