FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install ALL dependencies (including dev for build)
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY . .
RUN pnpm build

# Production stage - keep all dependencies for runtime
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install ALL dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy built application
COPY --from=build /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "dist/server.js"]
