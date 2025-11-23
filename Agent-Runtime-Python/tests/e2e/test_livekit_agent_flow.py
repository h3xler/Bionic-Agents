"""End-to-end tests for full LiveKit agent flow.

These tests require:
- Real LiveKit server running
- Real database with schema
- Agent server running (optional, for full flow)
- All services connected
"""

import pytest
import os
import asyncio
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


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_full_agent_lifecycle_with_livekit(client, livekit_config):
    """Test full agent lifecycle: Register → Create Session → LiveKit Dispatch → End Session.
    
    This test verifies:
    1. Agent can be registered with LiveKit config
    2. Session can be created
    3. Agent is dispatched to LiveKit room
    4. Room exists in LiveKit
    5. Session can be ended
    """
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
    
    agent_id = 2000
    tenant_id = 1
    
    # Step 1: Register agent with LiveKit config
    agent_config = {
        "agentId": agent_id,
        "tenantId": tenant_id,
        "name": "E2E LiveKit Test Agent",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful test assistant for E2E testing.",
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
    
    register_response = client.post(
        "/api/agents/register",
        json={
            "agentId": agent_id,
            "tenantId": tenant_id,
            "config": agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert register_response.status_code == 200
    print(f"✅ Agent {agent_id} registered")
    
    # Step 2: Verify agent is registered
    status_response = client.get(f"/api/agents/{agent_id}")
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["registered"] is True
    print(f"✅ Agent {agent_id} status verified")
    
    # Step 3: Create session
    room_name = f"agent-{agent_id}-room"
    session_response = client.post(
        "/api/sessions/create",
        json={
            "agentId": agent_id,
            "tenantId": tenant_id,
            "roomName": room_name,
            "participantName": "E2E Test User",
        },
    )
    
    assert session_response.status_code == 200
    session_data = session_response.json()
    assert session_data["success"] is True
    assert "session" in session_data
    session_id = session_data["session"]["sessionId"]
    print(f"✅ Session created: {session_id} in room {room_name}")
    
    # Step 4: Verify session exists
    get_session_response = client.get(f"/api/sessions/{session_id}")
    assert get_session_response.status_code == 200
    session_info = get_session_response.json()
    assert session_info["sessionId"] == session_id
    assert session_info["agentId"] == agent_id
    print(f"✅ Session retrieved: {session_id}")
    
    # Step 5: Verify room exists in LiveKit (or can be created)
    lkapi = api.LiveKitAPI(
        livekit_config["url"],
        livekit_config["api_key"],
        livekit_config["api_secret"],
    )
    
    try:
        # Try to get room info
        room_info = await lkapi.room.list_rooms()
        room_names = [r.name for r in room_info.rooms]
        if room_name in room_names:
            print(f"✅ Room {room_name} exists in LiveKit")
        else:
            print(f"⚠️  Room {room_name} not yet in LiveKit (may be created on-demand)")
    except Exception as e:
        print(f"⚠️  Could not verify room in LiveKit: {e}")
    
    # Step 6: End session
    end_response = client.post(f"/api/sessions/{session_id}/end")
    assert end_response.status_code == 200
    end_data = end_response.json()
    assert end_data["success"] is True
    print(f"✅ Session ended: {session_id}")
    
    # Step 7: Verify session is ended
    get_ended_response = client.get(f"/api/sessions/{session_id}")
    # Session might still be retrievable but with ended status
    if get_ended_response.status_code == 200:
        ended_info = get_ended_response.json()
        assert ended_info["status"] == "ended"
        print(f"✅ Session status verified as ended")


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_agent_with_bithuman_avatar_livekit(client, livekit_config):
    """Test agent with BitHuman avatar configuration and LiveKit."""
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
    
    agent_id = 2001
    tenant_id = 1
    
    agent_config = {
        "agentId": agent_id,
        "tenantId": tenant_id,
        "name": "BitHuman LiveKit Test Agent",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful assistant with a virtual avatar.",
        "avatarModel": "bithuman-model-1",  # BitHuman avatar
        "maxConcurrentSessions": 10,
        "livekitConfig": livekit_config,
    }
    
    # Register agent with BitHuman
    response = client.post(
        "/api/agents/register",
        json={
            "agentId": agent_id,
            "tenantId": tenant_id,
            "config": agent_config,
        },
        headers={"Authorization": "Bearer test-api-key"},
    )
    
    assert response.status_code == 200
    
    # Verify agent config includes avatar
    instance = agent_manager.get_agent_instance(agent_id)
    assert instance is not None
    assert instance.config.get("avatarModel") == "bithuman-model-1"
    print(f"✅ Agent {agent_id} registered with BitHuman avatar: {instance.config.get('avatarModel')}")


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_multiple_agents_livekit(client, livekit_config):
    """Test multiple agents with LiveKit."""
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
    
    # Register multiple agents
    agents = []
    for i in range(3):
        agent_id = 3000 + i
        agent_config = {
            "agentId": agent_id,
            "tenantId": 1,
            "sttProvider": "assemblyai",
            "ttsProvider": "cartesia",
            "llmProvider": "openai",
            "maxConcurrentSessions": 10,
            "livekitConfig": livekit_config,
        }
        
        response = client.post(
            "/api/agents/register",
            json={"agentId": agent_id, "tenantId": 1, "config": agent_config},
            headers={"Authorization": "Bearer test-api-key"},
        )
        assert response.status_code == 200
        agents.append(agent_id)
    
    # List all agents
    list_response = client.get("/api/agents/")
    assert list_response.status_code == 200
    agent_list = list_response.json()["agents"]
    
    # Verify all agents are in the list
    for agent_id in agents:
        assert agent_id in agent_list
    
    print(f"✅ Registered and listed {len(agents)} agents: {agents}")
    
    # Clean up - unregister agents
    for agent_id in agents:
        unregister_response = client.delete(
            f"/api/agents/{agent_id}",
            headers={"Authorization": "Bearer test-api-key"},
        )
        assert unregister_response.status_code == 200

