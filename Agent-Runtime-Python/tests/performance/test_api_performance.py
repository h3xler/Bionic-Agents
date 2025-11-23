"""Performance tests for API endpoints."""

import pytest
import time
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_health_check_performance(client):
    """Test health check endpoint performance."""
    start = time.time()
    response = client.get("/health")
    elapsed = time.time() - start
    
    assert response.status_code == 200
    # Health check should be very fast (< 10ms)
    assert elapsed < 0.01, f"Health check took {elapsed}s, expected < 0.01s"


def test_list_agents_performance(client):
    """Test list agents endpoint performance."""
    start = time.time()
    response = client.get("/api/agents/")
    elapsed = time.time() - start
    
    assert response.status_code == 200
    # List agents should be fast (< 100ms)
    assert elapsed < 0.1, f"List agents took {elapsed}s, expected < 0.1s"


def test_get_agent_status_performance(client):
    """Test get agent status endpoint performance."""
    start = time.time()
    response = client.get("/api/agents/1")
    elapsed = time.time() - start
    
    assert response.status_code == 200
    # Get status should be fast (< 100ms)
    assert elapsed < 0.1, f"Get agent status took {elapsed}s, expected < 0.1s"

