"""Metrics API endpoints."""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import date

from src.database.db import get_db
from src.database.operations import (
    get_agent_metrics,
    get_tenant_metrics,
    get_session_metrics,
)

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


class AgentMetricsResponse(BaseModel):
    """Response model for agent metrics."""
    agentId: int
    totalSessions: int
    activeSessions: int
    avgLatency: float
    totalCost: float


class TenantMetricsResponse(BaseModel):
    """Response model for tenant metrics."""
    tenantId: int
    activeAgents: int
    totalSessions: int
    totalCost: float


class SessionMetricsResponse(BaseModel):
    """Response model for session metrics."""
    sessionId: str
    messageCount: int
    avgLatency: int
    totalCost: float


@router.get("/agent/{agent_id}", response_model=AgentMetricsResponse)
async def get_agent_metrics_endpoint(
    agent_id: int,
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    db: AsyncSession = Depends(get_db),
):
    """Get metrics for a specific agent."""
    try:
        start = date.fromisoformat(start_date) if start_date else None
        end = date.fromisoformat(end_date) if end_date else None
        
        metrics = await get_agent_metrics(db, agent_id, start, end)
        return AgentMetricsResponse(**metrics)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenant/{tenant_id}", response_model=TenantMetricsResponse)
async def get_tenant_metrics_endpoint(
    tenant_id: int,
    start_date: Optional[str] = Query(None, alias="startDate"),
    end_date: Optional[str] = Query(None, alias="endDate"),
    db: AsyncSession = Depends(get_db),
):
    """Get metrics for a specific tenant."""
    try:
        start = date.fromisoformat(start_date) if start_date else None
        end = date.fromisoformat(end_date) if end_date else None
        
        metrics = await get_tenant_metrics(db, tenant_id, start, end)
        return TenantMetricsResponse(**metrics)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}", response_model=SessionMetricsResponse)
async def get_session_metrics_endpoint(
    session_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get metrics for a specific session."""
    try:
        metrics = await get_session_metrics(db, session_id)
        if not metrics:
            raise HTTPException(status_code=404, detail="Session not found")
        return SessionMetricsResponse(**metrics)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

