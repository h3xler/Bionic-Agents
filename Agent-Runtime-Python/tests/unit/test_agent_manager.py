"""Unit tests for AgentManager using real database."""

import pytest
from src.runtime.agent_manager import AgentManager


@pytest.mark.asyncio
async def test_register_agent(agent_manager, sample_agent_config):
    """Test registering an agent."""
    await agent_manager.register_agent(1, sample_agent_config)
    
    # Verify agent is registered
    instance = agent_manager.get_agent_instance(1)
    assert instance is not None
    assert instance.agent_id == 1
    
    config = agent_manager.get_agent_config(1)
    assert config is not None
    assert config["agentId"] == 1


@pytest.mark.asyncio
async def test_unregister_agent(agent_manager, sample_agent_config):
    """Test unregistering an agent."""
    await agent_manager.register_agent(1, sample_agent_config)
    
    # Unregister
    await agent_manager.unregister_agent(1)
    
    # Verify agent is unregistered
    instance = agent_manager.get_agent_instance(1)
    assert instance is None
    
    config = agent_manager.get_agent_config(1)
    assert config is None


@pytest.mark.asyncio
async def test_list_agents(agent_manager, sample_agent_config):
    """Test listing agents."""
    # Register multiple agents
    await agent_manager.register_agent(1, sample_agent_config)
    
    config2 = sample_agent_config.copy()
    config2["agentId"] = 2
    await agent_manager.register_agent(2, config2)
    
    # List agents
    agents = agent_manager.list_agents()
    
    assert 1 in agents
    assert 2 in agents
    assert len(agents) == 2


@pytest.mark.asyncio
async def test_get_agent_status(agent_manager, sample_agent_config):
    """Test getting agent status."""
    await agent_manager.register_agent(1, sample_agent_config)
    
    status = await agent_manager.get_agent_status(1)
    
    assert status["registered"] is True
    assert "active" in status
    assert "activeSessions" in status
    assert "maxSessions" in status


@pytest.mark.asyncio
async def test_get_agent_status_not_registered(agent_manager):
    """Test getting status for unregistered agent."""
    status = await agent_manager.get_agent_status(999)
    
    assert status["registered"] is False
    assert status["active"] is False
    assert status["activeSessions"] == 0
    assert status["maxSessions"] == 0


@pytest.fixture
def agent_manager():
    """Create a fresh AgentManager instance for each test."""
    return AgentManager()

