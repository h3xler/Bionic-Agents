"""Session API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime

from src.database.db import get_db
from src.database.operations import (
    create_session,
    end_session as db_end_session,
    get_session_by_id,
)

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Import runtime (will be created in Task 2.6)
# from src.runtime.agent_runtime import agent_runtime


class CreateSessionRequest(BaseModel):
    """Request model for session creation."""
    agentId: int
    tenantId: int
    roomName: str
    participantName: Optional[str] = None


class SessionInfo(BaseModel):
    """Session information model."""
    sessionId: str
    roomName: str


class CreateSessionResponse(BaseModel):
    """Response model for session creation."""
    success: bool
    session: SessionInfo


class SessionResponse(BaseModel):
    """Response model for session details."""
    sessionId: str
    agentId: int
    tenantId: int
    roomName: str
    status: str
    startedAt: datetime
    endedAt: Optional[datetime] = None
    participantCount: int
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat() + "Z" if v else None
        }


@router.post("/create", response_model=CreateSessionResponse)
async def create_session_endpoint(
    request: CreateSessionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a new agent session."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        session = await agent_runtime.create_session(
            request.agentId, request.tenantId, request.roomName, request.participantName
        )
        
        return CreateSessionResponse(
            success=True,
            session=SessionInfo(**session),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{session_id}/end")
async def end_session_endpoint(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """End an active session."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        await agent_runtime.end_session(session_id)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get session details."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        session = await agent_runtime.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return SessionResponse(**session)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

