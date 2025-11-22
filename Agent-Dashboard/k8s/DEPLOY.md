# Deployment Instructions

## Connection Verified ✅

The database connection has been tested and verified:
- **Database**: `livekit_dashboard` exists
- **User**: `livekit` with proper permissions
- **Connection String**: `postgresql://livekit:L1v3K1tTh1515T0p53cr3t@pg-haproxy-primary.pg.svc.cluster.local:5432/livekit_dashboard`

## Deployment Steps

### 1. Create Database Secret

```bash
kubectl apply -f k8s/database-secret.yaml
```

This creates the secret with the connection string that the application will use.

### 2. Initialize Database (Optional - Already Exists)

The database already exists, but you can run the init job to verify:

```bash
kubectl apply -f k8s/database-init-job.yaml
kubectl wait --for=condition=complete job/livekit-dashboard-db-init -n livekit --timeout=60s
kubectl logs -n livekit job/livekit-dashboard-db-init
```

### 3. Run Database Migrations

Before deploying the app, run the schema migrations:

**Option A: From local machine (recommended)**

```bash
# Port forward to database
kubectl port-forward -n pg svc/pg-haproxy-primary 5432:5432

# In another terminal
cd /workspace/livekit-dashboard-frontend
export DATABASE_URL="postgresql://livekit:L1v3K1tTh1515T0p53cr3t@localhost:5432/livekit_dashboard"
pnpm db:push
```

**Option B: From within cluster (after app deployment)**

```bash
kubectl exec -n livekit -it deployment/livekit-dashboard -- pnpm db:push
```

### 4. Deploy Application

Update `app-deployment.yaml` with your container image, then:

```bash
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/app-service.yaml
```

### 5. Verify Deployment

```bash
# Check pods
kubectl get pods -n livekit -l app=livekit-dashboard

# Check services
kubectl get svc -n livekit -l app=livekit-dashboard

# Check logs
kubectl logs -n livekit -l app=livekit-dashboard -f

# Test API
kubectl port-forward -n livekit svc/livekit-dashboard 3000:3000
curl http://localhost:3000/api/trpc/livekit.getSessionStats
```

## Connection Details

**Within Cluster:**
```
postgresql://livekit:L1v3K1tTh1515T0p53cr3t@pg-haproxy-primary.pg.svc.cluster.local:5432/livekit_dashboard
```

**External (via LoadBalancer):**
```
postgresql://livekit:L1v3K1tTh1515T0p53cr3t@192.168.0.212:5432/livekit_dashboard
```

## Troubleshooting

### Connection Issues

Test connection from within cluster:
```bash
kubectl run -n livekit -it --rm db-test --image=postgres:17-alpine --restart=Never -- \
  psql "postgresql://livekit:L1v3K1tTh1515T0p53cr3t@pg-haproxy-primary.pg.svc.cluster.local:5432/livekit_dashboard" \
  -c "SELECT version();"
```

### Check Database Schema

```bash
kubectl exec -n pg pg-1 -- psql -U livekit -d livekit_dashboard -c "\dt"
```

---
**Status**: ✅ Ready to Deploy  
**Last Updated**: 2024

