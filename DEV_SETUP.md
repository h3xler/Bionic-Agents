# Development Setup with Docker

This guide explains how to run all three Bionic-Agents applications in development mode using Docker, with code mounted from the host for immediate changes.

## Overview

The development setup uses Docker Compose to run:
- **PostgreSQL 16** - Local database server
- **Agent-Builder** - Available at http://localhost:3000
- **Agent-Dashboard** - Available at http://localhost:3001
- **Agent-Runtime** - Available at http://localhost:8080

## Features

- ✅ **Code mounted from host** - Changes to source code are immediately reflected
- ✅ **Dependencies in containers** - `node_modules` stay in containers, not on host
- ✅ **Hot reload** - All apps run in development mode with watch mode enabled
- ✅ **Isolated environment** - No need to install Node.js or pnpm on host
- ✅ **Shared database** - All apps connect to the same PostgreSQL instance

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- Ports 3000, 3001, 5432, and 8080 available

## Quick Start

1. **Start all services:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

2. **View logs:**
   ```bash
   # All services
   docker compose -f docker-compose.dev.yml logs -f
   
   # Specific service
   docker compose -f docker-compose.dev.yml logs -f agent-builder
   docker compose -f docker-compose.dev.yml logs -f agent-dashboard
   docker compose -f docker-compose.dev.yml logs -f agent-runtime
   ```

3. **Stop all services:**
   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

4. **Stop and remove volumes (fresh start):**
   ```bash
   docker compose -f docker-compose.dev.yml down -v
   ```

## Environment Variables

The docker-compose file uses environment variables from your host. You can create a `.env` file in the project root with:

```bash
# Database (already configured in docker-compose)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/liveagents

# JWT Secret (required for authentication)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OAuth Configuration (if using OAuth)
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://your-oauth-server.com
VITE_OAUTH_PORTAL_URL=https://your-oauth-portal.com

# LiveKit Configuration (uses live API URLs from .env.example)
LIVEKIT_URL=https://livekit.bionicaisolutions.com
LIVEKIT_API_KEY=devkey-livekit-api-key-2024
LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars

# LangFuse (optional)
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Agent Runtime Configuration
MAX_AGENTS_PER_INSTANCE=50
MAX_SESSIONS_PER_AGENT=100
```

**Note:** The docker-compose file has default values for LiveKit that connect to the live API. You can override these by setting environment variables in your `.env` file or exporting them before running docker-compose.

## Database Setup

The PostgreSQL database is automatically created and initialized. To run migrations:

```bash
# Agent-Builder migrations
docker compose -f docker-compose.dev.yml exec agent-builder pnpm db:push

# Agent-Dashboard migrations
docker compose -f docker-compose.dev.yml exec agent-dashboard pnpm db:push

# Agent-Runtime migrations
docker compose -f docker-compose.dev.yml exec agent-runtime pnpm db:push
```

## Accessing Services

- **Agent-Builder**: http://localhost:3000
- **Agent-Dashboard**: http://localhost:3001
- **Agent-Runtime API**: http://localhost:8080
- **PostgreSQL**: localhost:5432
  - Username: `postgres`
  - Password: `postgres`
  - Database: `liveagents`

## Development Workflow

1. **Make code changes** on your host machine
2. **Changes are immediately reflected** in the running containers (hot reload)
3. **View logs** to see compilation and runtime output
4. **Restart a service** if needed:
   ```bash
   docker compose -f docker-compose.dev.yml restart agent-builder
   ```

## Troubleshooting

### Port conflicts

If ports are already in use, modify `docker-compose.dev.yml`:

```yaml
ports:
  - "3002:3000"  # Use 3002 instead of 3000
```

### Dependencies not installing

If dependencies fail to install, try:

```bash
# Rebuild the image
docker compose -f docker-compose.dev.yml build --no-cache

# Restart services
docker compose -f docker-compose.dev.yml up -d
```

### Database connection issues

Check if PostgreSQL is healthy:

```bash
docker compose -f docker-compose.dev.yml ps
```

If PostgreSQL is not healthy, check logs:

```bash
docker compose -f docker-compose.dev.yml logs postgres
```

### Service won't start

Check the logs for the specific service:

```bash
docker compose -f docker-compose.dev.yml logs agent-builder
```

Common issues:
- Missing environment variables
- Database not ready (wait for health check)
- Port conflicts

## Cleanup

To completely remove everything:

```bash
# Stop and remove containers, networks, and volumes
docker compose -f docker-compose.dev.yml down -v

# Remove the Docker image
docker rmi bionic-agents-dev
```

## Production vs Development

- **Development (this setup)**: Code mounted from host, hot reload enabled, dependencies in containers
- **Production**: Full Docker images with code baked in, no hot reload, optimized builds

This development setup is **only for local development and testing**. Production deployments should use the production Dockerfiles in each component directory.

## Notes

- Source code is mounted from host - edit files on your machine, changes are immediately visible
- `node_modules` are in container filesystem - they don't clutter your host
- Database data persists in Docker volume `postgres-data-dev`
- Build outputs (`dist` folders) are in containers only
- All three components share the same database: `liveagents`



