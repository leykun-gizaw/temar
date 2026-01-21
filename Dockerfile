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
COPY libs/db-client/package.json libs/db-client/
RUN pnpm install --frozen-lockfile

# ----------------------------------------------

# STAGE 3: Source Code
# Deps + Source Code
FROM deps AS source
COPY . .

# ----------------------------------------------

# STAGE 4: Builder
# Build the 'web' application for production
FROM source AS builder
# Build the 'web' application
RUN NX_DAEMON=false pnpm nx build web --prod --verbose
# Build 'notion_sync-service'
RUN NX_DAEMON=false pnpm nx build notion_sync-service --prod

# ----------------------------------------------

# STAGE 4.25: NestJS Production Dependencies
FROM base AS notion-prod-deps
WORKDIR /app
COPY --from=builder /app/dist/apps/notion_sync-service/package.json ./
COPY --from=builder /app/dist/apps/notion_sync-service/pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# ----------------------------------------------

# STAGE 4.5: NGINX CDN Setup
# Build the NGINX image to serve static assets
FROM nginx:alpine AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/web/public /var/www/html
COPY --from=builder /app/dist/apps/web/.next/static /var/www/html/_next/static

# ----------------------------------------------

# STAGE 5: Production Runner
# Create the final, minimal production image
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user to run the application
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/standalone ./

# Copy the public and static assets
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/web/.next/static ./apps/web/.next/static

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
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestuser

COPY --from=builder --chown=nestuser:nestjs /app/dist/apps/notion_sync-service ./
COPY --from=notion-prod-deps --chown=nestuser:nestjs /app/node_modules ./node_modules

USER nestuser

EXPOSE 3333
CMD [ "node", "main.js" ]