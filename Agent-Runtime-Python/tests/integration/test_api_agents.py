"""Integration tests for agent API endpoints using real services."""

import pytest
from fastapi.testclient import TestClient
from src.main import app
from src.runtime.agent_manager import agent_manager


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def sample_agent_config():
    """Sample agent configuration."""
    return {
        "agentId": 1,
        "tenantId": 1,
        "name": "Test Agent",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful assistant.",
        "visionEnabled": False,
        "screenShareEnabled": False,
        "transcribeEnabled": True,
        "languages": ["en"],
        "maxConcurrentSessions": 10,
        "livekitConfig": {
            "url": "ws://localhost:7880",
            "apiKey": "devkey-livekit-api-key-2024",
            "apiSecret": "devkey-livekit-api-secret-2024-min-32-chars",
        },
        "langfuseConfig": {
            "enabled": False,
        },
    }


@pytest.mark.asyncio
async def test_register_agent(client, sample_agent_config):
    """Test registering an agent via API."""
    # Set API key if required
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    response = client.post(
        "/api/agents/register",
        json={
            "agentId": 1,
            "tenantId": 1,
            "config": sample_agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["agentId"] == 1
    
    # Verify agent is registered
    instance = agent_manager.get_agent_instance(1)
    assert instance is not None


@pytest.mark.asyncio
async def test_get_agent_status(client):
    """Test getting agent status via API."""
    response = client.get("/api/agents/1")
    
    assert response.status_code == 200
    data = response.json()
    assert "registered" in data
    assert "active" in data
    assert "activeSessions" in data
    assert "maxSessions" in data


@pytest.mark.asyncio
async def test_list_agents(client):
    """Test listing agents via API."""
    response = client.get("/api/agents/")
    
    assert response.status_code == 200
    data = response.json()
    assert "agents" in data
    assert isinstance(data["agents"], list)


@pytest.mark.asyncio
async def test_unregister_agent(client):
    """Test unregistering an agent via API."""
    # First register an agent
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    sample_config = {
        "agentId": 2,
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
    
    client.post(
        "/api/agents/register",
        json={"agentId": 2, "tenantId": 1, "config": sample_config},
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    # Unregister
    response = client.delete(
        "/api/agents/2",
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True


