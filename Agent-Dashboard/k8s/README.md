# LiveKit Dashboard - Kubernetes Deployment

This directory contains Kubernetes manifests to deploy the LiveKit Dashboard application using the existing PostgreSQL cluster in the `pg` namespace.

## Overview

The deployment uses the existing PostgreSQL cluster (CloudNativePG) in the `pg` namespace. The manifests will:

1. Create the `livekit_dashboard` database in the existing cluster
2. Set up the database connection secret
3. Run database migrations to create all required tables
4. Deploy the dashboard application
5. Configure services for access

## Files

- **`database-secret.yaml`** - Secret containing the database connection string
- **`postgres-configmap.yaml`** - PostgreSQL configuration
- **`database-init-job.yaml`** - Job to create the `livekit_dashboard` database
- **`database-migration-sql-configmap.yaml`** - SQL migration script as ConfigMap
- **`database-migration-job.yaml`** - Job to run database migrations
- **`docker-registry-secret.yaml`** - Docker registry credentials for pulling images
- **`app-deployment.yaml`** - Deployment for the dashboard application
- **`app-service.yaml`** - Services (ClusterIP and LoadBalancer) for the dashboard
- **`deploy.sh`** - Automated deployment script

## Prerequisites

- Existing PostgreSQL cluster in `pg` namespace
- Access to the `livekit` namespace
- Docker image pushed to `registry.bionicaisolutions.com/admin/livekit-dashboard:latest`
- Docker registry credentials configured

## Quick Deployment

### Automated Deployment (Recommended)

```bash
cd k8s
./deploy.sh
```

This script will:
1. Create/verify namespace
2. Create all secrets and configmaps
3. Initialize database
4. Run migrations
5. Deploy application
6. Create services
7. Show deployment status

### Manual Deployment

#### 1. Create Database Secret

```bash
kubectl apply -f database-secret.yaml
```

#### 2. Create PostgreSQL ConfigMap

```bash
kubectl apply -f postgres-configmap.yaml
```

#### 3. Initialize Database

```bash
kubectl apply -f database-init-job.yaml
kubectl wait --for=condition=complete job/livekit-dashboard-db-init -n livekit --timeout=120s
```

#### 4. Create Migration SQL ConfigMap

```bash
kubectl apply -f database-migration-sql-configmap.yaml
```

#### 5. Run Database Migrations

```bash
kubectl apply -f database-migration-job.yaml
kubectl wait --for=condition=complete job/livekit-dashboard-db-migrate -n livekit --timeout=180s
kubectl logs -n livekit job/livekit-dashboard-db-migrate
```

#### 6. Create Docker Registry Secret

```bash
kubectl apply -f docker-registry-secret.yaml
```

#### 7. Deploy Application

```bash
kubectl apply -f app-deployment.yaml
kubectl wait --for=condition=available deployment/livekit-dashboard -n livekit --timeout=300s
```

#### 8. Create Services

```bash
kubectl apply -f app-service.yaml
```

## Verification

### Check Pod Status

```bash
kubectl get pods -n livekit -l app=livekit-dashboard
```

### Check Services

```bash
kubectl get svc -n livekit -l app=livekit-dashboard
```

### Check Logs

```bash
kubectl logs -n livekit -l app=livekit-dashboard -f
```

### Test API

```bash
kubectl port-forward -n livekit svc/livekit-dashboard 3000:3000
curl http://localhost:3000/api/trpc/livekit.getSessionStats
```

## Database Connection

**Connection String:**
```
postgresql://livekit:L1v3K1tTh1515T0p53cr3t@pg-haproxy-primary.pg.svc.cluster.local:5432/livekit_dashboard
```

**Database Tables:**
- `users` - User accounts
- `agents` - AI agent information
- `rooms` - LiveKit rooms
- `participants` - Room participants
- `tracks` - Media tracks
- `agent_sessions` - Agent session tracking
- `cost_config` - Cost configuration
- `costs` - Calculated costs per room
- `egress_records` - Egress recording information

## Troubleshooting

### Pod Not Starting

1. Check pod status:
   ```bash
   kubectl describe pod -n livekit -l app=livekit-dashboard
   ```

2. Check image pull errors:
   ```bash
   kubectl get events -n livekit --sort-by='.lastTimestamp' | grep livekit-dashboard
   ```

3. Verify registry secret:
   ```bash
   kubectl get secret registry-bionicaisolutions-com -n livekit
   ```

### Database Connection Issues

1. Verify database exists:
   ```bash
   kubectl exec -n pg $(kubectl get pods -n pg -l role=primary -o jsonpath='{.items[0].metadata.name}') -- psql -U postgres -c "\l" | grep livekit_dashboard
   ```

2. Check database secret:
   ```bash
   kubectl get secret livekit-dashboard-db -n livekit -o jsonpath='{.data.DATABASE_URL}' | base64 -d
   ```

### Migration Issues

1. Check migration job status:
   ```bash
   kubectl get job livekit-dashboard-db-migrate -n livekit
   kubectl logs -n livekit job/livekit-dashboard-db-migrate
   ```

2. Re-run migrations:
   ```bash
   kubectl delete job livekit-dashboard-db-migrate -n livekit
   kubectl apply -f database-migration-job.yaml
   ```

## Cleanup

To remove all resources:

```bash
kubectl delete -f app-service.yaml
kubectl delete -f app-deployment.yaml
kubectl delete -f database-migration-job.yaml
kubectl delete -f database-migration-sql-configmap.yaml
kubectl delete -f database-init-job.yaml
kubectl delete -f postgres-configmap.yaml
kubectl delete -f database-secret.yaml
kubectl delete -f docker-registry-secret.yaml
```

## Notes

- The migration job uses a ConfigMap to store the SQL migration script
- Database permissions are automatically granted to the `livekit` user during migration
- The application requires the Docker image to be available in the private registry
- All database operations use the existing PostgreSQL cluster in the `pg` namespace
