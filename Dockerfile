# STAGE 1: Base Image
# Common base for all other stages
FROM node:20-alpine AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.23.0 --activate

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
COPY apps/answer-analysis-service/package.json apps/answer-analysis-service/
COPY apps/admin/package.json apps/admin/
COPY libs/db-client/package.json libs/db-client/
COPY libs/pricing-service/package.json libs/pricing-service/
COPY libs/payment-provider/package.json libs/payment-provider/
COPY libs/shared-types/package.json libs/shared-types/
COPY libs/ui/package.json libs/ui/
RUN pnpm install --frozen-lockfile

# ----------------------------------------------

# STAGE 4: Builder
# Build the 'web' application for production
FROM deps AS web-app-builder
# Copy relevant source code
COPY apps/web ./apps/web
COPY tsconfig.base.json ./
COPY eslint.config.mjs ./
COPY libs/db-client ./libs/db-client
COPY libs/pricing-service ./libs/pricing-service
COPY libs/payment-provider ./libs/payment-provider
COPY libs/shared-types ./libs/shared-types
COPY libs/ui ./libs/ui
# Remove workspace symlinks so webpack bundles @temar/* from source via tsconfig paths
RUN rm -rf node_modules/@temar
# Build the 'web' application
RUN NX_DAEMON=false pnpm nx build web --prod --verbose

FROM deps AS notion-sync-builder
# Copy relevant source code
COPY /tsconfig.base.json ./
COPY libs/db-client ./libs/db-client
COPY apps/notion_sync-service ./apps/notion_sync-service
# Remove workspace symlinks and db-client project tsconfigs so webpack
# bundles @temar/* from source via the service tsconfig paths only
RUN rm -rf node_modules/@temar libs/db-client/tsconfig*.json
# Build 'notion_sync-service'
RUN NX_DAEMON=false pnpm nx build notion_sync-service --prod

FROM deps AS fsrs-service-builder
# Copy relevant source code
COPY /tsconfig.base.json ./
COPY libs/pricing-service ./libs/pricing-service
COPY libs/shared-types ./libs/shared-types
COPY libs/db-client ./libs/db-client
COPY apps/fsrs-service ./apps/fsrs-service
# Remove workspace symlinks and lib project tsconfigs so webpack
# bundles @temar/* from source via the service tsconfig paths only
RUN rm -rf node_modules/@temar libs/pricing-service/tsconfig*.json libs/shared-types/tsconfig*.json libs/db-client/tsconfig*.json
# Build 'fsrs-service'
RUN NX_DAEMON=false pnpm nx build fsrs-service --prod

FROM deps AS question-gen-service-builder
# Copy relevant source code
COPY apps/question-gen-service ./apps/question-gen-service
COPY /tsconfig.base.json ./
COPY libs/pricing-service ./libs/pricing-service
COPY libs/shared-types ./libs/shared-types
COPY libs/db-client ./libs/db-client
# Remove workspace symlinks and lib project tsconfigs so webpack
# bundles @temar/* from source via the service tsconfig paths only
RUN rm -rf node_modules/@temar libs/pricing-service/tsconfig*.json libs/shared-types/tsconfig*.json libs/db-client/tsconfig*.json
# Build 'question-gen-service'
RUN NX_DAEMON=false pnpm nx build question-gen-service --prod

FROM deps AS answer-analysis-service-builder
# Copy relevant source code
COPY apps/answer-analysis-service ./apps/answer-analysis-service
COPY /tsconfig.base.json ./
COPY libs/pricing-service ./libs/pricing-service
COPY libs/shared-types ./libs/shared-types
COPY libs/db-client ./libs/db-client
# Remove workspace symlinks and lib project tsconfigs so webpack
# bundles @temar/* from source via the service tsconfig paths only
RUN rm -rf node_modules/@temar libs/pricing-service/tsconfig*.json libs/shared-types/tsconfig*.json libs/db-client/tsconfig*.json
# Build 'answer-analysis-service'
RUN NX_DAEMON=false pnpm nx build answer-analysis-service --prod

FROM deps AS admin-builder
COPY apps/admin ./apps/admin
COPY tsconfig.base.json ./
COPY eslint.config.mjs ./
COPY libs/db-client ./libs/db-client
COPY libs/pricing-service ./libs/pricing-service
COPY libs/payment-provider ./libs/payment-provider
COPY libs/shared-types ./libs/shared-types
COPY libs/ui ./libs/ui
RUN rm -rf node_modules/@temar
RUN NX_DAEMON=false pnpm nx build admin --prod --verbose

# ----------------------------------------------

# STAGE 4.5a: Notion Sync Service Production Dependencies
FROM base AS notion-prod-deps
COPY --from=notion-sync-builder /app/dist/apps/notion_sync-service/package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# STAGE 4.5b: FSRS Service Production Dependencies
FROM base AS fsrs-prod-deps
COPY --from=fsrs-service-builder /app/dist/apps/fsrs-service/package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# STAGE 4.5c: Question Gen Service Production Dependencies
FROM base AS questiongen-prod-deps
COPY --from=question-gen-service-builder /app/dist/apps/question-gen-service/package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

# STAGE 4.5d: Answer Analysis Service Production Dependencies
FROM base AS answer-analysis-prod-deps
COPY --from=answer-analysis-service-builder /app/dist/apps/answer-analysis-service/package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --prod --no-frozen-lockfile

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

# ----------------------------------------------

# STAGE 9: Answer Analysis Service Production Runner (NestJS)
FROM base AS answer-analysis-service
ENV NODE_ENV=production
RUN addgroup --system --gid 1005 nestjs && adduser --system --uid 1005 analysisuser

COPY --from=answer-analysis-service-builder --chown=analysisuser:nestjs /app/dist/apps/answer-analysis-service ./
COPY --from=answer-analysis-prod-deps --chown=analysisuser:nestjs /app/node_modules ./node_modules

USER analysisuser

EXPOSE 3336
CMD [ "node", "main.js" ]

# STAGE 10: Admin Panel Production Runner (Next.js)
FROM base AS admin-service
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1006 nodejs && adduser --system --uid 1006 adminjs

COPY --from=admin-builder --chown=adminjs:nodejs /app/dist/apps/admin/.next/standalone ./
COPY --from=admin-builder --chown=adminjs:nodejs /app/dist/apps/admin/public ./apps/admin/public
COPY --from=admin-builder --chown=adminjs:nodejs /app/dist/apps/admin/.next/static ./dist/apps/admin/.next/static

USER adminjs

EXPOSE 3000
ENV PORT=3000

WORKDIR /app/apps/admin

CMD ["node", "server.js"]

# ----------------------------------------------

# STAGE 11: Migration Service Runner
FROM base AS migration
COPY libs/db-client/package.json ./
RUN pnpm install
COPY libs/db-client/src/drizzle ./src/drizzle
COPY libs/db-client/drizzle.docker.config.ts ./drizzle.config.ts
CMD [ "pnpm", "drizzle-kit", "migrate", "--config=drizzle.config.ts" ]