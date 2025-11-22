# Multi-stage Dockerfile for LiveKit Dashboard Frontend

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy package files and patches (needed for pnpm install)
# This layer is cached unless package files change
COPY package.json pnpm-lock.yaml ./
COPY patches/ ./patches/

# Install dependencies (this is the slowest step - ~1-2 minutes)
# Using --frozen-lockfile for reproducible builds
RUN pnpm install --frozen-lockfile

# Copy source code (only copy what's needed for build)
# This layer invalidates when source changes
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY drizzle/ ./drizzle/
COPY drizzle.config.ts tsconfig.json tsconfig.node.json vite.config.ts vitest.config.ts ./
COPY components.json ./

# Build the application
# This builds the frontend with Vite and bundles the server with esbuild
RUN pnpm build

# Stage 2: Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy built files from builder stage
# Since esbuild uses --packages=external, we need node_modules at runtime
# Copy node_modules and built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/trpc/livekit.getSessionStats', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/index.js"]

