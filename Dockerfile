# syntax=docker/dockerfile:1
# Multi-stage build producing a small, self-contained Next.js standalone image.

# ---- deps: install all dependencies (incl. dev, needed to build) ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js app ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal runtime image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AIDLC_DATA_DIR=/data
ENV PORT=3100
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone server + static assets + public files.
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Persistent data directory (mount a volume here in production).
RUN mkdir -p /data && chown -R nextjs:nodejs /data /app

USER nextjs
EXPOSE 3100
CMD ["node", "server.js"]
