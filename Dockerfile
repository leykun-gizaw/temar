# STAGE 1: Base Image
# Common base for all other stages
FROM node:lts AS base
WORKDIR /app
# Install pnpm
RUN npm install -g pnpm

# ----------------------------------------------

# STAGE 2: Dependencies
# Install all monorepo dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json ./
COPY apps/web/package.json apps/web/
COPY libs/db-client/package.json libs/db-client/
RUN pnpm install --frozen-lockfile

# ----------------------------------------------

# STAGE 3: Builder
# Build the 'web' application for production
FROM deps AS builder
# Copy the entire monorepo source code
COPY . .
# Build the 'web' application
RUN NX_DAEMON=false pnpm nx build web --prod --verbose

# ----------------------------------------------

# STAGE 3.5: NGINX CDN Setup
# Build the NGINX image to serve static assets
FROM nginx:alpine AS nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/apps/web/public /var/www/html
COPY --from=builder /app/dist/apps/web/.next/static /var/www/html/_next/static

# STAGE 4: Production Runner
# Create the final, minimal production image
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user to run the application
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Copy the standalone output from the builder stage
COPY --from=builder --chown=appuser:appgroup /app/dist/apps/web/.next/standalone ./

# Copy the public and static assets
COPY --from=builder --chown=appuser:appgroup /app/dist/apps/web/public ./apps/web/public
COPY --from=builder --chown=appuser:appgroup /app/dist/apps/web/.next/static ./apps/web/.next/static

EXPOSE 5173
ENV PORT=5173

# Switch to server.js directory
WORKDIR /app/apps/web

# Run the app
CMD ["node", "server.js"]

