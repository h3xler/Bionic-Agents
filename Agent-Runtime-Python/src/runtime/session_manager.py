"""Session Manager - manages agent sessions."""

from typing import Dict, Any, Set, Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from nanoid import generate as nanoid_generate

from src.database.db import get_db
from src.database.operations import (
    create_session as db_create_session,
    update_session_status as db_update_session_status,
    end_session as db_end_session,
)


class SessionManager:
    """Manages agent sessions."""
    
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._agent_sessions: Dict[int, Set[str]] = {}
    
    async def create_session(
        self,
        agent_id: int,
        tenant_id: int,
        room_name: str,
        runtime_instance_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Create a new session."""
        session_id = nanoid_generate()
        session: Dict[str, Any] = {
            "sessionId": session_id,
            "agentId": agent_id,
            "tenantId": tenant_id,
            "roomName": room_name,
            "status": "connecting",
            "startedAt": datetime.utcnow(),
            "participantCount": 0,
        }
        
        self._sessions[session_id] = session
        
        if agent_id not in self._agent_sessions:
            self._agent_sessions[agent_id] = set()
        self._agent_sessions[agent_id].add(session_id)
        
        # Store in database
        await self._save_session_to_db(session, runtime_instance_id)
        
        return session
    
    async def update_session_status(
        self,
        session_id: str,
        status: str,
        participant_count: Optional[int] = None
    ) -> None:
        """Update session status."""
        session = self._sessions.get(session_id)
        if not session:
            return
        
        session["status"] = status
        if participant_count is not None:
            session["participantCount"] = participant_count
        
        if status == "ended":
            session["endedAt"] = datetime.utcnow()
            await self._update_session_in_db(session_id, session)
    
    async def end_session(self, session_id: str) -> None:
        """End a session."""
        await self.update_session_status(session_id, "ended")
        session = self._sessions.get(session_id)
        if session:
            del self._sessions[session_id]
            agent_sessions = self._agent_sessions.get(session["agentId"])
            if agent_sessions:
                agent_sessions.discard(session_id)
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session by ID."""
        # First check in-memory cache
        session = self._sessions.get(session_id)
        if session:
            return session
        
        # If not in cache, try to load from database
        try:
            from src.database.db import AsyncSessionLocal
            from src.database.operations import get_session_by_id
            async with AsyncSessionLocal() as db:
                db_session = await get_session_by_id(db, session_id)
                if db_session:
                    # Convert database model to dict format
                    session = {
                        "sessionId": db_session.session_id,
                        "agentId": db_session.agent_id,
                        "tenantId": db_session.tenant_id,
                        "roomName": db_session.room_name,
                        "status": db_session.status,
                        "startedAt": db_session.started_at,
                        "endedAt": db_session.ended_at,
                        "participantCount": db_session.participant_count or 0,
                    }
                    # Cache it
                    self._sessions[session_id] = session
                    return session
        except Exception as e:
            print(f"Failed to load session from DB: {e}")
        
        return None
    
    async def get_agent_sessions(self, agent_id: int) -> List[Dict[str, Any]]:
        """Get all sessions for an agent."""
        session_ids = self._agent_sessions.get(agent_id, set())
        sessions = []
        for sid in session_ids:
            session = await self.get_session(sid)
            if session:
                sessions.append(session)
        return sessions
    
    async def _save_session_to_db(
        self,
        session: Dict[str, Any],
        runtime_instance_id: Optional[int] = None
    ) -> None:
        """Save session to database."""
        try:
            from src.database.db import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                await db_create_session(
                    db,
                    agent_id=session["agentId"],
                    tenant_id=session["tenantId"],
                    session_id=session["sessionId"],
                    room_name=session["roomName"],
                    status=session["status"],
                    runtime_instance_id=runtime_instance_id,
                )
                await db.commit()
        except Exception as e:
            print(f"Failed to save session to DB: {e}")
    
    async def _update_session_in_db(
        self,
        session_id: str,
        session: Dict[str, Any]
    ) -> None:
        """Update session in database."""
        try:
            from src.database.db import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                ended_at = session.get("endedAt")
                duration_seconds = None
                if ended_at and session.get("startedAt"):
                    duration = (ended_at - session["startedAt"]).total_seconds()
                    duration_seconds = int(duration)
                
                await db_update_session_status(
                    db,
                    session_id=session_id,
                    status=session["status"],
                    ended_at=ended_at,
                    duration_seconds=duration_seconds,
                    participant_count=session.get("participantCount"),
                )
                await db.commit()
        except Exception as e:
            print(f"Failed to update session in DB: {e}")


# Global instance
session_manager = SessionManager()

