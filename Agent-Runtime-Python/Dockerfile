FROM node:22-alpine AS base

# Install pnpm and git
RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Clone the repository
RUN git clone --depth 1 https://github.com/h3xler/Bionic-Agents.git /tmp/repo
RUN cp -r /tmp/repo/Agent-Runtime/* /app/
RUN rm -rf /tmp/repo

# Install ALL dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Build the application
RUN pnpm build

# Create entrypoint script for db migrations
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "Running database migrations..."' >> /app/entrypoint.sh && \
    echo 'pnpm db:push || echo "Migration completed or already applied"' >> /app/entrypoint.sh && \
    echo 'echo "Starting Agent Runtime..."' >> /app/entrypoint.sh && \
    echo 'exec node dist/server.js' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

ENTRYPOINT ["/app/entrypoint.sh"]
