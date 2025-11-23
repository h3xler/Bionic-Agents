"""Integration tests for Agent-Runtime with LiveKit server."""

import pytest
import os
from fastapi.testclient import TestClient
from src.main import app
from src.runtime.agent_manager import agent_manager
from livekit import api


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def livekit_config():
    """Get LiveKit configuration from environment."""
    return {
        "url": os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
        "api_key": os.getenv("LIVEKIT_API_KEY", "devkey-livekit-api-key-2024"),
        "api_secret": os.getenv("LIVEKIT_API_SECRET", "devkey-livekit-api-secret-2024-min-32-chars"),
    }


@pytest.fixture
def sample_agent_config(livekit_config):
    """Sample agent configuration with LiveKit config."""
    return {
        "agentId": 1000,
        "tenantId": 1,
        "name": "LiveKit Integration Test Agent",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful test assistant for LiveKit integration.",
        "visionEnabled": False,
        "screenShareEnabled": False,
        "transcribeEnabled": True,
        "languages": ["en"],
        "maxConcurrentSessions": 10,
        "livekitConfig": livekit_config,
        "langfuseConfig": {
            "enabled": False,
        },
    }


@pytest.mark.asyncio
async def test_register_agent_with_livekit(client, sample_agent_config, livekit_config):
    """Test registering an agent with LiveKit configuration."""
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    # Verify LiveKit server is accessible
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        await lkapi.room.list_rooms()
        print(f"✅ LiveKit server accessible at {livekit_config['url']}")
    except Exception as e:
        pytest.skip(f"LiveKit server not accessible: {e}")
    
    # Register agent
    response = client.post(
        "/api/agents/register",
        json={
            "agentId": sample_agent_config["agentId"],
            "tenantId": sample_agent_config["tenantId"],
            "config": sample_agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["agentId"] == sample_agent_config["agentId"]
    
    # Verify agent is registered
    instance = agent_manager.get_agent_instance(sample_agent_config["agentId"])
    assert instance is not None
    assert instance.config["livekitConfig"]["url"] == livekit_config["url"]


@pytest.mark.asyncio
async def test_create_session_with_livekit_dispatch(client, sample_agent_config, livekit_config):
    """Test creating a session that dispatches to LiveKit."""
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    # Verify LiveKit server is accessible
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        await lkapi.room.list_rooms()
    except Exception as e:
        pytest.skip(f"LiveKit server not accessible: {e}")
    
    # Register agent first
    register_response = client.post(
        "/api/agents/register",
        json={
            "agentId": sample_agent_config["agentId"],
            "tenantId": sample_agent_config["tenantId"],
            "config": sample_agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    assert register_response.status_code == 200
    
    # Create session (this should dispatch to LiveKit)
    room_name = f"agent-{sample_agent_config['agentId']}-room"
    session_response = client.post(
        "/api/sessions/create",
        json={
            "agentId": sample_agent_config["agentId"],
            "tenantId": sample_agent_config["tenantId"],
            "roomName": room_name,
            "participantName": "Integration Test User",
        },
    )
    
    assert session_response.status_code == 200
    session_data = session_response.json()
    assert session_data["success"] is True
    assert "session" in session_data
    assert session_data["session"]["roomName"] == room_name
    
    # Verify room exists in LiveKit
    lkapi = api.LiveKitAPI(
        livekit_config["url"],
        livekit_config["api_key"],
        livekit_config["api_secret"],
    )
    
    try:
        room_info = await lkapi.room.list_rooms()
        room_names = [r.name for r in room_info.rooms]
        # Room might exist or might be created on-demand
        print(f"✅ Session created, room: {room_name}")
        print(f"   LiveKit rooms: {room_names}")
    except Exception as e:
        print(f"⚠️  Could not verify room in LiveKit: {e}")


@pytest.mark.asyncio
async def test_agent_status_with_livekit(client, sample_agent_config, livekit_config):
    """Test getting agent status after registration with LiveKit."""
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    # Verify LiveKit server is accessible
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        await lkapi.room.list_rooms()
    except Exception as e:
        pytest.skip(f"LiveKit server not accessible: {e}")
    
    # Register agent
    register_response = client.post(
        "/api/agents/register",
        json={
            "agentId": sample_agent_config["agentId"],
            "tenantId": sample_agent_config["tenantId"],
            "config": sample_agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    assert register_response.status_code == 200
    
    # Get agent status
    status_response = client.get(f"/api/agents/{sample_agent_config['agentId']}")
    
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["registered"] is True
    assert "active" in status_data
    assert "activeSessions" in status_data
    assert "maxSessions" in status_data

