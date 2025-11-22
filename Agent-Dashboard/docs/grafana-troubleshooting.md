# Grafana Troubleshooting - No PostgreSQL Setup Visible

## Current Issue

You're logged into Grafana but don't see PostgreSQL dashboards. Here's what's happening:

## What You Should See

### 1. Data Sources (Should Work)

**Go to: Configuration → Data Sources**

You should see:
- **Prometheus** 
  - URL: `http://prometheus.pg.svc.cluster.local:9090`
  - Status: Should be green

**If you see this, the datasource is configured correctly.**

### 2. Dashboards (May Be Missing)

**Go to: Dashboards → Browse**

**Problem**: The dashboard JSON exists but Grafana isn't auto-loading it because:
- Missing provisioning configuration file (`default.yaml`)
- Grafana needs this file to know to load dashboards from the directory

**Solution**: You can manually import the dashboard or fix the provisioning config.

## Quick Fixes

### Option 1: Manually Import Dashboard

1. In Grafana, go to **Dashboards → Import**
2. Click **Upload JSON file** or paste JSON
3. Use this dashboard JSON:

```json
{
  "dashboard": {
    "uid": "postgresql-cluster",
    "title": "PostgreSQL Cluster Monitoring",
    "tags": ["postgresql"],
    "panels": [
      {
        "id": 1,
        "title": "PostgreSQL Up",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"postgresql\"}",
            "refId": "A"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
```

### Option 2: Create Simple Dashboard Manually

1. Go to **Dashboards → New Dashboard**
2. Click **Add visualization**
3. Select **Prometheus** as data source
4. Try these queries:
   - `up` - Shows all services (should show prometheus itself)
   - `up{job="postgresql"}` - PostgreSQL service status
   - `pg_stat_database_numbackends` - Active connections (if exporter is running)

### Option 3: Check What Metrics Are Available

1. Go to **Explore** (compass icon in left sidebar)
2. Select **Prometheus** datasource
3. Try these queries:
   ```
   up
   up{job="postgresql"}
   ```
4. If `up{job="postgresql"}` returns no results, Prometheus isn't scraping PostgreSQL

## Why Prometheus Isn't Scraping PostgreSQL

**Current Prometheus Config:**
- Looking for services with port name `metrics`
- Only finding itself (prometheus job)

**The Issue:**
PostgreSQL services may not have a port named `metrics`. They likely have:
- Port name: `postgres` or `5432`
- Not `metrics`

**To Fix:**
1. Check if PostgreSQL exporter is running
2. Update Prometheus config to scrape the correct port
3. Or add a `metrics` port to PostgreSQL services

## Verify Prometheus is Working

**Check Prometheus directly:**

```bash
kubectl port-forward -n pg svc/prometheus 9090:9090
# Then visit: http://localhost:9090
```

**Check targets:**
- Go to: http://localhost:9090/targets
- You should see what Prometheus is scraping

**Check available metrics:**
- Go to: http://localhost:9090/graph
- Try query: `up`
- This should show all scraped targets

## What Metrics Should Be Available

If PostgreSQL exporter is configured, you should see metrics like:
- `pg_up` - PostgreSQL availability
- `pg_stat_database_numbackends` - Active connections
- `pg_stat_database_xact_commit` - Committed transactions
- `pg_stat_database_blks_read` - Disk reads

## Quick Test Queries in Grafana Explore

Try these in **Explore** with Prometheus datasource:

1. **Service availability:**
   ```
   up
   ```

2. **PostgreSQL specific (if exporter running):**
   ```
   up{job="postgresql"}
   pg_up
   ```

3. **If no PostgreSQL metrics, check what IS available:**
   ```
   {__name__=~".+"}
   ```

## Next Steps

1. **Verify Prometheus datasource works** - Test it in Grafana
2. **Check what metrics exist** - Use Explore to query
3. **Create a simple dashboard** - Start with basic queries
4. **Fix Prometheus scraping** - If PostgreSQL metrics aren't being collected

---
**Last Updated**: 2024

