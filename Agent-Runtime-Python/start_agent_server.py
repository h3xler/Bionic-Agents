#!/usr/bin/env python3
"""Start the LiveKit Agent Server.

This script starts the LiveKit agent server that connects to LiveKit
and handles agent job dispatch.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from livekit.agents import AgentServer, JobContext, rtc
from livekit.plugins import silero, deepgram, elevenlabs, openai, anthropic, bithuman
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from src.config.config import get_config
from src.runtime.agent_manager import agent_manager
from src.livekit.agent_config_mapper import AgentConfigMapper


async def agent_entrypoint(ctx: JobContext):
    """Entrypoint for agent jobs from LiveKit."""
    print(f"📥 Agent job received for room: {ctx.room.name}")
    
    # Extract agent ID from room name pattern: agent-{id}-room
    room_name = ctx.room.name
    agent_id = None
    
    if room_name.startswith("agent-") and room_name.endswith("-room"):
        try:
            agent_id_str = room_name.replace("agent-", "").replace("-room", "")
            agent_id = int(agent_id_str)
        except ValueError:
            print(f"⚠️  Could not extract agent ID from room name: {room_name}")
    
    if not agent_id:
        print(f"❌ Invalid room name format: {room_name}")
        await ctx.disconnect()
        return
    
    # Get agent instance from agent manager
    agent_instance = agent_manager.get_agent_instance(agent_id)
    if not agent_instance:
        print(f"❌ Agent {agent_id} not registered")
        await ctx.disconnect()
        return
    
    print(f"✅ Found agent {agent_id}, connecting to room...")
    
    # Get agent config
    config = agent_instance.config
    
    # Create agent session using config mapper
    try:
        agent_session = await AgentConfigMapper.create_agent_session(config)
        agent = AgentConfigMapper.create_livekit_agent(config)
        
        # Connect to room
        await agent_session.start(
            room=ctx.room,
            agent=agent,
        )
        
        print(f"✅ Agent {agent_id} connected to room {room_name}")
        
        # Wait for room to end
        await ctx.wait_for_disconnect()
        
        print(f"✅ Agent {agent_id} disconnected from room {room_name}")
        
    except Exception as e:
        print(f"❌ Error connecting agent {agent_id}: {e}", exc_info=True)
        await ctx.disconnect()


async def main():
    """Main entry point for agent server."""
    config = get_config()
    
    print("🚀 Starting LiveKit Agent Server...")
    print(f"   LiveKit URL: {config.livekit.url}")
    print(f"   API Key: {config.livekit.api_key[:10]}...")
    
    # Create agent server
    server = AgentServer(
        entrypoint_fnc=agent_entrypoint,
        api_key=config.livekit.api_key,
        api_secret=config.livekit.api_secret,
        ws_url=config.livekit.url,
    )
    
    print("✅ Agent Server created")
    print("📡 Waiting for agent jobs from LiveKit...")
    
    # Start the server
    await server.start()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Agent Server stopped")
    except Exception as e:
        print(f"❌ Agent Server error: {e}", exc_info=True)
        sys.exit(1)

