#!/usr/bin/env python3
"""Direct entry point for agent server to avoid __init__.py issues."""

import sys
import os

# Add app to path
sys.path.insert(0, '/app')

# Import directly from agent_server module without going through __init__.py
import importlib.util
spec = importlib.util.spec_from_file_location("agent_server", "/app/src/livekit/agent_server.py")
agent_server_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent_server_module)

if __name__ == "__main__":
    agent_server_module.run_agent_server()

