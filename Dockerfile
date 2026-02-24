# STAGE 1: Base Image
# Common base for all other stages
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ----------------------------------------------

# STAGE 2: Dependencies
# Install all monorepo dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json ./
COPY apps/web/package.json apps/web/
COPY apps/notion_sync-service/package.json apps/notion_sync-service/
COPY apps/fsrs-service/package.json apps/fsrs-service/
COPY apps/question-gen-service/package.json apps/question-gen-service/
COPY libs/db-client/package.json libs/db-client/
COPY libs/shared-types/package.json libs/shared-types/
RUN pnpm install --frozen-lockfile

# ----------------------------------------------

# STAGE 4: Builder
# Build the 'web' application for production
FROM deps AS web-app-builder
# Copy relevant source code
COPY apps/web ./apps/web
# Build the 'web' application
RUN NX_DAEMON=false pnpm nx build web --prod --verbose

FROM deps AS notion-sync-builder
# Copy relevant source code
COPY apps/notion_sync-service ./apps/notion_sync-service
# Build 'notion_sync-service'
RUN NX_DAEMON=false pnpm nx build notion_sync-service --prod

FROM deps AS fsrs-service-builder
# Copy relevant source code
COPY apps/fsrs-service ./apps/fsrs-service
# Build 'fsrs-service'
RUN NX_DAEMON=false pnpm nx build fsrs-service --prod

FROM deps AS question-gen-service-builder
# Copy relevant source code
COPY apps/question-gen-service ./apps/question-gen-service
# Build 'question-gen-service'
RUN NX_DAEMON=false pnpm nx build question-gen-service --prod

# ----------------------------------------------

# STAGE 4.5a: Notion Sync Service Production Dependencies
FROM base AS notion-prod-deps
COPY --from=notion-sync-builder /app/dist/apps/notion_sync-service/package.json ./
COPY --from=notion-sync-builder /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --filter notion_sync-service --prod

# STAGE 4.5b: FSRS Service Production Dependencies
FROM base AS fsrs-prod-deps
COPY --from=fsrs-service-builder /app/dist/apps/fsrs-service/package.json ./
COPY --from=fsrs-service-builder /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --filter fsrs-service --prod

# STAGE 4.5c: Question Gen Service Production Dependencies
FROM base AS questiongen-prod-deps
COPY --from=question-gen-service-builder /app/dist/apps/question-gen-service/package.json ./
COPY --from=question-gen-service-builder /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --filter question-gen-service --prod

# ----------------------------------------------

# STAGE 5: Web App Production Runner
# Create the final, minimal production image
FROM base AS web-app-service
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=web-app-builder --chown=nextjs:nodejs /app/dist/apps/web/.next/standalone ./

# Copy the public and static assets to where distDir resolves
COPY --from=web-app-builder --chown=nextjs:nodejs /app/dist/apps/web/public ./apps/web/public
COPY --from=web-app-builder --chown=nextjs:nodejs /app/dist/apps/web/.next/static ./dist/apps/web/.next/static

USER nextjs

EXPOSE 5173
ENV PORT=5173

# Switch to server.js directory
WORKDIR /app/apps/web

# Run the app
CMD ["node", "server.js"]

# ----------------------------------------------

# STAGE 6: Notion Service Production Runner (NestJS)
FROM base AS notion_sync-service
ENV NODE_ENV=production
RUN addgroup --system --gid 1002 nestjs && adduser --system --uid 1002 nestuser

COPY --from=notion-sync-builder --chown=nestuser:nestjs /app/dist/apps/notion_sync-service ./
COPY --from=notion-prod-deps --chown=nestuser:nestjs /app/node_modules ./node_modules

USER nestuser

EXPOSE 3333
CMD [ "node", "main.js" ]

# ----------------------------------------------

# STAGE 7: FSRS Service Production Runner (NestJS)
FROM base AS fsrs-service
ENV NODE_ENV=production
RUN addgroup --system --gid 1003 nestjs && adduser --system --uid 1003 fsrsuser

COPY --from=fsrs-service-builder --chown=fsrsuser:nestjs /app/dist/apps/fsrs-service ./
COPY --from=fsrs-prod-deps --chown=fsrsuser:nestjs /app/node_modules ./node_modules

USER fsrsuser

EXPOSE 3334
CMD [ "node", "main.js" ]

# ----------------------------------------------

# STAGE 8: Question Gen Service Production Runner (NestJS)
FROM base AS question-gen-service
ENV NODE_ENV=production
RUN addgroup --system --gid 1004 nestjs && adduser --system --uid 1004 qgenuser

COPY --from=question-gen-service-builder --chown=qgenuser:nestjs /app/dist/apps/question-gen-service ./
COPY --from=questiongen-prod-deps --chown=qgenuser:nestjs /app/node_modules ./node_modules

USER qgenuser

EXPOSE 3335
CMD [ "node", "main.js" ]

# STAGE 9: Migration Service Runner
FROM base AS migration
COPY libs/db-client/package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --filter db-client --prod
COPY libs/db-client/src/drizzle ./src/drizzle
COPY libs/db-client/drizzle.docker.config.ts ./drizzle.config.ts
CMD [ "pnpm", "drizzle-kit", "migrate", "--config=drizzle.config.ts" ]