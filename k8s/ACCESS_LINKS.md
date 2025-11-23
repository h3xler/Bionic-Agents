# Access Links

## Port Forwarding Setup

To access services locally, set up port forwards:

```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Set up port forwards
kubectl port-forward -n livekit svc/agent-runtime-python 8080:8080 &
kubectl port-forward -n livekit svc/agent-builder 3000:3000 &
kubectl port-forward -n livekit svc/livekit-dashboard 3001:3000 &
kubectl port-forward -n livekit svc/livekit-service 7880:7880 &
```

## Access URLs

Once port forwards are active:

1. **Agent-Builder**: http://localhost:3000
   - Create and configure agents
   - Agent management UI

2. **Agent-Runtime**: http://localhost:8080
   - Agent execution API
   - API Docs: http://localhost:8080/docs
   - Health: http://localhost:8080/health

3. **Agent-Dashboard**: http://localhost:3001
   - Monitoring and analytics
   - Agent metrics and session tracking

4. **LiveKit Server**: ws://localhost:7880
   - WebSocket endpoint for real-time communication
   - HTTP: http://localhost:7880

## Cluster Internal URLs

From within Kubernetes cluster:

- Agent-Builder: `http://agent-builder.livekit:3000`
- Agent-Runtime: `http://agent-runtime-python.livekit:8080`
- Agent-Dashboard: `http://livekit-dashboard.livekit:3000`
- LiveKit: `ws://livekit-service.livekit:7880`

## Testing

```bash
# Test Agent-Builder
curl http://localhost:3000/health

# Test Agent-Runtime
curl http://localhost:8080/health
curl http://localhost:8080/ready

# Test Agent-Dashboard
curl http://localhost:3001/health
```

See [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) for current service status.

