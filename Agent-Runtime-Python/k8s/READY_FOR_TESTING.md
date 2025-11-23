# ✅ Agent-Runtime Python - Ready for Testing

## Deployment Status

**✅ Successfully Deployed to Kubernetes**

### Current Status

- **API Server**: ✅ Running and healthy
- **Service**: ✅ Exposed on port 8080
- **Port Forward**: ✅ Active at `localhost:8080`
- **Agent Server**: ⚠️ Starting (may need dependency fix)

## Quick Access

### Health Check

```bash
curl http://localhost:8080/health
```

### Test Agent Registration

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

## Service Information

- **Service Name**: `agent-runtime-python`
- **Namespace**: `default`
- **Port**: 8080
- **Local Access**: `http://localhost:8080` (port-forwarded)
- **Cluster Access**: `http://agent-runtime-python:8080`

## Integration Points

### Agent-Builder

Update `.env`:
```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

### Agent-Dashboard

Update `.env`:
```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

## Monitoring Commands

```bash
# View API logs
kubectl logs -f deployment/agent-runtime-python -c agent-runtime-api

# View agent server logs
kubectl logs -f deployment/agent-runtime-python -c agent-server

# Check pod status
kubectl get pods -l app=agent-runtime-python

# Check service
kubectl get svc agent-runtime-python
```

## Ready to Test!

The API server is running and ready for testing. You can now:

1. Test agent registration
2. Test session creation
3. Verify integration with Agent-Builder
4. Verify integration with Agent-Dashboard


