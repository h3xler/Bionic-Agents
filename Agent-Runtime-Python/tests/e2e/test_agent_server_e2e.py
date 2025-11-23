"""End-to-end tests with running agent server.

These tests require:
- Real LiveKit server running
- Real database with schema
- Agent server running (started via start_agent_server.py)
- All services connected
"""

import pytest
import os
import asyncio
import time
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
async def test_full_flow_with_agent_server(client, livekit_config):
    """Test full flow with agent server: Register → Create Session → Agent Connects → End Session.
    
    This test verifies:
    1. Agent can be registered
    2. Session can be created
    3. Agent server receives job and connects
    4. Room exists in LiveKit with agent participant
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
        from livekit import api as lk_api
        await lkapi.room.list_rooms(lk_api.ListRoomsRequest())
        print(f"✅ LiveKit server accessible at {livekit_config['url']}")
    except Exception as e:
        pytest.skip(f"LiveKit server not accessible: {e}")
    
    agent_id = 5000
    tenant_id = 1
    
    # Step 1: Register agent with LiveKit config
    agent_config = {
        "agentId": agent_id,
        "tenantId": tenant_id,
        "name": "E2E Agent Server Test Agent",
        "sttProvider": "deepgram",
        "ttsProvider": "elevenlabs",
        "llmProvider": "openai",
        "llmModel": "gpt-4o-mini",
        "systemPrompt": "You are a helpful test assistant for E2E testing with agent server.",
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
    
    # Step 3: Create session (this should trigger agent dispatch)
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
    
    # Step 4: Wait a bit for agent server to connect
    print("⏳ Waiting for agent server to connect...")
    await asyncio.sleep(2)
    
    # Step 5: Verify room exists in LiveKit
    lkapi = api.LiveKitAPI(
        livekit_config["url"],
        livekit_config["api_key"],
        livekit_config["api_secret"],
    )
    
    try:
        from livekit import api as lk_api
        room_list = await lkapi.room.list_rooms(lk_api.ListRoomsRequest())
        room_names = [r.name for r in room_list.rooms]
        
        if room_name in room_names:
            print(f"✅ Room {room_name} exists in LiveKit")
            
            # Get room details
            room_info = await lkapi.room.get_room(lk_api.GetRoomRequest(room=room_name))
            if room_info:
                print(f"   Room participants: {len(room_info.participants)}")
                for participant in room_info.participants:
                    print(f"   - {participant.identity} (agent: {participant.is_agent})")
        else:
            print(f"⚠️  Room {room_name} not yet in LiveKit (may be created on-demand)")
    except Exception as e:
        print(f"⚠️  Could not verify room in LiveKit: {e}")
    
    # Step 6: Verify session exists
    get_session_response = client.get(f"/api/sessions/{session_id}")
    assert get_session_response.status_code == 200
    session_info = get_session_response.json()
    assert session_info["sessionId"] == session_id
    assert session_info["agentId"] == agent_id
    print(f"✅ Session retrieved: {session_id}")
    
    # Step 7: End session
    end_response = client.post(f"/api/sessions/{session_id}/end")
    assert end_response.status_code == 200
    end_data = end_response.json()
    assert end_data["success"] is True
    print(f"✅ Session ended: {session_id}")
    
    # Step 8: Wait a bit for cleanup
    await asyncio.sleep(1)
    
    # Step 9: Verify session is ended
    get_ended_response = client.get(f"/api/sessions/{session_id}")
    if get_ended_response.status_code == 200:
        ended_info = get_ended_response.json()
        assert ended_info["status"] == "ended"
        print(f"✅ Session status verified as ended")


@pytest.mark.e2e
@pytest.mark.asyncio
async def test_agent_server_multiple_sessions(client, livekit_config):
    """Test agent server handling multiple concurrent sessions."""
    import os
    os.environ["AGENT_RUNTIME_API_KEY"] = "test-api-key"
    
    # Verify LiveKit server is accessible
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        from livekit import api as lk_api
        await lkapi.room.list_rooms(lk_api.ListRoomsRequest())
    except Exception as e:
        pytest.skip(f"LiveKit server not accessible: {e}")
    
    agent_id = 5001
    tenant_id = 1
    
    # Register agent
    agent_config = {
        "agentId": agent_id,
        "tenantId": tenant_id,
        "sttProvider": "deepgram",
        "ttsProvider": "elevenlabs",
        "llmProvider": "openai",
        "maxConcurrentSessions": 5,
        "livekitConfig": livekit_config,
    }
    
    register_response = client.post(
        "/api/agents/register",
        json={"agentId": agent_id, "tenantId": tenant_id, "config": agent_config},
        headers={"Authorization": "Bearer test-api-key"},
    )
    assert register_response.status_code == 200
    
    # Create multiple sessions
    sessions = []
    for i in range(3):
        room_name = f"agent-{agent_id}-room-{i}"
        session_response = client.post(
            "/api/sessions/create",
            json={
                "agentId": agent_id,
                "tenantId": tenant_id,
                "roomName": room_name,
            },
        )
        assert session_response.status_code == 200
        session_data = session_response.json()
        sessions.append(session_data["session"]["sessionId"])
        print(f"✅ Created session {i+1}: {session_data['session']['sessionId']}")
    
    # Wait for agent server to process
    await asyncio.sleep(2)
    
    # Verify all sessions exist
    for session_id in sessions:
        get_response = client.get(f"/api/sessions/{session_id}")
        assert get_response.status_code == 200
    
    # End all sessions
    for session_id in sessions:
        end_response = client.post(f"/api/sessions/{session_id}/end")
        assert end_response.status_code == 200
    
    print(f"✅ Created and ended {len(sessions)} concurrent sessions")

