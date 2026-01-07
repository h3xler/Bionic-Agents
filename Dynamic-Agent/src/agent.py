import asyncio
import logging
import os
import httpx
from typing import Optional
from dataclasses import dataclass
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, AgentSession, Agent
from livekit.plugins import google, silero

logger = logging.getLogger("dynamic-agent")

# Agent-Builder API URL
AGENT_BUILDER_API_URL = os.getenv("AGENT_BUILDER_API_URL", "http://agent_builder:3000")
DEFAULT_AGENT_ID = os.getenv("DEFAULT_AGENT_ID", "1")

# Map user-friendly model names to realtime audio API model names
# For Gemini Live API (bidiGenerateContent), only specific models are supported
MODEL_NAME_MAPPING = {
    "gemini-2.5-flash": "gemini-2.0-flash-exp",
    "gemini-2.5-pro": "gemini-2.0-flash-exp",
    "gemini-2.0-flash": "gemini-2.0-flash-exp",
    "gemini-1.5-flash": "gemini-2.0-flash-exp",
    "gemini-1.5-pro": "gemini-2.0-flash-exp",
}

# Default model for Gemini Live API
DEFAULT_REALTIME_MODEL = "gemini-2.0-flash-exp"


def get_realtime_model_name(model: str) -> str:
    """Convert user model name to realtime audio API model name"""
    if not model:
        return DEFAULT_REALTIME_MODEL
    # If already a supported live model, return as-is
    if model in ["gemini-2.0-flash-exp", "gemini-2.0-flash-live-001"]:
        return model
    # Check mapping
    if model in MODEL_NAME_MAPPING:
        return MODEL_NAME_MAPPING[model]
    # Default fallback
    return DEFAULT_REALTIME_MODEL


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
    language: str
    stt_provider: str
    tts_provider: str
    llm_provider: str


async def fetch_agent_config(agent_id: str) -> Optional[AgentConfig]:
    """Fetch agent configuration from Agent-Builder API"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{AGENT_BUILDER_API_URL}/api/agents/{agent_id}/config"
            logger.info(f"Fetching config from: {url}")
            response = await client.get(url)
            
            if response.status_code == 200:
                data = response.json()
                raw_model = data.get("llmModel", "")
                return AgentConfig(
                    agent_id=data.get("id", int(agent_id)),
                    name=data.get("name", "Assistant"),
                    system_prompt=data.get("systemPrompt", "You are a helpful assistant."),
                    initial_greeting=data.get("initialGreeting", ""),
                    model=get_realtime_model_name(raw_model),
                    voice=data.get("voiceId", "") or "Zephyr",
                    temperature=float(data.get("temperature", 0.6)),
                    language=data.get("languages", "en"),
                    stt_provider=data.get("sttProvider", "google"),
                    tts_provider=data.get("ttsProvider", "google"),
                    llm_provider=data.get("llmProvider", "gemini"),
                )
            else:
                logger.warning(f"Failed to fetch config: {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error fetching agent config: {e}")
        return None


def get_agent_id_from_room(room: rtc.Room) -> str:
    """Extract agent_id from room metadata or room name"""
    # Check room metadata first
    if room.metadata:
        try:
            import json
            metadata = json.loads(room.metadata)
            if "agent_id" in metadata:
                return str(metadata["agent_id"])
        except:
            pass
    
    # Fallback: extract from room name pattern
    room_name = room.name.lower()
    
    # Define room name patterns -> agent_id mapping
    patterns = {
        "support": "1",
        "translator": "2",
        "phone": "3",
        "sip": "3",
    }
    
    for pattern, agent_id in patterns.items():
        if pattern in room_name:
            return agent_id
    
    # Default agent
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
        language="tr",
        stt_provider="google",
        tts_provider="google",
        llm_provider="gemini",
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
    )
    
    # Create and start session
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
