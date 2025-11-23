"""Database operations for Agent-Runtime.

All operations use async SQLAlchemy and are compatible with Drizzle-managed tables.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from src.database.models import (
    Agent,
    AgentInstanceSession,
    SessionMetric,
    AgentMetric,
    TenantMetric,
    Tenant,
)


async def get_agent_by_id(session: AsyncSession, agent_id: int) -> Optional[Agent]:
    """Get agent by ID."""
    result = await session.execute(
        select(Agent).where(Agent.id == agent_id)
    )
    return result.scalar_one_or_none()


async def create_session(
    session: AsyncSession,
    agent_id: int,
    tenant_id: int,
    session_id: str,
    room_name: str,
    status: str = "active",
    runtime_instance_id: Optional[int] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AgentInstanceSession:
    """Create a new agent instance session."""
    new_session = AgentInstanceSession(
        agent_id=agent_id,
        tenant_id=tenant_id,
        session_id=session_id,
        room_name=room_name,
        status=status,
        runtime_instance_id=runtime_instance_id,
        metadata_json=metadata,
        started_at=datetime.utcnow(),
    )
    session.add(new_session)
    await session.flush()
    return new_session


async def update_session_status(
    session: AsyncSession,
    session_id: str,
    status: str,
    ended_at: Optional[datetime] = None,
    duration_seconds: Optional[int] = None,
    participant_count: Optional[int] = None,
) -> Optional[AgentInstanceSession]:
    """Update session status."""
    result = await session.execute(
        select(AgentInstanceSession).where(
            AgentInstanceSession.session_id == session_id
        )
    )
    agent_session = result.scalar_one_or_none()
    
    if agent_session:
        agent_session.status = status
        if ended_at:
            agent_session.ended_at = ended_at
        if duration_seconds is not None:
            agent_session.duration_seconds = duration_seconds
        if participant_count is not None:
            agent_session.participant_count = participant_count
        await session.flush()
    
    return agent_session


async def end_session(
    session: AsyncSession,
    session_id: str,
) -> Optional[AgentInstanceSession]:
    """End a session."""
    result = await session.execute(
        select(AgentInstanceSession).where(
            AgentInstanceSession.session_id == session_id
        )
    )
    agent_session = result.scalar_one_or_none()
    
    if agent_session:
        agent_session.status = "ended"
        agent_session.ended_at = datetime.utcnow()
        if agent_session.started_at:
            duration = (agent_session.ended_at - agent_session.started_at).total_seconds()
            agent_session.duration_seconds = int(duration)
        await session.flush()
    
    return agent_session


async def get_session_by_id(
    session: AsyncSession,
    session_id: str,
) -> Optional[AgentInstanceSession]:
    """Get session by session_id."""
    result = await session.execute(
        select(AgentInstanceSession).where(
            AgentInstanceSession.session_id == session_id
        )
    )
    return result.scalar_one_or_none()


async def get_agent_metrics(
    session: AsyncSession,
    agent_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """Get metrics for a specific agent."""
    # Query session metrics
    query = select(
        func.count(SessionMetric.id).label("total_sessions"),
        func.avg(SessionMetric.avg_llm_latency).label("avg_latency"),
        func.sum(SessionMetric.total_cost).label("total_cost"),
    ).where(SessionMetric.agent_id == agent_id)
    
    if start_date:
        query = query.where(SessionMetric.date >= start_date)
    if end_date:
        query = query.where(SessionMetric.date <= end_date)
    
    result = await session.execute(query)
    row = result.first()
    
    # Count active sessions
    active_sessions_query = select(func.count(AgentInstanceSession.id)).where(
        and_(
            AgentInstanceSession.agent_id == agent_id,
            AgentInstanceSession.status == "active"
        )
    )
    active_result = await session.execute(active_sessions_query)
    active_sessions = active_result.scalar() or 0
    
    return {
        "agentId": agent_id,
        "totalSessions": row.total_sessions or 0,
        "activeSessions": active_sessions,
        "avgLatency": float(row.avg_latency) if row.avg_latency else 0.0,
        "totalCost": float(row.total_cost) if row.total_cost else 0.0,
    }


async def get_tenant_metrics(
    session: AsyncSession,
    tenant_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """Get metrics for a specific tenant."""
    # Query tenant metrics
    query = select(
        func.sum(TenantMetric.active_agents).label("active_agents"),
        func.sum(TenantMetric.total_sessions).label("total_sessions"),
        func.sum(TenantMetric.total_cost).label("total_cost"),
    ).where(TenantMetric.tenant_id == tenant_id)
    
    if start_date:
        query = query.where(TenantMetric.date >= start_date)
    if end_date:
        query = query.where(TenantMetric.date <= end_date)
    
    result = await session.execute(query)
    row = result.first()
    
    return {
        "tenantId": tenant_id,
        "activeAgents": row.active_agents or 0,
        "totalSessions": row.total_sessions or 0,
        "totalCost": float(row.total_cost) if row.total_cost else 0.0,
    }


async def get_session_metrics(
    session: AsyncSession,
    session_id: str,
) -> Optional[Dict[str, Any]]:
    """Get metrics for a specific session."""
    result = await session.execute(
        select(SessionMetric).where(SessionMetric.session_id == session_id)
    )
    session_metric = result.scalar_one_or_none()
    
    if not session_metric:
        return None
    
    return {
        "sessionId": session_id,
        "messageCount": session_metric.message_count or 0,
        "avgLatency": session_metric.avg_llm_latency or 0,
        "totalCost": float(session_metric.total_cost) if session_metric.total_cost else 0.0,
    }


