# Dashboard Verification Guide

This guide helps you verify that all dashboard features are working correctly.

## Quick Verification

Run the test script:
```bash
./test-dashboard-data.sh
```

## Manual Verification Steps

### 1. Sessions Verification

**API Test:**
```bash
curl "http://localhost:3000/api/trpc/livekit.getSessions?input=%7B%22json%22%3A%7B%22limit%22%3A10%7D%7D"
```

**Expected:**
- Returns list of rooms/sessions
- Each session has: `room_sid`, `room_name`, `status`, `started_at`, `participant_count`

**UI Test:**
1. Open http://localhost:3000/sessions
2. Should see list of sessions
3. Each session shows: name, status, duration, participants, tracks

**To Generate Test Data:**
```bash
# Create a test room
sudo docker run --rm --network host livekit/livekit-cli:latest create-room \
  --url http://192.168.0.216:7880 \
  --api-key devkey-livekit-api-key-2024 \
  --api-secret devkey-livekit-api-secret-2024-min-32-chars \
  --name test-room-$(date +%s)
```

### 2. Session Stats Verification

**API Test:**
```bash
curl "http://localhost:3000/api/trpc/livekit.getSessionStats"
```

**Expected:**
- `active_sessions`: Number of active rooms
- `total_sessions`: Total rooms created
- `avg_duration_seconds`: Average session duration
- `total_participants_all_time`: Total participants across all sessions

**UI Test:**
1. Open http://localhost:3000/
2. Check the "Sessions" stat card
3. Should show active and total session counts

### 3. Agents Verification

**API Test:**
```bash
curl "http://localhost:3000/api/trpc/livekit.getAgents?input=%7B%7D"
```

**Expected:**
- Returns array of agents (empty if no agents)
- Each agent has: `agent_id`, `agent_name`, `agent_type`, `total_sessions`

**UI Test:**
1. Open http://localhost:3000/agents
2. Should show list of agents (or empty state if none)
3. Each agent shows: name, type, sessions, first seen, last seen

**Note:** Agents only appear when:
- An agent joins a room (via webhook `participant_joined` with `isAgent: true`)
- The webhook includes agent metadata

### 4. Agent Stats Verification

**API Test:**
```bash
curl "http://localhost:3000/api/trpc/livekit.getAgentStats"
```

**Expected:**
- `total_agents`: Total number of agents
- `active_agents`: Currently active agents
- `total_sessions_all_agents`: Total agent sessions
- `avg_session_duration`: Average agent session duration
- `agentTypes`: Array of agent types with counts

**UI Test:**
1. Open http://localhost:3000/agents
2. Check the stats cards at the top
3. Should show total agents, active agents, etc.

### 5. Participants Verification

**How to Verify:**
Participants appear when:
1. A room is created (webhook: `room_started`)
2. A participant joins (webhook: `participant_joined`)
3. View in Sessions page → Click on a session → See participants list

**To Test:**
- Requires actual LiveKit client connection
- Or simulate webhook event (see below)

### 6. Tracks Verification

**How to Verify:**
Tracks appear when:
1. A participant publishes a track (webhook: `track_published`)
2. View in Sessions page → Click on a session → See tracks list

**To Test:**
- Requires actual LiveKit client with media tracks
- Or simulate webhook event (see below)

### 7. Costs Verification

**API Test:**
```bash
curl "http://localhost:3000/api/trpc/livekit.getCosts?input=%7B%22json%22%3A%7B%22limit%22%3A10%7D%7D"
```

**Expected:**
- Returns array of cost records
- Each cost has: `room_id`, `total_cost`, `participant_cost`, `egress_cost`, etc.

**UI Test:**
1. Open http://localhost:3000/costs
2. Should show cost records (or empty if none calculated)
3. Costs are calculated based on:
   - Participant minutes
   - Egress/Ingress data
   - Recording minutes

**Note:** Costs are calculated when:
- Cost calculation is triggered (manual or automatic)
- Requires cost configuration to be set

### 8. Cost Stats Verification

**API Test:**
```bash
curl "http://localhost:3000/api/trpc/livekit.getCostStats"
```

**Expected:**
- `total_cost`: Total cost across all sessions
- `avg_cost_per_session`: Average cost per session
- `cost_by_day`: Array of daily costs

**UI Test:**
1. Open http://localhost:3000/
2. Check the "Costs" stat card
3. Should show total cost and trends

## Webhook Event Testing

To verify webhooks are working:

```bash
# Watch webhook logs
sudo docker logs -f livekit-dashboard-dev | grep -E "(Webhook|Room|Participant|Track)"
```

**Expected Events:**
- `room_started` - When room is created
- `room_finished` - When room ends
- `participant_joined` - When participant joins
- `participant_left` - When participant leaves
- `track_published` - When track is published
- `track_unpublished` - When track is unpublished

## Simulating Webhook Events

You can test webhook handling by sending test payloads:

```bash
# Test room_started event
curl -X POST http://localhost:3000/api/webhooks/livekit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <signature>" \
  -d '{
    "event": "room_started",
    "room": {
      "sid": "RM_test123",
      "name": "test-room",
      "creationTime": "1234567890"
    }
  }'
```

**Note:** The signature must be valid. Use LiveKit's webhook signing or disable signature verification for testing.

## Database Verification

Check database directly:

```bash
# Connect to database pod
kubectl exec -it -n pg <postgres-pod> -- psql -U livekit -d livekit_dashboard

# Check tables
\dt

# Check rooms
SELECT room_sid, room_name, status, started_at FROM rooms ORDER BY started_at DESC LIMIT 5;

# Check participants
SELECT * FROM participants LIMIT 5;

# Check agents
SELECT * FROM agents LIMIT 5;

# Check tracks
SELECT * FROM tracks LIMIT 5;
```

## Common Issues

### Sessions not appearing
- Check webhook is configured correctly
- Verify webhook signature verification is working
- Check database connection
- Review server logs for errors

### Agents not appearing
- Agents only appear when `participant_joined` webhook has `isAgent: true`
- Check agent metadata in webhook payload
- Verify agent_sessions table has data

### Costs not calculating
- Check cost configuration is set
- Verify cost calculation is triggered
- Check costs table has records

### Stats showing 0
- Verify database queries are working
- Check for SQL errors in logs
- Verify data exists in database

## Full Test Checklist

- [ ] Sessions API returns data
- [ ] Sessions UI page loads and shows data
- [ ] Session Stats API returns correct counts
- [ ] Session Stats UI shows correct numbers
- [ ] Agents API returns data (or empty array)
- [ ] Agents UI page loads
- [ ] Agent Stats API returns data
- [ ] Costs API returns data (or empty array)
- [ ] Costs UI page loads
- [ ] Cost Stats API returns data
- [ ] Webhook events are received
- [ ] Webhook events are processed correctly
- [ ] Database tables have data
- [ ] All UI pages load (200 status)

## Next Steps

Once verification is complete:
1. Rebuild Docker image with all fixes
2. Deploy to Kubernetes
3. Update LiveKit webhook URL to production
4. Monitor production logs

