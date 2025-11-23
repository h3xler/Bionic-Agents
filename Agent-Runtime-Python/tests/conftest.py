"""Pytest configuration and fixtures."""

import os
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from src.database.models import Base
from src.database.db import AsyncSessionLocal, engine

# Test database URL
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/liveagents_test"
)

# Convert to async URL
if TEST_DATABASE_URL.startswith("postgresql://"):
    ASYNC_TEST_DATABASE_URL = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    ASYNC_TEST_DATABASE_URL = TEST_DATABASE_URL


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    test_engine = create_async_engine(
        ASYNC_TEST_DATABASE_URL,
        poolclass=NullPool,
        echo=False,
    )
    yield test_engine
    await test_engine.dispose()


@pytest.fixture(scope="function")
async def db_session(test_engine):
    """Create a database session for each test."""
    # Create session
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        # Clean up test data before test
        await session.execute(text("DELETE FROM agent_instance_sessions WHERE session_id LIKE 'test-%'"))
        await session.execute(text("DELETE FROM session_metrics WHERE session_id LIKE 'test-%'"))
        await session.commit()
        
        yield session
        
        # Clean up test data after test
        await session.execute(text("DELETE FROM agent_instance_sessions WHERE session_id LIKE 'test-%'"))
        await session.execute(text("DELETE FROM session_metrics WHERE session_id LIKE 'test-%'"))
        await session.commit()
        await session.rollback()


@pytest.fixture
def sample_agent_config():
    """Sample agent configuration for testing."""
    return {
        "agentId": 1,
        "tenantId": 1,
        "name": "Test Agent",
        "description": "Test agent description",
        "sttProvider": "assemblyai",
        "ttsProvider": "cartesia",
        "llmProvider": "openai",
        "llmModel": "gpt-4.1-mini",
        "systemPrompt": "You are a helpful test assistant.",
        "visionEnabled": False,
        "screenShareEnabled": False,
        "transcribeEnabled": True,
        "languages": ["en"],
        "voiceId": "test-voice-id",
        "avatarModel": None,
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

