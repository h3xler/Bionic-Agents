import asyncio
import logging
import os
import httpx
from typing import Optional
from dataclasses import dataclass
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, AgentSession, Agent
from livekit.plugins import google, silero
from google.genai import types

logger = logging.getLogger("dynamic-agent")

# Agent-Builder API URL
AGENT_BUILDER_API_URL = os.getenv("AGENT_BUILDER_API_URL", "http://agent_builder:3000")
DEFAULT_AGENT_ID = os.getenv("DEFAULT_AGENT_ID", "1")

# Default model for Gemini Live API - native audio for best quality
DEFAULT_REALTIME_MODEL = "gemini-2.5-flash-native-audio-preview-09-2025"


@dataclass
class AgentConfig:
    """Agent configuration from Agent-Builder"""
    agent_id: int
    name: str
    system_prompt: str
    initial_greeting: str
    model: str
    voice: str
    temperature: float


async def fetch_agent_config(agent_id: str) -> Optional[AgentConfig]:
    """Fetch agent configuration from Agent-Builder API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{AGENT_BUILDER_API_URL}/api/agents/{agent_id}/config"
            logger.info(f"Fetching config from: {url}")
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                return AgentConfig(
                    agent_id=data.get("id", int(agent_id)),
                    name=data.get("name", "Assistant"),
                    system_prompt=data.get("systemPrompt", "You are a helpful assistant."),
                    initial_greeting=data.get("initialGreeting", ""),
                    model=DEFAULT_REALTIME_MODEL,  # Always use native audio model
                    voice=data.get("voiceId", "") or "Zephyr",
                    temperature=float(data.get("temperature", 0.6)),
                )
            else:
                logger.warning(f"Failed to fetch config: {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching agent config: {e}")
        return None


def get_agent_id_from_room(room: rtc.Room) -> str:
    """Extract agent_id from room metadata or room name"""
    if room.metadata:
        try:
            import json
            metadata = json.loads(room.metadata)
            if "agent_id" in metadata:
                return str(metadata["agent_id"])
        except:
            pass
    
    room_name = room.name.lower()
    patterns = {
        "support": "1",
        "translator": "2",
        "phone": "3",
        "sip": "3",
    }
    
    for pattern, agent_id in patterns.items():
        if pattern in room_name:
            return agent_id
    
    return DEFAULT_AGENT_ID


def get_default_config() -> AgentConfig:
    """Return default configuration when API is unavailable"""
    return AgentConfig(
        agent_id=1,
        name="Default Assistant",
        system_prompt="You are a helpful AI assistant. You speak Turkish fluently.",
        initial_greeting="Merhaba! Size nasıl yardımcı olabilirim?",
        model=DEFAULT_REALTIME_MODEL,
        voice="Zephyr",
        temperature=0.6,
    )


class DynamicAssistant(Agent):
    """Dynamic assistant that uses configuration from Agent-Builder"""
    
    def __init__(self, config: AgentConfig) -> None:
        super().__init__(instructions=config.system_prompt)
        self.config = config


def prewarm(proc: agents.JobProcess):
    """Prewarm function to load VAD model"""
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    """Main entrypoint for the dynamic agent"""
    await ctx.connect()
    logger.info(f"Connected to room: {ctx.room.name}")
    
    # Get agent_id from room
    agent_id = get_agent_id_from_room(ctx.room)
    logger.info(f"Using agent_id: {agent_id}")
    
    # Fetch config from Agent-Builder
    config = await fetch_agent_config(agent_id)
    
    if not config:
        logger.warning("Could not fetch config, using defaults")
        config = get_default_config()
    
    logger.info(f"Agent config: name={config.name}, model={config.model}, voice={config.voice}")
    
    # Create the model based on config
    model = google.realtime.RealtimeModel(
        model=config.model,
        voice=config.voice,
        instructions=config.system_prompt,
        temperature=config.temperature,
        thinking_config=types.ThinkingConfig(include_thoughts=False),
    )
    
    # Create and start session (EXACTLY like original working version)
    session = AgentSession(llm=model, vad=ctx.proc.userdata["vad"])
    
    await session.start(room=ctx.room, agent=DynamicAssistant(config))
    
    # Send initial greeting if configured
    if config.initial_greeting:
        logger.info(f"Sending initial greeting: {config.initial_greeting[:50]}...")
        await session.generate_reply(instructions=config.initial_greeting)
    
    logger.info("Agent session started successfully")


if __name__ == "__main__":
    agents.cli.run_app(
        agents.WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm,
        )
    )
