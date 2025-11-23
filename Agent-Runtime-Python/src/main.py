"""FastAPI application entry point for Agent Runtime."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from src.api import agents, sessions, metrics, health
from src.config.config import get_config

config = get_config()

app = FastAPI(
    title="Agent Runtime API",
    version="1.0.0",
    description="Agent Runtime service for LiveKit agents with BitHuman avatar support",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(agents.router)
app.include_router(sessions.router)
app.include_router(metrics.router)
app.include_router(health.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Agent Runtime API", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=config.runtime.host,
        port=config.runtime.port,
        reload=True,
    )

