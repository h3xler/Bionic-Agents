"""Unit tests for SessionManager using real database."""

import pytest
from src.runtime.session_manager import SessionManager


@pytest.mark.asyncio
async def test_create_session(session_manager):
    """Test creating a session."""
    session = await session_manager.create_session(
        agent_id=1,
        tenant_id=1,
        room_name="test-room",
    )
    
    assert session is not None
    assert session["sessionId"] is not None
    assert session["agentId"] == 1
    assert session["tenantId"] == 1
    assert session["roomName"] == "test-room"
    assert session["status"] == "connecting"


@pytest.mark.asyncio
async def test_update_session_status(session_manager):
    """Test updating session status."""
    session = await session_manager.create_session(
        agent_id=1,
        tenant_id=1,
        room_name="test-room",
    )
    session_id = session["sessionId"]
    
    await session_manager.update_session_status(session_id, "active", participant_count=1)
    
    updated = await session_manager.get_session(session_id)
    assert updated is not None
    assert updated["status"] == "active"
    assert updated["participantCount"] == 1


@pytest.mark.asyncio
async def test_end_session(session_manager):
    """Test ending a session."""
    session = await session_manager.create_session(
        agent_id=1,
        tenant_id=1,
        room_name="test-room",
    )
    session_id = session["sessionId"]
    
    await session_manager.end_session(session_id)
    
    # Session should be removed from memory
    ended_session = await session_manager.get_session(session_id)
    assert ended_session is None


@pytest.mark.asyncio
async def test_get_agent_sessions(session_manager):
    """Test getting all sessions for an agent."""
    # Create multiple sessions for same agent
    session1 = await session_manager.create_session(agent_id=1, tenant_id=1, room_name="room-1")
    session2 = await session_manager.create_session(agent_id=1, tenant_id=1, room_name="room-2")
    
    # Create session for different agent
    await session_manager.create_session(agent_id=2, tenant_id=1, room_name="room-3")
    
    # Get sessions for agent 1
    agent_sessions = await session_manager.get_agent_sessions(1)
    
    assert len(agent_sessions) == 2
    session_ids = [s["sessionId"] for s in agent_sessions]
    assert session1["sessionId"] in session_ids
    assert session2["sessionId"] in session_ids


@pytest.fixture
def session_manager():
    """Create a fresh SessionManager instance for each test."""
    return SessionManager()

