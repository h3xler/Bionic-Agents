FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS build
COPY . .
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml* ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

    # Copy built application
    COPY --from=build /app/dist ./dist
    # Client dist is in dist/public based on vite.config.ts - copy it
    RUN mkdir -p ./client && (test -d ./dist/public && cp -r ./dist/public ./client/dist || mkdir -p ./client/dist)

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/index.js"]

