# Architecture & Connectivity Guide

## Overview

The Bionic Agents platform consists of three main applications that work together:

1. **Agent-Builder**: Creates and deploys agents to Agent-Runtime
2. **Agent-Runtime**: Runs agents and connects them to LiveKit
3. **Agent-Dashboard**: Monitors and displays agent activity

## Connectivity Flow

### 1. Agent-Builder → Database
- **Purpose**: Stores agent configurations and global settings
- **Connection**: PostgreSQL database (`liveagents`)
- **Settings Stored**:
  - LiveKit URL, API Key, API Secret
  - LangFuse configuration
  - Agent definitions and configurations

### 2. Agent-Builder → Agent-Runtime
- **Purpose**: Deploys/registers agents with the runtime
- **Connection**: HTTP API (`http://agent-runtime:8080/api/agents/register`)
- **Data Sent**: Agent configuration including LiveKit config from database
- **Environment Variable**: `AGENT_RUNTIME_API_URL=http://agent-runtime:8080`

### 3. Agent-Runtime → LiveKit Server
- **Purpose**: Agents connect to LiveKit rooms to handle user sessions
- **Connection**: WebSocket (`ws://localhost:7880` for local dev)
- **Configuration Source**: 
  - Primary: From agent registration (config.livekitConfig)
  - Fallback: Environment variables (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)

### 4. Agent-Runtime → Database
- **Purpose**: Store session data and agent status
- **Connection**: PostgreSQL database (`liveagents`)

### 5. Agent-Dashboard → Database
- **Purpose**: Read agent configurations and session data
- **Connection**: PostgreSQL database (`liveagents`)

### 6. Agent-Dashboard → Agent-Runtime
- **Purpose**: Get real-time agent status and metrics
- **Connection**: HTTP API (`http://agent-runtime:8080/api/agents`)

### 7. Agent-Dashboard → LiveKit Server
- **Purpose**: Get session statistics and room information
- **Connection**: LiveKit API (using credentials from database settings)

### 8. Widget (Browser) → Agent-Builder
- **Purpose**: Get LiveKit access token
- **Connection**: tRPC API (`/api/trpc/livekit.getToken`)
- **Token Source**: Generated using LiveKit credentials from database settings

### 9. Widget (Browser) → LiveKit Server
- **Purpose**: Real-time voice/video communication
- **Connection**: WebSocket (`ws://localhost:7880`)

## Current Configuration

### Database Settings (Source of Truth)
- `livekit_url`: `ws://localhost:7880`
- `livekit_api_key`: `devkey-livekit-api-key-2024`
- `livekit_api_secret`: `devkey-livekit-api-secret-2024-min-32-chars`

### Docker Compose Environment Variables
All services have these as defaults (but Agent-Builder reads from database):
- `LIVEKIT_URL=ws://localhost:7880`
- `LIVEKIT_API_KEY=devkey-livekit-api-key-2024`
- `LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars`

## Key Points

1. **Agent-Builder** uses database settings (via `getSetting()`) for LiveKit configuration
2. **Agent-Runtime** should use LiveKit config from agent registration (`config.livekitConfig`)
3. **Agent-Dashboard** reads from database and connects to Agent-Runtime API
4. **Widget** gets tokens from Agent-Builder which uses database settings

## Fixes Applied

1. ✅ Fixed widget error: Changed `videoTracks.values()` to `videoTrackPublications.values()`
2. ✅ Updated docker-compose defaults to match database settings
3. ✅ Agent-Builder sends LiveKit config in agent registration
4. ⚠️ Agent-Runtime needs to use `config.livekitConfig` when connecting (TODO in code)

## Next Steps

1. Implement AgentInstance to actually connect to LiveKit using `config.livekitConfig`
2. Ensure Agent-Dashboard can query Agent-Runtime API
3. Test end-to-end flow: Widget → LiveKit → Agent-Runtime → Agent


