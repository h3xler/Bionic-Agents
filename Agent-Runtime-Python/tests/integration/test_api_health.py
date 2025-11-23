"""Integration tests for health endpoints using real services."""

import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_readiness_check(client):
    """Test readiness check endpoint."""
    response = client.get("/ready")
    
    # Should be 200 if database is connected, 503 if not
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    
    if response.status_code == 200:
        assert data["status"] == "ready"
    else:
        assert data["status"] == "not ready"


