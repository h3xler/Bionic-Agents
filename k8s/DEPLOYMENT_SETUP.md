# Deployment Setup Guide

## Prerequisites

- Docker Desktop with Kubernetes enabled
- kubectl configured for local cluster
- All Docker images built locally

## Build Docker Images

### Agent-Runtime-Python
```bash
cd Agent-Runtime-Python
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker build --no-cache -t agent-runtime-python:latest .
```

### Agent-Builder
```bash
cd Agent-Builder
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker build -t agent-builder:latest .
```

### Agent-Dashboard
```bash
cd Agent-Dashboard
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker build -t agent-dashboard:latest .
```

## Deploy to Kubernetes

### 1. Create Namespace
```bash
kubectl create namespace livekit
```

### 2. Create Secrets and ConfigMaps

#### Shared Database Secret
```bash
kubectl apply -f k8s/shared-secrets.yaml
```

#### Agent-Runtime Secrets and Config
```bash
kubectl apply -f Agent-Runtime-Python/k8s/secret.yaml
kubectl apply -f Agent-Runtime-Python/k8s/configmap.yaml
```

### 3. Deploy Services

#### LiveKit Server
```bash
kubectl apply -f livekit-server-k8s/livekit-deployment.yaml
kubectl apply -f livekit-server-k8s/livekit-service.yaml
```

#### Agent-Runtime-Python
```bash
kubectl apply -f Agent-Runtime-Python/k8s/deployment.yaml
kubectl apply -f Agent-Runtime-Python/k8s/service.yaml
```

#### Agent-Builder
```bash
kubectl apply -f Agent-Builder/k8s/deployment.yaml
kubectl apply -f Agent-Builder/k8s/service.yaml
```

#### Agent-Dashboard
```bash
kubectl apply -f Agent-Dashboard/k8s/app-deployment.yaml
kubectl apply -f Agent-Dashboard/k8s/app-service.yaml
```

### 4. Verify Deployment

```bash
# Check all pods
kubectl get pods -n livekit -o wide

# Check services
kubectl get svc -n livekit

# Check logs
kubectl logs -n livekit -l app=agent-runtime-python -c agent-runtime-api
kubectl logs -n livekit -l app=agent-runtime-python -c agent-server
```

## Configuration

### Environment Variables

All services use ConfigMaps and Secrets for configuration:

- **Database**: `shared-db-secret` (DATABASE_URL)
- **LiveKit**: `livekit-secrets` (API_KEY, API_SECRET), `livekit-config` (URL)
- **Agent-Runtime**: `agent-runtime-secrets` (API_KEY, DATABASE_URL, etc.)

### Service URLs

- LiveKit: `ws://livekit-service.livekit:7880` (internal)
- Agent-Runtime: `http://agent-runtime-python.livekit:8080` (internal)
- Agent-Builder: `http://agent-builder.livekit:3000` (internal)

## Port Forwarding for Local Access

```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Set up new port forwards
kubectl port-forward -n livekit svc/agent-runtime-python 8080:8080 &
kubectl port-forward -n livekit svc/agent-builder 3000:3000 &
kubectl port-forward -n livekit svc/livekit-dashboard 3001:3000 &
kubectl port-forward -n livekit svc/livekit-service 7880:7880 &
```

## Troubleshooting

### ErrImageNeverPull
If pods show `ErrImageNeverPull`:
1. Restart Docker Desktop
2. Verify images exist: `docker images | grep agent`
3. Rebuild images if needed

### Import Errors
If agent-server crashes with import errors:
1. Verify code has all plugin imports wrapped in try/except
2. Rebuild image with `--no-cache`
3. Delete pods to force restart: `kubectl delete pod -n livekit -l app=agent-runtime-python`

### Readiness Probe Failures
If readiness probes fail:
1. Check logs: `kubectl logs -n livekit <pod-name> -c <container-name>`
2. Verify database connectivity
3. Check environment variables

## Cleanup

To remove all deployments:
```bash
kubectl delete namespace livekit
```

Or delete individual resources:
```bash
kubectl delete deployment -n livekit --all
kubectl delete service -n livekit --all
kubectl delete secret -n livekit --all
kubectl delete configmap -n livekit --all
```


