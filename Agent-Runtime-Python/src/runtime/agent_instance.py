"""Agent Instance - manages individual agent instances."""

import json
import logging
from typing import Dict, Any, Set, Optional
from src.langfuse.langfuse_client import LangFuseClient

logger = logging.getLogger(__name__)


class AgentInstance:
    """Manages a single agent instance."""
    
    def __init__(self, agent_id: int, config: Dict[str, Any]):
        self.agent_id = agent_id
        self.config = config
        self.langfuse_client = LangFuseClient(config.get("langfuseConfig", {}))
        self.active_sessions: Set[str] = set()
        self.initialized = False
        # TODO: Add LiveKit agent session
        # self.agent_session: Optional[AgentSession] = None
    
    async def initialize(self) -> None:
        """Initialize the agent instance."""
        # TODO: Implement actual LiveKit AgentSession initialization
        # This is a placeholder structure
        self.initialized = True
    
    async def update_config(self, config: Dict[str, Any]) -> None:
        """Update agent configuration."""
        self.config = config
        self.langfuse_client = LangFuseClient(config.get("langfuseConfig", {}))
        # TODO: Update LiveKit agent session configuration
    
    async def join_room(self, room_name: str) -> Dict[str, Any]:
        """Join a LiveKit room.
        
        Note: LiveKit agent server handles the actual room connection
        via job dispatch. This method just tracks the session and
        optionally dispatches the agent explicitly if needed.
        """
        max_sessions = self.config.get("maxConcurrentSessions", 10)
        if len(self.active_sessions) >= max_sessions:
            raise ValueError(
                f"Agent {self.agent_id} is at capacity ({max_sessions} sessions)"
            )
        
        # Create session in session manager
        from src.runtime.session_manager import session_manager
        session = await session_manager.create_session(
            self.agent_id,
            self.config.get("tenantId"),
            room_name,
        )
        
        # Get session_id from the created session
        session_id = session["sessionId"]
        
        # Dispatch agent to room using LiveKit AgentDispatchService
        # This tells LiveKit to dispatch the agent to the room
        # The agent server will handle the actual connection
        agent_name = f"agent-{self.agent_id}"
        await self._dispatch_agent_to_room(room_name, agent_name, session_id)
        
        self.active_sessions.add(session_id)
        await session_manager.update_session_status(session_id, "active")
        
        return session
    
    async def _dispatch_agent_to_room(
        self, room_name: str, agent_name: str, session_id: str
    ) -> None:
        """Dispatch agent to room using LiveKit API."""
        try:
            from livekit import api
            import os
            
            # Use LiveKit service from same namespace
            livekit_url = self.config.get("livekitConfig", {}).get("url") or os.getenv("LIVEKIT_URL", "ws://livekit-service.livekit:7880")
            api_key = self.config.get("livekitConfig", {}).get("apiKey") or os.getenv("LIVEKIT_API_KEY")
            api_secret = self.config.get("livekitConfig", {}).get("apiSecret") or os.getenv("LIVEKIT_API_SECRET")
            
            if not all([livekit_url, api_key, api_secret]):
                logger.warning("LiveKit credentials not configured, agent dispatch may fail")
                return
            
            # Create LiveKit API client
            lkapi = api.LiveKitAPI(livekit_url, api_key, api_secret)
            
            # Dispatch agent with metadata
            metadata = json.dumps({
                "agentId": self.agent_id,
                "sessionId": session_id,
                "tenantId": self.config.get("tenantId"),
            })
            
            await lkapi.agent_dispatch.create_dispatch(
                api.CreateAgentDispatchRequest(
                    agent_name=agent_name,
                    room=room_name,
                    metadata=metadata,
                )
            )
            
            logger.info(f"Dispatched agent {agent_name} to room {room_name}")
        except Exception as e:
            logger.error(f"Failed to dispatch agent to room: {e}", exc_info=True)
            # Don't raise - session is still created, agent may connect via automatic dispatch
    
    async def leave_room(self, session_id: str) -> None:
        """Leave a LiveKit room."""
        self.active_sessions.discard(session_id)
        from src.runtime.session_manager import session_manager
        await session_manager.end_session(session_id)
    
    async def get_status(self) -> Dict[str, Any]:
        """Get agent instance status."""
        return {
            "active": self.initialized,
            "activeSessions": len(self.active_sessions),
            "maxSessions": self.config.get("maxConcurrentSessions", 10),
        }
    
    async def cleanup(self) -> None:
        """Cleanup agent instance."""
        # End all active sessions
        from src.runtime.session_manager import session_manager
        for session_id in list(self.active_sessions):
            await self.leave_room(session_id)
        
        # Disconnect from LiveKit
        # TODO: Implement cleanup
        self.initialized = False
    
    def get_langfuse_client(self) -> LangFuseClient:
        """Get LangFuse client."""
        return self.langfuse_client

