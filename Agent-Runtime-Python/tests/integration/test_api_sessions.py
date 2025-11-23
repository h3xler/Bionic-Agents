"""Integration tests for session API endpoints using real services."""

import pytest
from fastapi.testclient import TestClient
from src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.mark.asyncio
async def test_create_session(client):
    """Test creating a session via API."""
    # First register an agent
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    sample_config = {
        "agentId": 1,
        "tenantId": 1,
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "maxConcurrentSessions": 10,
        "livekitConfig": {
            "url": "ws://localhost:7880",
            "apiKey": "test",
            "apiSecret": "test",
        },
    }
    
    # Register agent first
    register_response = client.post(
        "/api/agents/register",
        json={"agentId": 1, "tenantId": 1, "config": sample_config},
        headers={"Authorization": "Bearer test-api-key"},
    )
    assert register_response.status_code == 200
    
    # Now create session
    response = client.post(
        "/api/sessions/create",
        json={
            "agentId": 1,
            "tenantId": 1,
            "roomName": "test-room",
            "participantName": "Test User",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "session" in data
    assert "sessionId" in data["session"]
    assert "roomName" in data["session"]


@pytest.mark.asyncio
async def test_get_session(client):
    """Test getting session details via API."""
    # First register an agent
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    sample_config = {
        "agentId": 1,
        "tenantId": 1,
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "maxConcurrentSessions": 10,
        "livekitConfig": {
            "url": "ws://localhost:7880",
            "apiKey": "test",
            "apiSecret": "test",
        },
    }
    
    # Register agent first
    register_response = client.post(
        "/api/agents/register",
        json={"agentId": 1, "tenantId": 1, "config": sample_config},
        headers={"Authorization": "Bearer test-api-key"},
    )
    assert register_response.status_code == 200
    
    # Create a session
    create_response = client.post(
        "/api/sessions/create",
        json={
            "agentId": 1,
            "tenantId": 1,
            "roomName": "test-room-get",
        },
    )
    assert create_response.status_code == 200
    session_id = create_response.json()["session"]["sessionId"]
    
    # Get session
    response = client.get(f"/api/sessions/{session_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["sessionId"] == session_id
    assert data["agentId"] == 1
    assert data["tenantId"] == 1
    assert data["roomName"] == "test-room-get"


@pytest.mark.asyncio
async def test_end_session(client):
    """Test ending a session via API."""
    # First register an agent
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    sample_config = {
        "agentId": 1,
        "tenantId": 1,
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "maxConcurrentSessions": 10,
        "livekitConfig": {
            "url": "ws://localhost:7880",
            "apiKey": "test",
            "apiSecret": "test",
        },
    }
    
    # Register agent first
    register_response = client.post(
        "/api/agents/register",
        json={"agentId": 1, "tenantId": 1, "config": sample_config},
        headers={"Authorization": "Bearer test-api-key"},
    )
    assert register_response.status_code == 200
    
    # Create a session
    create_response = client.post(
        "/api/sessions/create",
        json={
            "agentId": 1,
            "tenantId": 1,
            "roomName": "test-room-end",
        },
    )
    assert create_response.status_code == 200
    session_id = create_response.json()["session"]["sessionId"]
    
    # End session
    response = client.post(f"/api/sessions/{session_id}/end")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

