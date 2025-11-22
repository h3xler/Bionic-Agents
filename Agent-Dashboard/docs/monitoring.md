# Monitoring Setup for LiveKit Dashboard

## Overview

Your cluster already has Grafana and Prometheus running in the `pg` namespace. This setup can be extended to monitor the LiveKit Dashboard and other applications.

## Current Setup

### Grafana
- **Namespace**: `pg`
- **Service**: `grafana` (NodePort 30300)
- **Access**: `kubectl port-forward -n pg svc/grafana 3000:3000`

### Prometheus
- **Namespace**: `pg`
- **Service**: `prometheus` (NodePort 30090)
- **Currently Monitoring**: PostgreSQL cluster in `pg` namespace
- **Access**: `kubectl port-forward -n pg svc/prometheus 9090:9090`

## Adding LiveKit Dashboard to Monitoring

### Option 1: Add Metrics Endpoint to Dashboard

The LiveKit Dashboard can expose Prometheus metrics by adding a `/metrics` endpoint.

#### Install Prometheus Client

```bash
cd /workspace/livekit-dashboard-frontend
pnpm add prom-client
```

#### Add Metrics Endpoint

Create `server/metrics.ts`:

```typescript
import express from 'express';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Default metrics (CPU, memory, etc.)
register.setDefaultLabels({
  app: 'livekit-dashboard',
});

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeSessions = new Gauge({
  name: 'livekit_active_sessions',
  help: 'Number of active LiveKit sessions',
  registers: [register],
});

const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [register],
});

export function getMetricsRouter() {
  const router = express.Router();
  
  router.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      res.status(500).end(error);
    }
  });
  
  return router;
}

export { httpRequestDuration, httpRequestTotal, activeSessions, databaseConnections };
```

#### Integrate into Server

Update `server/_core/index.ts`:

```typescript
import { getMetricsRouter } from '../metrics';

// Add metrics middleware
app.use('/metrics', getMetricsRouter());
```

### Option 2: Configure Prometheus to Scrape Dashboard

#### Update Prometheus ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: pg
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "alert_rules.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager.pg.svc.cluster.local:9093
    
    scrape_configs:
      # Existing PostgreSQL scraping
      - job_name: 'postgresql'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - pg
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: pg-.*
          - source_labels: [__meta_kubernetes_endpoint_port_name]
            action: keep
            regex: metrics
      
      # Add LiveKit Dashboard scraping
      - job_name: 'livekit-dashboard'
        kubernetes_sd_configs:
          - role: endpoints
            namespaces:
              names:
                - livekit
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            action: keep
            regex: livekit-dashboard
          - source_labels: [__meta_kubernetes_endpoint_port_name]
            action: keep
            regex: http
        metrics_path: '/metrics'
```

#### Apply Updated Config

```bash
kubectl apply -f prometheus-config.yaml
kubectl rollout restart deployment/prometheus -n pg
```

### Option 3: Use ServiceMonitor (if Prometheus Operator)

If using Prometheus Operator, create a ServiceMonitor:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: livekit-dashboard
  namespace: livekit
  labels:
    app: livekit-dashboard
spec:
  selector:
    matchLabels:
      app: livekit-dashboard
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

## Creating Grafana Dashboards

### Access Grafana

```bash
kubectl port-forward -n pg svc/grafana 3000:3000
# Open http://localhost:3000
```

### Default Credentials

Check for Grafana admin credentials:

```bash
kubectl get secret -n pg | grep grafana
kubectl get secret grafana-admin -n pg -o jsonpath='{.data.admin-password}' | base64 -d
```

### Create Dashboard

1. Go to **Dashboards** → **New Dashboard**
2. Add panels for:
   - HTTP request rate
   - HTTP request duration
   - Active sessions
   - Database connections
   - Error rates
   - Response times

### Example Queries

```promql
# Request rate
rate(http_requests_total[5m])

# Request duration (p95)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Active sessions
livekit_active_sessions

# Database connections
database_connections_active
```

## Monitoring Other Apps

The same Prometheus instance can monitor multiple applications:

### 1. Add Metrics Endpoint to Your App

Each app needs to expose `/metrics` endpoint with Prometheus format.

### 2. Configure Service Discovery

Update Prometheus config to discover services in multiple namespaces:

```yaml
scrape_configs:
  - job_name: 'kubernetes-services'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - livekit
            - default
            - pg
    relabel_configs:
      - source_labels: [__meta_kubernetes_endpoint_port_name]
        action: keep
        regex: metrics
```

### 3. Or Use Static Config

For apps outside Kubernetes or with specific endpoints:

```yaml
scrape_configs:
  - job_name: 'livekit-server'
    static_configs:
      - targets:
        - livekit-server.livekit.svc.cluster.local:7880
    metrics_path: '/metrics'
```

## Best Practices

1. **Label Consistency**: Use consistent labels across all metrics
2. **Cardinality**: Avoid high-cardinality labels (like user IDs)
3. **Retention**: Configure appropriate retention policies
4. **Alerts**: Set up alerts for critical metrics
5. **Dashboards**: Create dashboards per service/team

## Example: Complete Monitoring Setup

### 1. Add Metrics to LiveKit Dashboard

```typescript
// server/metrics.ts
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

const register = new Registry();

export const metrics = {
  httpRequests: new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [register],
  }),
  
  httpDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route'],
    registers: [register],
  }),
  
  activeSessions: new Gauge({
    name: 'livekit_sessions_active',
    help: 'Active LiveKit sessions',
    registers: [register],
  }),
};

export function getMetrics() {
  return register.metrics();
}
```

### 2. Add Middleware

```typescript
// server/_core/index.ts
import express from 'express';
import { metrics } from '../metrics';

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end(await getMetrics());
});
```

### 3. Update Prometheus Config

Add scraping configuration for the dashboard.

### 4. Create Grafana Dashboard

Import or create dashboards for visualization.

## Troubleshooting

### Check if Metrics Endpoint Works

```bash
kubectl port-forward -n livekit svc/livekit-dashboard 3000:3000
curl http://localhost:3000/metrics
```

### Check Prometheus Targets

```bash
kubectl port-forward -n pg svc/prometheus 9090:9090
# Open http://localhost:9090/targets
```

### Check Service Discovery

```bash
kubectl get endpoints -n livekit livekit-dashboard
```

## Resources

- [Prometheus Client for Node.js](https://github.com/siimon/prom-client)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

---
**Last Updated**: 2024

