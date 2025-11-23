# Agent-Runtime Python Kubernetes Deployment

## Overview

This directory contains Kubernetes manifests for deploying the Agent-Runtime Python service to a local Kubernetes cluster.

## Components

1. **deployment.yaml**: Main deployment with two containers:
   - `agent-runtime-api`: FastAPI HTTP server
   - `agent-server`: LiveKit agent server

2. **service.yaml**: ClusterIP service exposing the API on port 8080

3. **configmap.yaml**: Configuration for LiveKit URL

4. **secret.yaml**: Secrets for database, LiveKit, and API keys

5. **ingress.yaml**: Optional ingress for external access

## Prerequisites

- Local Kubernetes cluster (Docker Desktop, minikube, or kind)
- Docker image built: `agent-runtime-python:latest`
- PostgreSQL database accessible (from docker-compose or Kubernetes)
- LiveKit server running in Kubernetes

## Deployment Steps

### 1. Build Docker Image

```bash
cd Agent-Runtime-Python
docker build -t agent-runtime-python:latest .
```

### 2. Load Image to Kubernetes (if using kind/minikube)

For **kind**:
```bash
kind load docker-image agent-runtime-python:latest
```

For **minikube**:
```bash
minikube image load agent-runtime-python:latest
```

For **Docker Desktop**: Image is already available.

### 3. Update Secrets

Edit `secret.yaml` with your actual values:
- Database URL
- LiveKit API key and secret
- Agent Runtime API key

### 4. Deploy

```bash
# Apply secrets and config
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml

# Deploy service
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Optional: Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -l app=agent-runtime-python

# Check logs
kubectl logs -l app=agent-runtime-python -c agent-runtime-api
kubectl logs -l app=agent-runtime-python -c agent-server

# Check service
kubectl get svc agent-runtime-python

# Test health endpoint
kubectl port-forward svc/agent-runtime-python 8080:8080
curl http://localhost:8080/health
```

## Accessing the Service

### Port Forward (Development)

```bash
kubectl port-forward svc/agent-runtime-python 8080:8080
```

Then access at: `http://localhost:8080`

### Ingress (Production)

If ingress is configured:
- Add to `/etc/hosts`: `127.0.0.1 agent-runtime.local`
- Access at: `http://agent-runtime.local`

### Cluster Internal

From other pods in the cluster:
- Service name: `agent-runtime-python`
- Port: `8080`
- URL: `http://agent-runtime-python:8080`

## API Endpoints

Once deployed, the service exposes:

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

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod -l app=agent-runtime-python

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Verify database is accessible
kubectl run -it --rm debug --image=postgres:16-alpine --restart=Never -- psql -h bionic-agents-postgres-dev -U postgres -d liveagents
```

### LiveKit Connection Issues

```bash
# Check LiveKit service
kubectl get svc -n livekit livekit-service

# Test from pod
kubectl exec -it deployment/agent-runtime-python -c agent-runtime-api -- curl http://livekit-service:7880
```

### View Logs

```bash
# API logs
kubectl logs -f -l app=agent-runtime-python -c agent-runtime-api

# Agent server logs
kubectl logs -f -l app=agent-runtime-python -c agent-server

# All logs
kubectl logs -f -l app=agent-runtime-python --all-containers=true
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment agent-runtime-python --replicas=3
```

### Horizontal Pod Autoscaler

Create HPA (see `hpa.yaml` if available):

```bash
kubectl apply -f k8s/hpa.yaml
```

## Cleanup

```bash
# Delete all resources
kubectl delete -f k8s/

# Or delete individually
kubectl delete deployment agent-runtime-python
kubectl delete service agent-runtime-python
kubectl delete configmap agent-runtime-config
kubectl delete secret agent-runtime-secrets
```

## Environment Variables

The deployment uses these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `LIVEKIT_URL`: LiveKit WebSocket URL
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `RUNTIME_API_PORT`: API server port (default: 8080)
- `RUNTIME_HOST`: API server host (default: 0.0.0.0)
- `RUNTIME_API_KEY`: API authentication key
- `NODE_ENV`: Environment (production/development)

## Notes

- Both containers share the same image but run different commands
- The agent-server container runs the LiveKit agent server
- The agent-runtime-api container runs the FastAPI HTTP server
- Both containers need access to the same AgentManager (currently in-memory, consider Redis for production)


