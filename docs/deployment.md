# Temar — Deployment Guide

## Prerequisites

- A VPS with Docker and Docker Compose installed
- A domain name pointing to the VPS IP (A record)
- A GitHub repository with GHCR enabled (automatic for public/private repos)

---

## 1. GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in your GitHub repo and add:

| Secret        | Value                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `VPS_HOST`    | Your VPS IP address or hostname                                                                |
| `VPS_USER`    | SSH user on the VPS (e.g. `deploy`)                                                            |
| `VPS_SSH_KEY` | Private SSH key (the VPS has the public key in `~/.ssh/authorized_keys`)                       |
| `GHCR_PAT`    | GitHub Personal Access Token with `read:packages` scope (used by VPS to pull images from GHCR) |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions for building/pushing images in CI. However, it **cannot** be forwarded over SSH to the VPS, so the VPS uses `GHCR_PAT` to authenticate with GHCR.
>
> To create the PAT: **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens** → create one with `read:packages` permission scoped to your repo.

---

## 2. VPS Bootstrap (One-time Setup)

SSH into your VPS and run:

```bash
# Create project directories
sudo mkdir -p /opt/temar
sudo mkdir -p /opt/temar-staging

# Set ownership to your deploy user
sudo chown -R $USER:$USER /opt/temar /opt/temar-staging
```

### Production (`/opt/temar/`)

```bash
cd /opt/temar

# Copy these files from the repo (or scp them):
# - docker-compose.prod.yml
# - Caddyfile

# Create the .env file with your production secrets
cat > .env << 'EOF'
# Auth
BETTER_AUTH_URL=https://yourdomain.com
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_TRUSTED_ORIGINS=https://yourdomain.com

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google

GH_CLIENT_ID=
GH_CLIENT_SECRET=

# Database
DATABASE_HOST=db
DATABASE_USER=temar
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=temar
DATABASE_PORT=5432

# Notion
NOTION_SYNC_SERVICE_PORT=3333
NOTION_INTEGRATION_SECRET=your-notion-secret
NOTION_SERVICE_API_ENDPOINT=http://notion_sync-service:3333

# Docker images
IMAGE_PREFIX=ghcr.io/YOUR_GITHUB_USERNAME/temar
IMAGE_TAG=latest

# Caddy
DOMAIN=yourdomain.com
EOF
```

### Staging (`/opt/temar-staging/`)

Same structure but with staging values:

```bash
cd /opt/temar-staging

# Copy docker-compose.prod.yml and Caddyfile here too

# Create .env with staging values
# Key differences:
#   IMAGE_TAG=staging
#   DOMAIN=staging.yourdomain.com
#   BETTER_AUTH_URL=https://staging.yourdomain.com
#   DATABASE_NAME=temar_staging
```

---

## 3. First Deploy

After the GitHub Actions workflow runs and pushes images to GHCR:

```bash
cd /opt/temar

# Log in to GHCR
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull images
docker compose -f docker-compose.prod.yml pull

# Start DB first and wait for healthy
docker compose -f docker-compose.prod.yml up -d db
docker compose -f docker-compose.prod.yml up migrate --abort-on-container-exit

# Start all services
docker compose -f docker-compose.prod.yml up -d web notion_sync-service caddy
```

---

## 4. How CI/CD Works

### On Pull Request (to `dev`, `staging`, or `main`)

- **ci.yml** runs lint and tests via `nx affected`

### On Push to `staging`

- **deploy.yml** builds all Docker images → pushes to GHCR with `:staging` tag → SSHs into VPS → pulls and restarts at `/opt/temar-staging/`

### On Push to `main`

- **deploy.yml** builds all Docker images → pushes to GHCR with `:latest` + `:sha-<commit>` tags → SSHs into VPS → runs migrations → pulls and restarts at `/opt/temar/`

### Image Tags

| Branch    | Tags applied             |
| --------- | ------------------------ |
| `main`    | `latest`, `sha-abc1234`  |
| `staging` | `staging`, `sha-abc1234` |

---

## 5. Rollback

To roll back to a previous version:

```bash
cd /opt/temar

# Edit .env and set IMAGE_TAG to the sha tag of the known-good commit
# e.g. IMAGE_TAG=sha-abc1234

docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d web notion_sync-service
```

---

## 6. Useful Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f caddy

# Restart a single service
docker compose -f docker-compose.prod.yml restart web

# Full teardown (preserves volumes)
docker compose -f docker-compose.prod.yml down

# Full teardown (destroys volumes — DATA LOSS)
docker compose -f docker-compose.prod.yml down -v
```

---

## 7. Architecture

```
Internet
  │
  ▼
Caddy (:80/:443) ─── automatic TLS via Let's Encrypt
  │
  ├── yourdomain.com  →  web:5173  (Next.js standalone)
  │
  └── (internal)      →  notion_sync-service:3333  (NestJS)
                              │
                              ▼
                          db:5432  (PostgreSQL 16)
```
