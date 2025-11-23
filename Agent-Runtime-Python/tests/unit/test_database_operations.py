"""Unit tests for database operations using real database."""

import pytest
from datetime import datetime, date
from src.database.operations import (
    get_agent_by_id,
    create_session,
    update_session_status,
    end_session,
    get_session_by_id,
    get_agent_metrics,
    get_tenant_metrics,
    get_session_metrics,
)
from src.database.models import Agent, AgentInstanceSession


@pytest.mark.asyncio
async def test_get_agent_by_id_not_found(db_session):
    """Test getting agent by ID when not found."""
    agent = await get_agent_by_id(db_session, 99999)
    assert agent is None


@pytest.mark.asyncio
async def test_create_session(db_session):
    """Test creating a session."""
    session = await create_session(
        db_session,
        agent_id=1,
        tenant_id=1,
        session_id="test-session-123",
        room_name="test-room",
        status="active",
    )
    
    assert session is not None
    assert session.session_id == "test-session-123"
    assert session.room_name == "test-room"
    assert session.agent_id == 1
    assert session.tenant_id == 1
    assert session.status == "active"
    
    await db_session.commit()
    
    # Verify it was saved
    saved_session = await get_session_by_id(db_session, "test-session-123")
    assert saved_session is not None
    assert saved_session.session_id == "test-session-123"


@pytest.mark.asyncio
async def test_update_session_status(db_session):
    """Test updating session status."""
    # Create a session first
    session = await create_session(
        db_session,
        agent_id=1,
        tenant_id=1,
        session_id="test-session-update",
        room_name="test-room",
        status="active",
    )
    await db_session.commit()
    
    # Update status
    updated = await update_session_status(
        db_session,
        session_id="test-session-update",
        status="ended",
        ended_at=datetime.utcnow(),
        duration_seconds=60,
        participant_count=2,
    )
    
    assert updated is not None
    assert updated.status == "ended"
    assert updated.duration_seconds == 60
    assert updated.participant_count == 2
    
    await db_session.commit()


@pytest.mark.asyncio
async def test_end_session(db_session):
    """Test ending a session."""
    # Create a session first
    session = await create_session(
        db_session,
        agent_id=1,
        tenant_id=1,
        session_id="test-session-end",
        room_name="test-room",
        status="active",
    )
    await db_session.commit()
    
    # End session
    ended = await end_session(db_session, "test-session-end")
    
    assert ended is not None
    assert ended.status == "ended"
    assert ended.ended_at is not None
    assert ended.duration_seconds is not None
    
    await db_session.commit()


@pytest.mark.asyncio
async def test_get_session_by_id(db_session):
    """Test getting session by ID."""
    # Create a session first
    session = await create_session(
        db_session,
        agent_id=1,
        tenant_id=1,
        session_id="test-session-get",
        room_name="test-room",
        status="active",
    )
    await db_session.commit()
    
    # Get session
    retrieved = await get_session_by_id(db_session, "test-session-get")
    
    assert retrieved is not None
    assert retrieved.session_id == "test-session-get"
    assert retrieved.agent_id == 1


@pytest.mark.asyncio
async def test_get_agent_metrics_empty(db_session):
    """Test getting agent metrics when no data exists."""
    metrics = await get_agent_metrics(db_session, agent_id=999)
    
    assert metrics is not None
    assert metrics["agentId"] == 999
    assert metrics["totalSessions"] == 0
    assert metrics["activeSessions"] == 0
    assert metrics["avgLatency"] == 0.0
    assert metrics["totalCost"] == 0.0


@pytest.mark.asyncio
async def test_get_tenant_metrics_empty(db_session):
    """Test getting tenant metrics when no data exists."""
    metrics = await get_tenant_metrics(db_session, tenant_id=999)
    
    assert metrics is not None
    assert metrics["tenantId"] == 999
    assert metrics["activeAgents"] == 0
    assert metrics["totalSessions"] == 0
    assert metrics["totalCost"] == 0.0


@pytest.mark.asyncio
async def test_get_session_metrics_not_found(db_session):
    """Test getting session metrics when session doesn't exist."""
    metrics = await get_session_metrics(db_session, "non-existent-session")
    
    assert metrics is None


