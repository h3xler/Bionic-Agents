# LiveKit Agent Server

The Agent Runtime includes a LiveKit Agent Server that handles job dispatch and agent sessions.

## Architecture

The system has two main components:

1. **FastAPI HTTP Server** (`src/main.py`):
   - Handles HTTP API requests from Agent-Builder and Agent-Dashboard
   - Manages agent registration, session creation, metrics
   - Runs on port 8080 (configurable)

2. **LiveKit Agent Server** (`src/livekit/agent_server.py`):
   - Registers with LiveKit server/cloud
   - Handles job dispatch automatically
   - Creates agent sessions when jobs are dispatched
   - Runs separately using LiveKit CLI

## Running the Agent Server

The agent server can be run in different modes:

### Development Mode

```bash
cd Agent-Runtime-Python
python -m src.livekit.agent_server dev
```

Or using the LiveKit CLI directly:

```bash
lk agent dev src/livekit/agent_server.py
```

### Production Mode

```bash
python -m src.livekit.agent_server start
```

Or:

```bash
lk agent start src/livekit/agent_server.py
```

## How It Works

1. **Agent Registration** (via HTTP API):
   - Agent-Builder calls `POST /api/agents/register`
   - Agent config is stored in `AgentManager`
   - Agent is ready for dispatch

2. **Job Dispatch** (automatic or explicit):
   - **Automatic**: When a user joins a room, LiveKit automatically dispatches agents
   - **Explicit**: Via `AgentDispatchService` API when creating sessions programmatically

3. **Agent Entrypoint** (`@server.rtc_session()`):
   - Called by LiveKit when a job is dispatched
   - Extracts agent ID from room name or job metadata
   - Looks up agent config from `AgentManager`
   - Creates `AgentSession` with appropriate providers
   - Starts the agent session

4. **AgentSession** (LiveKit framework):
   - Handles STT-LLM-TTS pipeline automatically
   - Manages turn detection, interruptions
   - Handles audio streaming
   - Supports BitHuman avatars
   - Supports vision, transcription, translation

## Room Name Pattern

The agent server expects room names in the format: `agent-{id}-room`

For example:
- `agent-1-room` → dispatches agent with ID 1
- `agent-123-room` → dispatches agent with ID 123

Alternatively, agent ID can be passed in job metadata during explicit dispatch.

## BitHuman Avatar Support

When `avatarModel` is configured in agent config, the agent session automatically uses BitHuman:

```python
# In agent_config_mapper.py
if avatar_model and BITHUMAN_AVAILABLE:
    avatar_session = BitHuman(avatar_id=avatar_model)
```

The BitHuman plugin handles video output automatically when publishing tracks.

## Environment Variables

Required for agent server:

```bash
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey-livekit-api-key-2024
LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars
```

## Integration with FastAPI Server

The FastAPI server and agent server run as separate processes:

1. **FastAPI Server**: Handles HTTP API, agent registration
2. **Agent Server**: Handles LiveKit job dispatch, agent sessions

They share:
- `AgentManager` (in-memory, could be shared via Redis in production)
- Database (for session tracking)

## Deployment

For production, deploy both:

1. FastAPI server (HTTP API)
2. Agent server (LiveKit jobs)

Both can run in the same container or separately for better scaling.

