# LiveKit Dashboard - Setup Guide

## Overview

This guide covers the complete setup of the LiveKit Dashboard, including database configuration, k3s PostgreSQL cluster connection, and application deployment.

## Database Setup

### K3s PostgreSQL Cluster

The dashboard is configured to use a PostgreSQL cluster running on k3s.

#### Service Endpoints

- **Primary (Read-Write)**: `pg-haproxy-primary` LoadBalancer
  - External IP: `192.168.0.212`
  - Port: `5432`
  - Service: `pg-rw` (ClusterIP: `10.43.104.103`)

- **Replicas (Read-Only)**: `pg-haproxy-replicas` LoadBalancer
  - External IP: `192.168.0.214`
  - Port: `5433`

#### Database Credentials

- **Username**: `postgres`
- **Password**: `Th1515T0p53cr3t`
- **Database**: `livekit_dashboard`
- **Connection String**: 
  ```
  postgresql://postgres:Th1515T0p53cr3t@192.168.0.212:5432/livekit_dashboard
  ```

#### Environment Variable

The `.env` file should contain:
```bash
DATABASE_URL=postgresql://postgres:Th1515T0p53cr3t@192.168.0.212:5432/livekit_dashboard
```

### Database Schema

All tables have been successfully created:
- ✅ `users` - User authentication
- ✅ `rooms` - LiveKit room sessions
- ✅ `participants` - Session participants
- ✅ `tracks` - Published media tracks
- ✅ `agents` - AI agent registry
- ✅ `agent_sessions` - Agent session history
- ✅ `costs` - Cost tracking per session
- ✅ `cost_config` - Cost configuration
- ✅ `egress_records` - Egress recording data

## Application Setup

### Prerequisites

- Node.js 20+ (for development) or Node.js 18+ (for production)
- pnpm package manager
- Access to k3s PostgreSQL cluster

### Installation

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Set Environment Variables:**
   ```bash
   export DATABASE_URL="postgresql://postgres:Th1515T0p53cr3t@192.168.0.212:5432/livekit_dashboard"
   export LIVEKIT_URL="https://livekit.bionicaisolutions.com"
   export LIVEKIT_API_KEY="devkey-livekit-api-key-2024"
   export LIVEKIT_API_SECRET="devkey-livekit-api-secret-2024-min-32-chars"
   ```

3. **Run Database Migrations:**
   ```bash
   pnpm db:push
   ```

4. **Build the Application:**
   ```bash
   pnpm build
   ```

5. **Start the Server:**
   ```bash
   # Production mode
   NODE_ENV=production pnpm start
   
   # Development mode (requires Node.js 20+)
   pnpm dev
   ```

## Connection Testing

### Database Connection
```bash
kubectl exec -n pg pg-1 -- psql -U postgres -d livekit_dashboard -c "\dt"
```

### API Endpoints
```bash
# Session stats
curl http://localhost:3000/api/trpc/livekit.getSessionStats

# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/livekit
```

## Troubleshooting

### Connection Issues

If database connection fails:
1. Check if PostgreSQL pods are running: `kubectl get pods -n pg`
2. Verify service is accessible: `kubectl get svc -n pg pg-haproxy-primary`
3. Test connection from host: `psql -h 192.168.0.212 -p 5432 -U postgres -d livekit_dashboard`

### Application Issues

- **Node.js Version**: Vite 7 requires Node.js 20+ for development mode. Use production mode (`pnpm build && pnpm start`) with Node.js 18+
- **Static Files**: If static files aren't serving, check the path resolution in `server/_core/vite.ts`

## Notes

- The PostgreSQL cluster uses CloudNativePG (CNPG)
- HAProxy provides load balancing and high availability
- Primary endpoint (`pg-rw`) should be used for read-write operations
- Replica endpoint (`pg-ro`) can be used for read-only queries (future optimization)

---
**Last Updated**: 2024

