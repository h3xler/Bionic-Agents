"""Agent Runtime main class."""

from typing import Dict, Any, Optional
from src.runtime.agent_manager import agent_manager
from src.runtime.session_manager import session_manager
from nanoid import generate as nanoid_generate


class AgentRuntime:
    """Main agent runtime class."""
    
    async def register_agent(
        self,
        agent_id: int,
        tenant_id: int,
        config: Dict[str, Any]
    ) -> None:
        """Register an agent with the runtime."""
        await agent_manager.register_agent(agent_id, config)
    
    async def unregister_agent(self, agent_id: int) -> None:
        """Unregister an agent from the runtime."""
        await agent_manager.unregister_agent(agent_id)
    
    async def create_session(
        self,
        agent_id: int,
        tenant_id: int,
        room_name: str,
        participant_name: Optional[str] = None
    ) -> Dict[str, str]:
        """Create a new agent session."""
        instance = agent_manager.get_agent_instance(agent_id)
        if not instance:
            raise ValueError(f"Agent {agent_id} not registered")
        
        # join_room will create the session and return it
        session = await instance.join_room(room_name)
        
        return {"sessionId": session["sessionId"], "roomName": room_name}
    
    async def end_session(self, session_id: str) -> None:
        """End an agent session."""
        session = await session_manager.get_session(session_id)
        if not session:
            # Try to end session anyway (might be in database but not in cache)
            await session_manager.end_session(session_id)
            return
        
        instance = agent_manager.get_agent_instance(session["agentId"])
        if instance:
            await instance.leave_room(session_id)
        else:
            await session_manager.end_session(session_id)
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session details."""
        session = await session_manager.get_session(session_id)
        if not session:
            return None
        
        # Convert to dict format expected by API
        return {
            "sessionId": session["sessionId"],
            "agentId": session["agentId"],
            "tenantId": session["tenantId"],
            "roomName": session["roomName"],
            "status": session["status"],
            "startedAt": session["startedAt"],
            "endedAt": session.get("endedAt"),
            "participantCount": session.get("participantCount", 0),
        }
    
    async def get_agent_status(self, agent_id: int) -> Dict[str, Any]:
        """Get agent status."""
        return await agent_manager.get_agent_status(agent_id)
    
    async def list_agents(self) -> list[int]:
        """List all registered agents."""
        return agent_manager.list_agents()


# Global instance
agent_runtime = AgentRuntime()

