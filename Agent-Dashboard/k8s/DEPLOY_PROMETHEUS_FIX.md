# Deploy Prometheus Configuration Fix

## Issues Found

1. **Prometheus Config**: Looking for `pg-.*` but service is `postgresql-metrics`
2. **RBAC Permissions**: Prometheus can't do service discovery (no permissions to list endpoints/services)

## Files Created

1. `prometheus-config-fix.yaml` - Updated Prometheus config to match correct service name
2. `prometheus-rbac-fix.yaml` - RBAC permissions for Prometheus service discovery

## Deployment Steps

### 1. Fix Prometheus Configuration

```bash
kubectl apply -f k8s/prometheus-config-fix.yaml
```

This updates the config to:
- Match service name: `postgresql-metrics` (instead of `pg-.*`)
- Scrape the `metrics` port (9187)

### 2. Fix RBAC Permissions

```bash
kubectl apply -f k8s/prometheus-rbac-fix.yaml
```

This creates:
- ServiceAccount: `prometheus`
- Role: Permissions to list/watch pods, services, endpoints
- RoleBinding: Binds role to service account

### 3. Update Prometheus Deployment

Update the Prometheus deployment to use the new service account:

```bash
kubectl patch deployment prometheus -n pg --type='json' -p='[{"op": "add", "path": "/spec/template/spec/serviceAccountName", "value": "prometheus"}]'
```

Or manually edit:
```bash
kubectl edit deployment prometheus -n pg
# Add under spec.template.spec:
# serviceAccountName: prometheus
```

### 4. Restart Prometheus

```bash
kubectl rollout restart deployment/prometheus -n pg
kubectl rollout status deployment/prometheus -n pg
```

### 5. Verify

```bash
# Check targets
kubectl port-forward -n pg svc/prometheus 9090:9090
# Visit: http://localhost:9090/targets
# Should see postgresql job with targets in "up" state
```

## Current Status

- ❌ ConfigMap update: **Blocked** (needs cluster admin)
- ❌ RBAC fix: **Ready to apply** (needs cluster admin)
- ❌ Deployment update: **Ready** (needs cluster admin)

## Alternative: Manual Fix in Grafana

Since Prometheus isn't scraping PostgreSQL, you can:

1. **Use Explore in Grafana** to query Prometheus directly
2. **Create custom dashboards** with available metrics
3. **Manually add PostgreSQL queries** if you know the metric names

## What's Working

- ✅ Grafana is running
- ✅ Prometheus datasource is configured
- ✅ Prometheus is running (but can't discover targets)

## What's Not Working

- ❌ Prometheus service discovery (RBAC issue)
- ❌ PostgreSQL metrics collection (config + RBAC issue)
- ❌ Auto-provisioned dashboards (missing provisioning config)

---
**Status**: Ready to deploy (requires cluster admin permissions)  
**Last Updated**: 2024

