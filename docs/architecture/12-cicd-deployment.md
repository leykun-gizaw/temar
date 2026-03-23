# CI/CD & Deployment

## 1. CI Pipeline

Triggered on every push to the `dev` branch. Uses Nx `affected` to only lint, test, and build projects changed since the last successful CI run.

```mermaid
flowchart TD
    Trigger["Push to dev branch"]

    subgraph CI ["CI Job: Lint & Test"]
        C1["Checkout code\n(fetch-depth: 0)"]
        C2["Setup pnpm + Node 20\n(with pnpm cache)"]
        C3["pnpm install\n--frozen-lockfile"]
        C4["Derive NX SHAs\n(nrwl/nx-set-shas)"]
        C5["pnpm nx affected\n-t lint --parallel=3"]
        C6["pnpm nx affected\n-t test --parallel=3"]
        C7["pnpm nx affected\n-t build --parallel=3"]
    end

    Trigger --> C1 --> C2 --> C3 --> C4 --> C5 --> C6 --> C7

    style Trigger fill:#f9f,stroke:#333
```

**Key details:**
- Concurrency group `ci-${{ github.ref }}` with `cancel-in-progress: true` -- newer pushes cancel stale runs
- `fetch-depth: 0` required for Nx affected comparison against base SHA
- `NODE_OPTIONS: "--stack-trace-limit=100"` set on the build step for debugging

## 2. Deploy Pipeline

Triggered on push to `main` or `staging`, plus manual `workflow_dispatch`. Builds Docker images in a matrix, then deploys to the VPS.

```mermaid
flowchart TD
    Trigger["Push to main or staging\n(or workflow_dispatch)"]

    subgraph BuildJob ["Job: Build & Push Images (matrix)"]
        direction TB
        M1["web-app-service\n-> temar-web-app"]
        M2["fsrs-service\n-> temar-fsrs"]
        M3["question-gen-service\n-> temar-question-gen"]
        M4["answer-analysis-service\n-> temar-answer-analysis"]
        M5["migration\n-> temar-migrate"]

        subgraph Steps ["Per-target steps"]
            B1["Checkout"]
            B2["Setup Docker Buildx"]
            B3["Login to GHCR"]
            B4["Determine tags\n:latest + :sha-{short}"]
            B5["docker build\n--target {target}"]
            B6["Push to GHCR\n(GHA layer cache)"]
        end

        M1 & M2 & M3 & M4 & M5 --> B1
        B1 --> B2 --> B3 --> B4 --> B5 --> B6
    end

    subgraph DeployJob ["Job: Deploy to VPS (main only)"]
        D1["SCP Caddyfile +\ndocker-compose.prod.yml\nto /opt/temar/"]
        D2["SSH: docker login ghcr.io"]
        D3["SSH: docker compose pull\n--ignore-pull-failures"]
        D4["SSH: docker compose up migrate\n--abort-on-container-exit"]
        D5["SSH: docker compose up -d\nweb, fsrs, question-gen,\nanswer-analysis, caddy, appsmith"]
        D6["SSH: docker image prune -f"]
    end

    subgraph StagingJob ["Job: Deploy to VPS (staging only)"]
        S1["SSH: docker login ghcr.io"]
        S2["SSH: docker compose pull"]
        S3["SSH: run migrations"]
        S4["SSH: docker compose up -d\nweb, fsrs, question-gen, caddy"]
        S5["SSH: docker image prune -f"]
    end

    Trigger --> BuildJob
    BuildJob --> DeployJob
    BuildJob --> StagingJob

    style Trigger fill:#f9f,stroke:#333
```

**Key details:**
- Concurrency group `deploy-${{ github.ref_name }}` with `cancel-in-progress: false` -- deploys never cancel mid-flight
- Image tags: `:latest` (main) or `:staging` (staging branch) + `:sha-{7char}`
- GHA cache scoped per image name (`cache-from: type=gha,scope=${{ matrix.image_name }}`)
- Migration runs as a one-shot container (`--abort-on-container-exit`) before services start

## 3. Dockerfile Multi-Stage Architecture

All services share a single `Dockerfile` with a multi-stage dependency tree. Each final stage is a minimal production image.

