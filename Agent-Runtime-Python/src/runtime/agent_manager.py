"""Agent Manager - manages agent instances."""

from typing import Dict, Any, Optional
from src.runtime.agent_instance import AgentInstance


class AgentManager:
    """Manages agent instances."""
    
    def __init__(self):
        self._agent_instances: Dict[int, AgentInstance] = {}
        self._configs: Dict[int, Dict[str, Any]] = {}
    
    async def register_agent(
        self,
        agent_id: int,
        config: Dict[str, Any]
    ) -> None:
        """Register an agent."""
        self._configs[agent_id] = config
        
        # Create agent instance if not exists
        if agent_id not in self._agent_instances:
            instance = AgentInstance(agent_id, config)
            await instance.initialize()
            self._agent_instances[agent_id] = instance
        else:
            # Update existing instance
            instance = self._agent_instances[agent_id]
            await instance.update_config(config)
    
    async def unregister_agent(self, agent_id: int) -> None:
        """Unregister an agent."""
        instance = self._agent_instances.get(agent_id)
        if instance:
            await instance.cleanup()
            del self._agent_instances[agent_id]
        
        if agent_id in self._configs:
            del self._configs[agent_id]
    
    def get_agent_instance(self, agent_id: int) -> Optional[AgentInstance]:
        """Get agent instance by ID."""
        return self._agent_instances.get(agent_id)
    
    def get_agent_config(self, agent_id: int) -> Optional[Dict[str, Any]]:
        """Get agent config by ID."""
        return self._configs.get(agent_id)
    
    def list_agents(self) -> list[int]:
        """List all registered agent IDs."""
        return list(self._agent_instances.keys())
    
    async def get_agent_status(self, agent_id: int) -> Dict[str, Any]:
        """Get agent status."""
        instance = self._agent_instances.get(agent_id)
        if not instance:
            return {
                "registered": False,
                "active": False,
                "activeSessions": 0,
                "maxSessions": 0,
            }
        
        status = await instance.get_status()
        return {
            "registered": True,
            "active": status["active"],
            "activeSessions": status["activeSessions"],
            "maxSessions": status["maxSessions"],
        }


# Global instance
agent_manager = AgentManager()


