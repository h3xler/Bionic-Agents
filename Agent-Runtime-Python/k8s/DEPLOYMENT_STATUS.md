# Agent-Runtime Python Kubernetes Deployment Status

## Deployment Summary

✅ **Deployment Created**: All Kubernetes manifests applied successfully

### Components Deployed

1. ✅ **Secret**: `agent-runtime-secrets`
   - Database URL
   - LiveKit API credentials
   - Agent Runtime API key

2. ✅ **ConfigMap**: `agent-runtime-config`
   - LiveKit URL: `ws://livekit-service:7880`

3. ✅ **Deployment**: `agent-runtime-python`
   - Two containers:
     - `agent-runtime-api`: FastAPI HTTP server
     - `agent-server`: LiveKit agent server
   - Replicas: 1

4. ✅ **Service**: `agent-runtime-python`
   - Type: ClusterIP
   - Port: 8080

## Access Information

### Port Forward (Local Testing)

```bash
kubectl port-forward svc/agent-runtime-python 8080:8080
```

Then access at: `http://localhost:8080`

### Cluster Internal Access

From other pods in the cluster:
- Service: `agent-runtime-python`
- Port: `8080`
- URL: `http://agent-runtime-python:8080`

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

## Testing

### 1. Health Check

```bash
curl http://localhost:8080/health
```

### 2. Register Agent

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

### 3. Create Session

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

## Monitoring

### View Logs

```bash
# API logs
kubectl logs -f deployment/agent-runtime-python -c agent-runtime-api

# Agent server logs
kubectl logs -f deployment/agent-runtime-python -c agent-server
```

### Check Pod Status

```bash
kubectl get pods -l app=agent-runtime-python
kubectl describe pod -l app=agent-runtime-python
```

### Check Service

```bash
kubectl get svc agent-runtime-python
kubectl get endpoints agent-runtime-python
```

## Integration

### Update Agent-Builder

Set in Agent-Builder's environment:
```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

### Update Agent-Dashboard

Set in Agent-Dashboard's environment:
```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod -l app=agent-runtime-python

# Check logs
kubectl logs -l app=agent-runtime-python --all-containers=true
```

### Database Connection

Verify database is accessible:
```bash
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -- \
  psql postgresql://postgres:postgres@bionic-agents-postgres-dev:5432/liveagents
```

### LiveKit Connection

Check LiveKit service:
```bash
kubectl get svc -n livekit livekit-service
```