```mermaid
flowchart TD
    base["base\nnode:20-alpine\ncorepack enable pnpm"]

    deps["deps\npnpm install --frozen-lockfile\n(all monorepo package.jsons)"]

    base --> deps

    subgraph Builders ["Builder Stages"]
        WB["web-app-builder\nNX_DAEMON=false\npnpm nx build web --prod"]
        FB["fsrs-service-builder\npnpm nx build\nfsrs-service --prod"]
        QB["question-gen-service-builder\npnpm nx build\nquestion-gen-service --prod"]
        AB["answer-analysis-service-builder\npnpm nx build\nanswer-analysis-service --prod"]
        AdB["admin-builder\npnpm nx build\nadmin --prod"]
    end

    subgraph ProdDeps ["Prod Dependency Stages"]
        FPD["fsrs-prod-deps\npnpm install --prod"]
        QPD["questiongen-prod-deps\npnpm install --prod"]
        APD["answer-analysis-prod-deps\npnpm install --prod"]
    end

    subgraph Runners ["Final Runner Stages"]
        WR["web-app-service\nport 5173\nnode server.js"]
        FR["fsrs-service\nport 3334\nnode main.js"]
        QR["question-gen-service\nport 3335\nnode main.js"]
        AR["answer-analysis-service\nport 3336\nnode main.js"]
        AdR["admin-service\nport 3000\nnode server.js"]
        MR["migration\ndrizzle-kit migrate\n(runs and exits)"]
    end

    deps --> WB --> WR
    deps --> FB --> FPD --> FR
    deps --> QB --> QPD --> QR
    deps --> AB --> APD --> AR
    deps --> AdB --> AdR
    deps --> MR
```

### Builder stage gotchas

| Technique | Why |
|-----------|-----|
| `rm -rf node_modules/@temar` | Forces webpack to resolve `@temar/*` via `tsconfig.base.json` path aliases instead of pnpm workspace symlinks |
| `rm -rf libs/*/tsconfig*.json` | Prevents NestJS builder from honoring `composite: true` in lib tsconfigs, which breaks webpack resolution |
| `NX_DAEMON=false` | Docker builds cannot run a background Nx daemon process |
| Next.js `output: 'standalone'` | Produces minimal bundle, but `public/` and `.next/static` must be manually copied to the runner stage |
| Separate prod-deps stages | NestJS runners need `node_modules` (unlike Next.js standalone); a dedicated stage installs only production deps from the built `package.json` |

## 4. Production Infrastructure

All containers run on a single VPS behind Caddy, connected via a Docker bridge network.

```mermaid
flowchart LR
    Internet(("Internet"))

    subgraph VPS ["VPS (/opt/temar)"]
        subgraph Edge ["Edge"]
            Caddy["Caddy\nTLS termination\nports 80/443"]
        end

        subgraph Services ["temar-network (bridge)"]
            Web["web\nNext.js :5173"]
            FSRS["fsrs-service\n:3334"]
            QGen["question-gen-service\n:3335"]
            AAna["answer-analysis-service\n:3336"]
            Admin["admin\nNext.js :3000"]
            DB[("PostgreSQL\n:5432")]
            Appsmith["Appsmith\n:80"]
        end
    end

    Internet -->|HTTPS| Caddy
    Caddy -->|"/* and\n/api/webhooks/*"| Web
    Caddy -->|"admin.temar\n.leyk14.com"| Appsmith

    Web -->|"fsrsServiceFetch\nx-api-key"| FSRS
    Web -->|"analysisServiceFetch\nx-api-key"| AAna
    FSRS -->|"questionGenServiceFetch\nx-api-key"| QGen

    Web --> DB
    FSRS --> DB
    QGen --> DB
    AAna --> DB
    Admin --> DB
```

### Caddy routing rules

| Rule | Target | Purpose |
|------|--------|---------|
| `/api/webhooks/*` | `web:5173` | Payment provider webhook endpoints |
| `/*` (default) | `web:5173` | All other web traffic |
| `admin.temar.leyk14.com` | `appsmith:80` | Admin/analytics panel |

### Service communication

All inter-service calls are server-side HTTP REST with `x-api-key` headers. Services are **never** exposed to the internet -- only Caddy's ports 80/443 are published. Services reach each other by Docker DNS names (`web`, `fsrs-service`, etc.) on the `temar-network` bridge.

### Database access

All services connect to PostgreSQL via the `temar-network` bridge. The `db` service exposes port 5432 only to the Docker network (host port mapping configurable via `DATABASE_PORT` env var). Health checks ensure services don't start until PostgreSQL is ready.

## Key Source Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI workflow (lint, test, build on `dev`) |
| `.github/workflows/deploy.yml` | Deploy workflow (build images, push to GHCR, deploy to VPS) |
| `Dockerfile` | Multi-stage build for all services |
| `docker-compose.prod.yml` | Production compose (all services + Caddy + PostgreSQL) |
| `docker-compose.dev.yml` | Local development compose |
| `Caddyfile` | Reverse proxy configuration + TLS |
| `tsconfig.base.json` | Path aliases that Docker builds depend on |
