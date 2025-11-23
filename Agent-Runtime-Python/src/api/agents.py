"""Agent API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from src.database.db import get_db
from src.config.config import get_config

router = APIRouter(prefix="/api/agents", tags=["agents"])

# Import runtime (will be created in Task 2.6)
# from src.runtime.agent_runtime import agent_runtime


class RegisterAgentRequest(BaseModel):
    """Request model for agent registration."""
    agentId: int
    tenantId: int
    config: dict


class RegisterAgentResponse(BaseModel):
    """Response model for agent registration."""
    success: bool
    agentId: int


class AgentStatusResponse(BaseModel):
    """Response model for agent status."""
    registered: bool
    active: bool
    activeSessions: int
    maxSessions: int


class AgentListResponse(BaseModel):
    """Response model for agent list."""
    agents: list[int]


async def verify_api_key(
    authorization: Optional[str] = Header(None),
) -> None:
    """Verify API key from Authorization header."""
    config = get_config()
    if config.runtime.api_key:
        if not authorization:
            raise HTTPException(status_code=401, detail="Unauthorized")
        token = authorization.replace("Bearer ", "")
        if token != config.runtime.api_key:
            raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/register", response_model=RegisterAgentResponse)
async def register_agent(
    request: RegisterAgentRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_api_key),
):
    """Register an agent with the runtime."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        await agent_runtime.register_agent(
            request.agentId, request.tenantId, request.config
        )
        return RegisterAgentResponse(success=True, agentId=request.agentId)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{agent_id}")
async def unregister_agent(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(verify_api_key),
):
    """Unregister an agent from the runtime."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        await agent_runtime.unregister_agent(agent_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{agent_id}", response_model=AgentStatusResponse)
async def get_agent_status(
    agent_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get the status of a specific agent."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        status = await agent_runtime.get_agent_status(agent_id)
        return AgentStatusResponse(**status)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=AgentListResponse)
async def list_agents(
    db: AsyncSession = Depends(get_db),
):
    """List all registered agents."""
    try:
        from src.runtime.agent_runtime import agent_runtime
        agents = await agent_runtime.list_agents()
        return AgentListResponse(agents=agents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

