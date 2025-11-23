# Quick Start - Agent-Runtime Python in Kubernetes

## ✅ Deployment Status

**Service is deployed and running!**

- **Service**: `agent-runtime-python` (ClusterIP)
- **Port**: 8080
- **Health**: ✅ Healthy
- **Access**: Port-forwarded to `localhost:8080`

## Quick Test

### 1. Health Check

```bash
curl http://localhost:8080/health
```

Expected: `{"status":"healthy","timestamp":"..."}`

### 2. Register an Agent

```bash
curl -X POST http://localhost:8080/api/agents/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer devkey-agent-runtime-api-key-2024" \
  -d '{
    "agentId": 1,
    "tenantId": 1,
    "config": {
      "agentId": 1,
      "tenantId": 1,
      "name": "Test Agent",
      "sttProvider": "deepgram",
      "ttsProvider": "elevenlabs",
      "llmProvider": "openai",
      "llmModel": "gpt-4o-mini",
      "systemPrompt": "You are a helpful assistant.",
      "maxConcurrentSessions": 10,
      "livekitConfig": {
        "url": "ws://livekit-service:7880",
        "apiKey": "devkey-livekit-api-key-2024",
        "apiSecret": "devkey-livekit-api-secret-2024-min-32-chars"
      }
    }
  }'
```

### 3. Get Agent Status

```bash
curl http://localhost:8080/api/agents/1
```

### 4. Create a Session

```bash
curl -X POST http://localhost:8080/api/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": 1,
    "tenantId": 1,
    "roomName": "agent-1-room",
    "participantName": "Test User"
  }'
```

## View Logs

```bash
# API server logs
kubectl logs -f deployment/agent-runtime-python -c agent-runtime-api

# Agent server logs
kubectl logs -f deployment/agent-runtime-python -c agent-server
```

## Service Information

- **Service Name**: `agent-runtime-python`
- **Namespace**: `default`
- **Type**: ClusterIP
- **Port**: 8080
- **Access**: Port-forwarded to `localhost:8080`

## Integration

Update your Agent-Builder and Agent-Dashboard to use:
- **URL**: `http://agent-runtime-python:8080` (from within cluster)
- **API Key**: `devkey-agent-runtime-api-key-2024`

## Next Steps

1. Test agent registration
2. Test session creation
3. Verify agent server connects to LiveKit
4. Test full conversation flow


