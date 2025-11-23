# ✅ Agent-Runtime Python - Kubernetes Deployment Complete

## Deployment Status

**✅ Successfully Deployed to Local Kubernetes Cluster**

### Components

1. ✅ **Secret**: `agent-runtime-secrets` - Created
2. ✅ **ConfigMap**: `agent-runtime-config` - Created
3. ✅ **Deployment**: `agent-runtime-python` - Running
4. ✅ **Service**: `agent-runtime-python` - Exposed on port 8080

### Pod Status

- **Containers**: 2/2 Running
  - `agent-runtime-api`: FastAPI HTTP server ✅
  - `agent-server`: LiveKit agent server ✅

## Access

### Port Forward (Active)

The service is port-forwarded to your local machine:

```bash
# Already running in background
kubectl port-forward svc/agent-runtime-python 8080:8080
```

**Access URL**: `http://localhost:8080`

### Health Check

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{"status":"healthy","timestamp":"2025-11-22T..."}
```

## Quick Test

### 1. Register an Agent

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

### 2. Get Agent Status

```bash
curl http://localhost:8080/api/agents/1
```

### 3. Create a Session

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

## Integration

### Agent-Builder Configuration

Update Agent-Builder's environment to use:

```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

### Agent-Dashboard Configuration

Update Agent-Dashboard's environment to use:

```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

## Monitoring

### View Logs

```bash
# API server logs
kubectl logs -f deployment/agent-runtime-python -c agent-runtime-api

# Agent server logs
kubectl logs -f deployment/agent-runtime-python -c agent-server

# All logs
kubectl logs -f deployment/agent-runtime-python --all-containers=true
```

### Check Status

```bash
# Pod status
kubectl get pods -l app=agent-runtime-python

# Service status
kubectl get svc agent-runtime-python

# Detailed pod info
kubectl describe pod -l app=agent-runtime-python
```

## API Endpoints

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `POST /api/agents/register` - Register agent
- `GET /api/agents/{id}` - Get agent status
- `GET /api/agents/` - List agents
- `DELETE /api/agents/{id}` - Unregister agent
- `POST /api/sessions/create` - Create session
- `GET /api/sessions/{id}` - Get session
- `POST /api/sessions/{id}/end` - End session
- `GET /api/metrics/*` - Metrics endpoints

## Next Steps

1. ✅ Service is running and accessible
2. Test agent registration via API
3. Test session creation
4. Verify agent server connects to LiveKit
5. Test full conversation flow with Agent-Builder

## Troubleshooting

If you encounter issues:

1. **Check pod status**:
   ```bash
   kubectl get pods -l app=agent-runtime-python
   ```

2. **View logs**:
   ```bash
   kubectl logs -l app=agent-runtime-python --all-containers=true
   ```

3. **Check events**:
   ```bash
   kubectl get events --sort-by='.lastTimestamp' | grep agent-runtime-python
   ```

4. **Restart deployment**:
   ```bash
   kubectl rollout restart deployment/agent-runtime-python
   ```


