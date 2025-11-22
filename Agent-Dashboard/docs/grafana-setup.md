# Grafana Setup Guide

## Current Status

Grafana is running in the `pg` namespace with:
- **Datasource**: Prometheus (configured)
- **Dashboard**: PostgreSQL dashboard JSON exists but may need provisioning config

## Accessing Grafana

**Credentials:**
- Username: `admin`
- Password: `admin123`

**Access:**
```bash
kubectl port-forward -n pg svc/grafana 3000:3000
# Then open: http://localhost:3000
```

## What You Should See

### 1. Data Sources

Go to **Configuration → Data Sources**

You should see:
- **Prometheus** 
  - URL: `http://prometheus.pg.svc.cluster.local:9090`
  - Status: Should be green/working

### 2. Dashboards

Go to **Dashboards → Browse**

You should see:
- **PostgreSQL Cluster Monitoring** (if provisioning is working)

If you don't see dashboards, they may need to be imported manually.

## Troubleshooting

### No Data Sources Visible

1. Check if the datasource ConfigMap is mounted:
   ```bash
   kubectl exec -n pg $(kubectl get pod -n pg -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- \
     cat /etc/grafana/provisioning/datasources/prometheus.yaml
   ```

2. Restart Grafana to reload config:
   ```bash
   kubectl rollout restart deployment/grafana -n pg
   ```

### No Dashboards Visible

The dashboard JSON exists but may need a provisioning config file. Check:

```bash
kubectl exec -n pg $(kubectl get pod -n pg -l app=grafana -o jsonpath='{.items[0].metadata.name}') -- \
  ls -la /etc/grafana/provisioning/dashboards/
```

You should see:
- `default.yaml` (provisioning config)
- `postgresql-dashboard.json` (dashboard definition)

### Prometheus Not Scraping PostgreSQL

Check Prometheus targets:

```bash
kubectl port-forward -n pg svc/prometheus 9090:9090
# Then visit: http://localhost:9090/targets
```

You should see PostgreSQL targets in "up" state.

### Manual Dashboard Import

If automatic provisioning isn't working:

1. Go to **Dashboards → Import**
2. Copy the dashboard JSON from:
   ```bash
   kubectl get configmap grafana-dashboards -n pg -o jsonpath='{.data.postgresql-dashboard\.json}'
   ```
3. Paste and import

## Creating Custom Dashboards

### For PostgreSQL

1. Go to **Dashboards → New Dashboard**
2. Add panels with PromQL queries like:
   - `up{job="postgresql"}` - Service availability
   - `pg_stat_database_numbackends` - Active connections
   - `pg_stat_database_xact_commit` - Transactions
   - `pg_stat_database_blks_read` - Disk reads

### For LiveKit Dashboard App

Once metrics are added to the dashboard app:

1. Create a new dashboard
2. Add panels for:
   - HTTP request rate: `rate(http_requests_total[5m])`
   - Request duration: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Active sessions: `livekit_sessions_active`
   - Database connections: `database_connections_active`

## Fixing Dashboard Provisioning

If dashboards aren't auto-loading, update the ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: pg
data:
  default.yaml: |
    apiVersion: 1
    providers:
    - name: 'default'
      orgId: 1
      folder: ''
      type: file
      disableDeletion: false
      updateIntervalSeconds: 10
      allowUiUpdates: true
      options:
        path: /etc/grafana/provisioning/dashboards
        foldersFromFilesStructure: true
  postgresql-dashboard.json: |
    { ... dashboard JSON ... }
```

Then restart Grafana:
```bash
kubectl rollout restart deployment/grafana -n pg
```

---
**Last Updated**: 2024

