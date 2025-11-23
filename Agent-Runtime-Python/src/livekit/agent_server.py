"""LiveKit Agent Server implementation.

This module sets up the LiveKit agent server that handles job dispatch
and creates agent sessions. It leverages LiveKit's built-in capabilities
for agent server lifecycle, job dispatch, and room management.
"""

import json
import logging
import os
from typing import Optional
from livekit import agents, rtc
from livekit.agents import AgentServer, JobContext, AgentSession, Agent

# Try to import room_io (may not be available in all SDK versions)
try:
    from livekit.agents import room_io
    ROOM_IO_AVAILABLE = True
except (ImportError, ModuleNotFoundError, AttributeError):
    ROOM_IO_AVAILABLE = False
    room_io = None

# Try to import noise cancellation (optional plugin)
NOISE_CANCELLATION_AVAILABLE = False
noise_cancellation = None
try:
    import importlib
    noise_cancellation_module = importlib.import_module('livekit.plugins.noise_cancellation')
    noise_cancellation = noise_cancellation_module
    NOISE_CANCELLATION_AVAILABLE = True
except (ImportError, ModuleNotFoundError, AttributeError):
    pass

from src.runtime.agent_manager import agent_manager
from src.livekit.agent_config_mapper import create_agent_session_from_config

logger = logging.getLogger(__name__)

# Create agent server instance
server = AgentServer()


def extract_agent_id_from_room(room_name: str) -> Optional[int]:
    """Extract agent ID from room name pattern: agent-{id}-room"""
    try:
        # Room name pattern: "agent-{id}-room" or similar
        if room_name.startswith("agent-"):
            parts = room_name.split("-")
            if len(parts) >= 2:
                return int(parts[1])
    except (ValueError, IndexError):
        pass
    return None


@server.rtc_session()
async def agent_entrypoint(ctx: JobContext):
    """Main entrypoint for agent jobs.
    
    This function is called by LiveKit when a job is dispatched.
    LiveKit handles:
    - Agent server registration
    - Job dispatch and load balancing
    - Room connection lifecycle
    - Process isolation
    
    We handle:
    - Extracting agent ID from room name or job metadata
    - Looking up agent config from AgentManager
    - Creating AgentSession with appropriate providers
    - Starting the agent session
    """
    room_name = ctx.room.name
    logger.info(f"Agent job dispatched to room: {room_name}")
    
    # Extract agent ID from room name or job metadata
    agent_id = None
    
    # Try to get agent ID from job metadata first
    if ctx.job.metadata:
        try:
            metadata = json.loads(ctx.job.metadata)
            agent_id = metadata.get("agentId")
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Fallback to extracting from room name
    if agent_id is None:
        agent_id = extract_agent_id_from_room(room_name)
    
    if agent_id is None:
        logger.error(f"Could not determine agent ID for room: {room_name}")
        return
    
    # Get agent config from AgentManager
    agent_config = agent_manager.get_agent_config(agent_id)
    if not agent_config:
        logger.error(f"Agent {agent_id} not found in AgentManager")
        return
    
    logger.info(f"Creating agent session for agent {agent_id}")
    
    # Create agent session using config mapper
    # This will set up STT, TTS, LLM providers based on config
    session = await create_agent_session_from_config(agent_config, ctx.room)
    
    if not session:
        logger.error(f"Failed to create agent session for agent {agent_id}")
        return
    
    # Create Agent instance with system prompt
    system_prompt = agent_config.get("systemPrompt", "You are a helpful AI assistant.")
    agent = Agent(instructions=system_prompt)
    
    # Configure room options (noise cancellation, etc.)
    if ROOM_IO_AVAILABLE and room_io:
        if NOISE_CANCELLATION_AVAILABLE and noise_cancellation:
            room_options = room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
            )
        else:
            room_options = room_io.RoomOptions()
    else:
        room_options = None
    
    # Start the agent session
    # AgentSession handles:
    # - STT-LLM-TTS pipeline
    # - Turn detection
    # - Audio streaming
    # - Room connection
    if room_options:
        await session.start(
            room=ctx.room,
            agent=agent,
            room_options=room_options,
        )
    else:
        await session.start(
            room=ctx.room,
            agent=agent,
        )
    
    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )
    
    logger.info(f"Agent session started for agent {agent_id} in room {room_name}")


def run_agent_server():
    """Run the agent server.
    
    This starts the LiveKit agent server which:
    - Registers with LiveKit Cloud/server
    - Waits for job dispatch requests
    - Handles load balancing automatically
    - Manages process lifecycle
    """
    # Run the agent server using LiveKit CLI
    # This handles all the server lifecycle management
    agents.cli.run_app(server)


if __name__ == "__main__":
    run_agent_server()
