# Agent-Runtime Python Tests

## Test Structure

- **Unit Tests** (`tests/unit/`): Test individual components with real dependencies
- **Integration Tests** (`tests/integration/`): Test with real services (database, API)
- **End-to-End Tests** (`tests/e2e/`): Test full flow with all services
- **Performance Tests** (`tests/performance/`): Benchmark API performance
- **API Compatibility Tests** (`tests/test_api_compatibility.py`): Verify 100% API compatibility

## Running Tests

### Prerequisites

1. **Test Database**: Start the test database:
   ```bash
   docker compose -f docker-compose.test.yml up -d
   ```

2. **Environment Variables**:
   ```bash
   export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/liveagents_test"
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt  # Or use Poetry
   ```

### Run All Tests

```bash
pytest tests/ -v
```

### Run by Category

```bash
# Unit tests only
pytest tests/unit/ -v

# Integration tests only
pytest tests/integration/ -v

# E2E tests (requires full stack)
pytest tests/e2e/ -v -m e2e

# Performance tests
pytest tests/performance/ -v

# API compatibility tests
pytest tests/test_api_compatibility.py -v
```

### Run with Coverage

```bash
pytest tests/ --cov=src --cov-report=html
```

## Test Database Setup

The test database should have the schema created by Drizzle migrations from Agent-Builder. If the schema doesn't exist, tests that require database tables will be skipped.

To create the schema:

```bash
cd Agent-Builder
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/liveagents_test"
pnpm db:push
```

## Test Strategy

### Zero Mocks/Stubs

All tests use real dependencies:
- **Database**: Real PostgreSQL test database
- **Services**: Real FastAPI application
- **Dependencies**: Real library instances

### Integration Tests

Integration tests require:
- Real database connection
- Real FastAPI server
- Real AgentManager and SessionManager

### End-to-End Tests

E2E tests require:
- All services running (FastAPI, Agent Server, LiveKit, Database)
- Full stack integration

## Notes

- Tests are designed to be run in isolation
- Each test cleans up after itself
- Database transactions are rolled back after each test
- Coverage target: 80% (currently set to 30% for initial development)

