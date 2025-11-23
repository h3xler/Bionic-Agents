"""Integration tests for database compatibility with Drizzle-managed tables."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from src.database.models import Agent, AgentInstanceSession
from src.database.operations import get_agent_by_id, create_session


@pytest.mark.asyncio
async def test_read_agent_from_drizzle_table(db_session):
    """Test reading an agent created by Drizzle (Agent-Builder).
    
    This verifies SQLAlchemy can read from Drizzle-managed tables.
    """
    # First, check if agents table exists and has data
    result = await db_session.execute(text("SELECT COUNT(*) FROM agents"))
    count = result.scalar()
    
    if count > 0:
        # Try to read an agent
        result = await db_session.execute(select(Agent).limit(1))
        agent = result.scalar_one_or_none()
        
        if agent:
            # Verify we can read all fields
            assert agent.id is not None
            assert agent.name is not None
            assert agent.stt_provider is not None
            assert agent.tts_provider is not None
            assert agent.llm_provider is not None
            
            # Test using our operations
            retrieved = await get_agent_by_id(db_session, agent.id)
            assert retrieved is not None
            assert retrieved.id == agent.id
    else:
        pytest.skip("No agents in database - run Drizzle migrations first")


@pytest.mark.asyncio
async def test_write_session_readable_by_drizzle(db_session):
    """Test writing a session that can be read by Drizzle.
    
    This verifies SQLAlchemy can write to Drizzle-managed tables.
    """
    # Clean up any existing test data
    await db_session.execute(
        text("DELETE FROM agent_instance_sessions WHERE session_id = 'compat-test-session'")
    )
    await db_session.commit()
    
    # Create a session using our operations
    session = await create_session(
        db_session,
        agent_id=1,
        tenant_id=1,
        session_id="compat-test-session",
        room_name="compat-test-room",
        status="active",
    )
    
    await db_session.commit()
    
    # Verify it was written correctly
    result = await db_session.execute(
        text("SELECT * FROM agent_instance_sessions WHERE session_id = 'compat-test-session'")
    )
    row = result.fetchone()
    
    assert row is not None
    assert row.session_id == "compat-test-session"
    assert row.agent_id == 1
    assert row.tenant_id == 1
    assert row.room_name == "compat-test-room"
    
    # Clean up
    await db_session.execute(
        text("DELETE FROM agent_instance_sessions WHERE session_id = 'compat-test-session'")
    )
    await db_session.commit()


@pytest.mark.asyncio
async def test_enum_compatibility(db_session):
    """Test that enums are compatible between SQLAlchemy and Drizzle."""
    # Check if we can read enum values from database
    result = await db_session.execute(
        text("SELECT deployment_mode FROM agents LIMIT 1")
    )
    enum_value = result.scalar_one_or_none()
    
    if enum_value:
        # Verify enum value is valid
        from src.database.models import DeploymentModeEnum
        assert enum_value in [e.value for e in DeploymentModeEnum]


@pytest.mark.asyncio
async def test_foreign_key_relationships(db_session):
    """Test foreign key relationships work correctly."""
    # Check if we can query with joins
    result = await db_session.execute(
        text("""
            SELECT a.id, a.name, t.name as tenant_name
            FROM agents a
            JOIN tenants t ON a.tenant_id = t.id
            LIMIT 1
        """)
    )
    row = result.fetchone()
    
    if row:
        assert row.id is not None
        assert row.name is not None
        # Verify relationship works
        pytest.skip("Foreign key relationships verified")

