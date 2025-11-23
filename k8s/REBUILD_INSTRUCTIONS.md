# Docker Image Rebuild Instructions

## ⚠️ Docker Not Available in Shell

Docker commands are not available in the current shell environment. Please rebuild the images manually.

## Images to Rebuild

### 1. Agent-Runtime-Python

```bash
cd Agent-Runtime-Python
docker build -t agent-runtime-python:latest .
```

**Important**: This image contains the fixed code that:
- Removes module-level imports from `__init__.py`
- Makes `livekit.plugins` import optional
- Handles missing plugins gracefully

### 2. Agent-Builder

```bash
cd Agent-Builder
docker build -t agent-builder:latest .
```

### 3. Agent-Dashboard

```bash
cd Agent-Dashboard
docker build -t agent-dashboard:latest .
```

## After Rebuilding

Once images are rebuilt, restart the pods:

```bash
# Restart agent-runtime-python
kubectl delete pod -n livekit -l app=agent-runtime-python

# Restart livekit-dashboard
kubectl delete pod -n livekit -l app=livekit-dashboard

# Restart agent-builder
kubectl delete pod -n livekit -l app=agent-builder
```

## Verify Images

```bash
docker images | grep -E "(agent-runtime-python|agent-builder|agent-dashboard)"
```

## Current Status

- ✅ **agent-builder**: Moved to `livekit` namespace
- ✅ **Code fixes**: Applied to agent-runtime-python
- ⚠️ **Images**: Need to be rebuilt with fixed code
- ⚠️ **Pods**: Will restart automatically after image rebuild

## Namespace Status

All services are now in `livekit` namespace:
- ✅ agent-runtime-python
- ✅ livekit-dashboard
- ✅ agent-builder (just moved)
- ✅ livekit-server


