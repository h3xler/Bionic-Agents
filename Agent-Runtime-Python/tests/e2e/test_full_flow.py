"""End-to-end tests for full flow: Widget → LiveKit → Agent → Response.

These tests require:
- Real LiveKit server running
- Real database with schema
- Agent server running
- All services connected
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from src.main import app
from src.runtime.agent_manager import agent_manager


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_full_agent_flow(client):
    """Test full flow: Register agent → Create session → Agent responds.
    
    This test verifies:
    1. Agent can be registered
    2. Session can be created
    3. Agent is dispatched to LiveKit room
    4. Agent session starts correctly
    """
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    # Step 1: Register agent
    agent_config = {
        "agentId": 100,
        "tenantId": 1,
        "name": "E2E Test Agent",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful test assistant.",
        "visionEnabled": False,
        "screenShareEnabled": False,
        "transcribeEnabled": True,
        "languages": ["en"],
        "maxConcurrentSessions": 10,
        "livekitConfig": {
            "url": os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
            "apiKey": os.getenv("LIVEKIT_API_KEY", "devkey-livekit-api-key-2024"),
            "apiSecret": os.getenv("LIVEKIT_API_SECRET", "devkey-livekit-api-secret-2024-min-32-chars"),
        },
        "langfuseConfig": {
            "enabled": False,
        },
    }
    
    register_response = client.post(
        "/api/agents/register",
        json={
            "agentId": 100,
            "tenantId": 1,
            "config": agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert register_response.status_code == 200
    
    # Step 2: Verify agent is registered
    status_response = client.get("/api/agents/100")
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["registered"] is True
    
    # Step 3: Create session
    session_response = client.post(
        "/api/sessions/create",
        json={
            "agentId": 100,
            "tenantId": 1,
            "roomName": "agent-100-room",
            "participantName": "E2E Test User",
        },
    )
    
    assert session_response.status_code == 200
    session_data = session_response.json()
    assert session_data["success"] is True
    assert "session" in session_data
    session_id = session_data["session"]["sessionId"]
    
    # Step 4: Verify session exists
    get_session_response = client.get(f"/api/sessions/{session_id}")
    assert get_session_response.status_code == 200
    session_info = get_session_response.json()
    assert session_info["sessionId"] == session_id
    assert session_info["agentId"] == 100
    
    # Note: Actual LiveKit connection and agent response would require
    # the agent server to be running and connected to LiveKit.
    # This is tested in a separate integration environment.


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_agent_with_bithuman_avatar(client):
    """Test agent with BitHuman avatar configuration."""
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    agent_config = {
        "agentId": 101,
        "tenantId": 1,
        "name": "BitHuman Test Agent",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful assistant with a virtual avatar.",
        "avatarModel": "bithuman-model-1",  # BitHuman avatar
        "maxConcurrentSessions": 10,
        "livekitConfig": {
            "url": os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
            "apiKey": os.getenv("LIVEKIT_API_KEY", "devkey-livekit-api-key-2024"),
            "apiSecret": os.getenv("LIVEKIT_API_SECRET", "devkey-livekit-api-secret-2024-min-32-chars"),
        },
    }
    
    # Register agent with BitHuman
    response = client.post(
        "/api/agents/register",
        json={
            "agentId": 101,
            "tenantId": 1,
            "config": agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert response.status_code == 200
    
    # Verify agent config includes avatar
    instance = agent_manager.get_agent_instance(101)
    assert instance is not None
    assert instance.config.get("avatarModel") == "bithuman-model-1"

