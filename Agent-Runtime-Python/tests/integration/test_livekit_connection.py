"""Integration tests for LiveKit server connection."""

import pytest
import os
from livekit import api


@pytest.fixture
def livekit_config():
    """Get LiveKit configuration from environment."""
    return {
        "url": os.getenv("LIVEKIT_URL", "ws://localhost:7880"),
        "api_key": os.getenv("LIVEKIT_API_KEY", "devkey-livekit-api-key-2024"),
        "api_secret": os.getenv("LIVEKIT_API_SECRET", "devkey-livekit-api-secret-2024-min-32-chars"),
    }


@pytest.mark.asyncio
async def test_livekit_api_connection(livekit_config):
    """Test connection to LiveKit API."""
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        
        # Try to list rooms (this will fail if connection is bad)
        from livekit import api as lk_api
        rooms = await lkapi.room.list_rooms(lk_api.ListRoomsRequest())
        
        # If we get here, connection is working
        assert rooms is not None
        print(f"✅ Connected to LiveKit at {livekit_config['url']}")
    except Exception as e:
        pytest.fail(f"Failed to connect to LiveKit: {e}")


@pytest.mark.asyncio
async def test_livekit_room_creation(livekit_config):
    """Test creating a room via LiveKit API."""
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        
        # Create a test room
        room = await lkapi.room.create_room(
            api.CreateRoomRequest(
                name="test-integration-room",
                empty_timeout=300,
            )
        )
        
        assert room is not None
        assert room.name == "test-integration-room"
        
        # Clean up - delete the room
        await lkapi.room.delete_room(api.DeleteRoomRequest(room=room.name))
        
        print(f"✅ Successfully created and deleted room: {room.name}")
    except Exception as e:
        pytest.fail(f"Failed to create LiveKit room: {e}")


@pytest.mark.asyncio
async def test_livekit_agent_dispatch(livekit_config):
    """Test agent dispatch via LiveKit API."""
    try:
        lkapi = api.LiveKitAPI(
            livekit_config["url"],
            livekit_config["api_key"],
            livekit_config["api_secret"],
        )
        
        # Create a room for dispatch
        room = await lkapi.room.create_room(
            api.CreateRoomRequest(
                name="test-dispatch-room",
                empty_timeout=300,
            )
        )
        
        # Try to create an agent dispatch
        # Note: This will only work if an agent server is registered with this agent name
        try:
            dispatch = await lkapi.agent_dispatch.create_dispatch(
                api.CreateAgentDispatchRequest(
                    agent_name="test-agent",
                    room=room.name,
                    metadata='{"test": "integration"}',
                )
            )
            print(f"✅ Agent dispatch created: {dispatch}")
        except Exception as e:
            # This is expected if no agent server is registered
            print(f"⚠️  Agent dispatch failed (expected if no agent server): {e}")
        
        # Clean up
        await lkapi.room.delete_room(api.DeleteRoomRequest(room=room.name))
        
    except Exception as e:
        pytest.fail(f"Failed to test agent dispatch: {e}")

