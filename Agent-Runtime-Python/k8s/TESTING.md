# Testing Agent-Runtime Python in Kubernetes

## Quick Start

After deployment, test the service:

### 1. Port Forward

```bash
kubectl port-forward svc/agent-runtime-python 8080:8080
```

### 2. Test Health Endpoint

```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-22T..."
}
```

### 3. Test Readiness

```bash
curl http://localhost:8080/ready
```

### 4. Register an Agent

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

### 5. Get Agent Status

```bash
curl http://localhost:8080/api/agents/1
```

### 6. Create a Session

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

### 7. Get Session

```bash
# Use session_id from previous response
curl http://localhost:8080/api/sessions/{session_id}
```

### 8. End Session

```bash
curl -X POST http://localhost:8080/api/sessions/{session_id}/end
```

## Integration with Agent-Builder

Update Agent-Builder's `.env`:

```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
```

## Integration with Agent-Dashboard

Update Agent-Dashboard's `.env`:

```bash
AGENT_RUNTIME_API_URL=http://agent-runtime-python:8080
AGENT_RUNTIME_API_KEY=devkey-agent-runtime-api-key-2024
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
kubectl get pods -l app=agent-runtime-python -w
```

### Check Resource Usage

```bash
kubectl top pod -l app=agent-runtime-python
```

## Troubleshooting

### Service Not Responding

1. Check pods are running:
   ```bash
   kubectl get pods -l app=agent-runtime-python
   ```

2. Check logs for errors:
   ```bash
   kubectl logs -l app=agent-runtime-python --all-containers=true
   ```

3. Check service endpoints:
   ```bash
   kubectl get endpoints agent-runtime-python
   ```

### Database Connection Issues

1. Verify database is accessible:
   ```bash
   kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -- psql $DATABASE_URL
   ```

2. Check secret:
   ```bash
   kubectl get secret agent-runtime-secrets -o yaml
   ```

### LiveKit Connection Issues

1. Check LiveKit service:
   ```bash
   kubectl get svc -n livekit livekit-service
   ```

2. Test connectivity from pod:
   ```bash
   kubectl exec -it deployment/agent-runtime-python -c agent-runtime-api -- curl http://livekit-service:7880
   ```


