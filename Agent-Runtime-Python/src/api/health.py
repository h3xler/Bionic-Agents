"""Health check endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from datetime import datetime
from pydantic import BaseModel

from src.database.db import get_db

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Response model for health checks."""
    status: str
    timestamp: str


class NotReadyResponse(BaseModel):
    """Response model for not ready status."""
    status: str
    reason: str


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat() + "Z",
    )


@router.get("/ready", response_model=HealthResponse)
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Readiness check endpoint (includes database connectivity check)."""
    try:
        # Test database connection
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        
        return HealthResponse(
            status="ready",
            timestamp=datetime.utcnow().isoformat() + "Z",
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"status": "not ready", "reason": f"database not connected: {str(e)}"}
        )


