# Local LiveKit Server Deployment

This directory contains Kubernetes manifests to deploy a LiveKit server in your local Kubernetes cluster (Docker Desktop).

## What's Deployed

- **Namespace**: `livekit`
- **Deployment**: `livekit-server` (1 replica)
- **Service**: `livekit-service` (ClusterIP)
- **ConfigMap**: `livekit-config` (server configuration)
- **Secret**: `livekit-secrets` (API credentials)

## Configuration

- **URL**: `ws://localhost:7880` (via port-forward)
- **API Key**: `devkey-livekit-api-key-2024`
- **API Secret**: `devkey-livekit-api-secret-2024-min-32-chars`

## Port Forwarding

A port-forward is running in the background to expose the LiveKit server on `localhost:7880`.

To restart port-forwarding if needed:
```bash
kubectl port-forward -n livekit svc/livekit-service 7880:7880
```

## Access

- **WebSocket**: `ws://localhost:7880`
- **HTTP**: `http://localhost:7880`

## Cleanup

To remove the LiveKit server:
```bash
kubectl delete namespace livekit
```

## Notes

- This is a development setup without Redis (single-node mode)
- For production, you would need Redis for multi-node deployments
- The RTC port range is 50000-60000


