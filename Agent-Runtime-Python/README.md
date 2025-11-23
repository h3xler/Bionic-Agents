# Agent-Runtime (Python)

Agent Runtime service for LiveKit agents with BitHuman avatar support.

## Overview

This is the Python implementation of Agent-Runtime, migrated from Node.js/TypeScript to enable BitHuman avatar support. The service manages agent instances, handles LiveKit connections, and provides HTTP APIs for Agent-Builder and Agent-Dashboard.

## Features

- FastAPI-based HTTP API server
- SQLAlchemy for database operations (compatible with Drizzle-managed schema)
- LiveKit Agents Python SDK with BitHuman support
- Real-time agent session management
- Metrics collection and reporting
- LangFuse integration for observability

## Requirements

- Python 3.11 or higher
- PostgreSQL database (shared with Agent-Builder and Agent-Dashboard)
- LiveKit server
- Poetry for dependency management

## Setup

### Install Poetry

```bash
curl -sSL https://install.python-poetry.org | python3 -
```

### Install Dependencies

```bash
poetry install
```

### Environment Variables

Create a `.env` file:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/liveagents
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey-livekit-api-key-2024
LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars
AGENT_RUNTIME_API_KEY=your-api-key
PORT=8080
```

### Run Development Server

```bash
poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 8080
```

## Project Structure

```
Agent-Runtime-Python/
├── src/
│   ├── api/           # FastAPI route handlers
│   ├── config/        # Configuration management
│   ├── database/      # SQLAlchemy models and operations
│   ├── langfuse/      # LangFuse client
│   ├── livekit/       # LiveKit agent server and config mapper
│   └── runtime/       # Agent management and session handling
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests (real services)
│   ├── e2e/           # End-to-end tests
│   └── performance/   # Performance tests
├── alembic/           # Database migrations
└── docs/              # Documentation
```

## API Endpoints

- `POST /api/agents/register` - Register an agent
- `DELETE /api/agents/:agentId` - Unregister an agent
- `GET /api/agents/:agentId` - Get agent status
- `GET /api/agents/` - List all agents
- `POST /api/sessions/create` - Create a session
- `POST /api/sessions/:sessionId/end` - End a session
- `GET /api/sessions/:sessionId` - Get session details
- `GET /api/metrics/agent/:agentId` - Get agent metrics
- `GET /api/metrics/tenant/:tenantId` - Get tenant metrics
- `GET /api/metrics/session/:sessionId` - Get session metrics
- `GET /health` - Health check
- `GET /ready` - Readiness check

## Testing

### Unit Tests

```bash
poetry run pytest tests/unit
```

### Integration Tests

```bash
poetry run pytest tests/integration
```

### End-to-End Tests

```bash
poetry run pytest tests/e2e
```

## Migration Notes

This is a migration from Node.js/TypeScript to Python. See `docs/migration-notes.md` for details.

## License

MIT

