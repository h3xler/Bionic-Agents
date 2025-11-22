# LiveKit Dashboard - v1.0.0

A comprehensive real-time monitoring dashboard for LiveKit infrastructure, featuring session tracking, AI agent monitoring, and cost analysis.

## Features

### 📊 Dashboard Views
- **Overview**: Real-time statistics showing active sessions, total agents, cumulative costs, and key metrics
- **Sessions**: Detailed session tracking with participant counts, duration, and status
- **Agents**: AI agent monitoring with type distribution, session history, and performance metrics
- **Costs**: Cost analysis with trend charts, daily breakdowns, and per-session cost tracking
- **Settings**: Cost configuration panel to customize pricing rates

### 🔄 Real-Time Monitoring
- Auto-refresh every 30 seconds for live data
- Webhook integration for LiveKit events
- Real-time webhook processing with signature verification

### 💾 Data Persistence
- Complete database schema for sessions, participants, tracks, agents, and costs
- Automatic cost calculation based on configurable rates
- Historical data retention for trend analysis

## Architecture

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **shadcn/ui** components
- **Recharts** for data visualization
- **tRPC** for type-safe API calls

### Backend
- **Express** server with tRPC
- **PostgreSQL** database with Drizzle ORM
- **LiveKit Server SDK** for API integration
- **Webhook handlers** for real-time events

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Docker Build

```bash
# Build Docker image
sudo docker build -t registry.bionicaisolutions.com/admin/livekit-dashboard:latest .

# Push to registry
sudo docker push registry.bionicaisolutions.com/admin/livekit-dashboard:latest
```

### Kubernetes Deployment

See [k8s/README.md](k8s/README.md) for detailed deployment instructions.

```bash
cd k8s
./deploy.sh
```

## Configuration

### Environment Variables

```bash
# LiveKit Server
LIVEKIT_URL=https://livekit.bionicaisolutions.com
LIVEKIT_API_KEY=devkey-livekit-api-key-2024
LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application
NODE_ENV=production
PORT=3000
STATIC_DIR=/app/dist/public
```

### LiveKit Webhook Configuration

Configure your LiveKit server to send webhooks to:
```
http://livekit-dashboard.livekit.svc.cluster.local:3000/api/webhooks/livekit
```

The webhook endpoint handles the following events:
- `room_started` - New room created
- `room_finished` - Room ended
- `participant_joined` - Participant joined room
- `participant_left` - Participant left room
- `track_published` - Media track published
- `track_unpublished` - Media track unpublished

See [LIVEKIT_WEBHOOK_SETUP.md](LIVEKIT_WEBHOOK_SETUP.md) for detailed webhook setup instructions.

## Database Schema

The database includes the following tables:
- `users` - User authentication
- `rooms` - LiveKit room sessions
- `participants` - Session participants
- `tracks` - Published media tracks
- `agents` - AI agent registry
- `agent_sessions` - Agent session history
- `costs` - Cost tracking per session
- `cost_config` - Cost configuration
- `egress_records` - Egress/recording data

## API Endpoints

### tRPC Procedures

**Session Statistics:**
```typescript
trpc.livekit.getSessionStats.useQuery()
// Returns: active_sessions, total_sessions, avg_duration_seconds, total_participants_all_time
```

**Agent Statistics:**
```typescript
trpc.livekit.getAgentStats.useQuery()
// Returns: total_agents, active_agents, agents_by_type[]
```

**Cost Statistics:**
```typescript
trpc.livekit.getCostStats.useQuery()
// Returns: total_cost, avg_cost_per_session, cost_by_day[]
```

**List Sessions:**
```typescript
trpc.livekit.getSessions.useQuery({ limit: 50, offset: 0 })
// Returns: sessions[], total
```

**Cost Configuration:**
```typescript
trpc.livekit.updateCostConfig.mutate({
  cost_per_participant_minute: 0.005,
  cost_per_egress_gb: 0.10,
  cost_per_ingress_gb: 0.05,
  cost_per_recording_minute: 0.01
})
```

### Webhook Endpoint

```
POST /api/webhooks/livekit
Authorization: <livekit-webhook-signature>
Content-Type: application/json
```

## Cost Configuration

Default cost rates (can be modified in Settings):
- **Participant Minutes**: $0.005 per minute
- **Egress**: $0.10 per GB
- **Ingress**: $0.05 per GB
- **Recording**: $0.01 per minute

Costs are stored as integers (micro-cents/cents) in the database and converted to decimals (dollars) for the frontend.

## Testing

### Verify Dashboard Functionality

```bash
# Run verification script
./scripts/test-dashboard-data.sh
```

See [VERIFY_DASHBOARD.md](VERIFY_DASHBOARD.md) for detailed verification steps.

## Troubleshooting

### No Data Showing
- Verify LiveKit credentials are correct
- Check that webhooks are configured in LiveKit server
- Ensure database connection is working
- Check browser console for API errors

### Webhook Errors
- Verify the webhook URL is accessible from LiveKit server
- Check that LiveKit API key/secret match
- Review server logs for webhook processing errors
- Ensure raw body parsing is working (see webhook setup docs)

### Database Issues
- Run database migrations: `kubectl apply -f k8s/database-migration-job.yaml`
- Check DATABASE_URL environment variable
- Verify database connection in server logs

## Project Structure

```
livekit-dashboard-frontend/
├── client/              # React frontend
├── server/              # Express backend with tRPC
├── shared/              # Shared types and utilities
├── drizzle/             # Database schema and migrations
├── k8s/                 # Kubernetes manifests
├── scripts/             # Utility scripts
└── docs/                # Additional documentation
```

## Version History

### v1.0.0 (2025-11-18)
- Initial release
- Full webhook integration with signature verification
- Session, agent, and cost tracking
- Cost configuration management
- Kubernetes deployment ready
- Comprehensive testing and verification

## License

MIT

## Support

For issues or questions:
- Check the [k8s/README.md](k8s/README.md) for deployment issues
- Review [VERIFY_DASHBOARD.md](VERIFY_DASHBOARD.md) for verification steps
- See [LIVEKIT_WEBHOOK_SETUP.md](LIVEKIT_WEBHOOK_SETUP.md) for webhook configuration
