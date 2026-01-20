# Multi-stage Dockerfile for apps/notion_sync-service (monorepo + pnpm + nx + webpack)

FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache git python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root workspace files and app package.json so pnpm can resolve workspace deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/notion_sync-service/package.json apps/notion_sync-service/package.json

# Install all deps (dev deps required for build)
RUN pnpm install --frozen-lockfile

# Copy source and build the app via Nx/webpack
COPY . .
RUN pnpm -w exec nx run @temar/notion_sync-service:build --configuration=production

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built artifacts
COPY --from=base /app/apps/notion_sync-service/dist ./dist

# Copy root lockfile/package so pnpm can install production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

EXPOSE 3333
CMD ["node", "dist/main.js"]