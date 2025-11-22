# LiveKit Webhook Setup Guide

This guide explains how to configure your LiveKit server to send webhook events to your dashboard for real-time monitoring.

## Overview

The LiveKit Dashboard includes a webhook endpoint that receives real-time events from your LiveKit server. These events are automatically processed and stored in the database, enabling live monitoring of sessions, participants, agents, and tracks.

## Webhook Endpoint

**Development URL:**
```
https://3000-igtqe09pjjtblzh5bmsv8-0b721bf9.manusvm.computer/api/webhooks/livekit
```

**Production URL (after publishing):**
```
https://your-domain.manus.space/api/webhooks/livekit
```

## Supported Events

The webhook handler processes the following LiveKit events:

- `room_started` - When a new room is created
- `room_finished` - When a room ends
- `participant_joined` - When a participant joins a room
- `participant_left` - When a participant leaves a room
- `track_published` - When a media track is published
- `track_unpublished` - When a media track is unpublished

## LiveKit Server Configuration

### Option 1: LiveKit Cloud Dashboard

If you're using LiveKit Cloud (https://cloud.livekit.io):

1. Log in to your LiveKit Cloud dashboard
2. Navigate to **Settings** → **Webhooks**
3. Click **Add Webhook**
4. Enter the webhook URL:
   ```
   https://your-dashboard-url.manus.space/api/webhooks/livekit
   ```
5. Select the events you want to receive (select all for full monitoring)
6. Save the configuration

### Option 2: Self-Hosted LiveKit Server

If you're running your own LiveKit server, add the webhook configuration to your `livekit.yaml`:

```yaml
webhook:
  # Webhook URLs to send events to
  urls:
    - https://your-dashboard-url.manus.space/api/webhooks/livekit
  
  # API key for webhook authentication (use your LiveKit API key)
  api_key: devkey-livekit-api-key-2024
  
  # API secret for webhook authentication (use your LiveKit API secret)
  api_secret: devkey-livekit-api-secret-2024
```

Then restart your LiveKit server:

```bash
# If running with systemd
sudo systemctl restart livekit

# If running with Docker
docker restart livekit-server

# If running directly
./livekit-server --config livekit.yaml
```

### Option 3: Environment Variables

You can also configure webhooks using environment variables:

```bash
export LIVEKIT_WEBHOOK_URLS=https://your-dashboard-url.manus.space/api/webhooks/livekit
export LIVEKIT_API_KEY=devkey-livekit-api-key-2024
export LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024
```

## Webhook Authentication

The webhook endpoint uses LiveKit's built-in webhook authentication. The LiveKit server signs each webhook request with your API secret, and the dashboard verifies the signature using the same credentials configured in your `.env` file:

```env
LIVEKIT_URL=https://livekit.bionicaisolutions.com
LIVEKIT_API_KEY=devkey-livekit-api-key-2024
LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars
```

**Important:** Make sure the API key and secret in your dashboard match those configured in your LiveKit server.

## Testing the Webhook

### 1. Create a Test Room

Use the LiveKit CLI or SDK to create a test room:

```bash
# Using LiveKit CLI
livekit-cli create-room --url https://livekit.bionicaisolutions.com \
  --api-key devkey-livekit-api-key-2024 \
  --api-secret devkey-livekit-api-secret-2024-min-32-chars \
  --name test-room
```

### 2. Check Dashboard Logs

Monitor the dashboard server logs to see incoming webhook events:

```bash
# In the dashboard terminal, you should see:
[Webhook] Received event: room_started
[Webhook] Room started: test-room (sid: RM_xxxxx)
```

### 3. Verify Database

Check the dashboard to see if the room appears:

1. Open the dashboard at https://your-dashboard-url.manus.space
2. Navigate to **Sessions**
3. You should see the test room listed

### 4. Join the Room

Join the test room with a participant to trigger more events:

```bash
# Using LiveKit CLI
livekit-cli join-room --url https://livekit.bionicaisolutions.com \
  --api-key devkey-livekit-api-key-2024 \
  --api-secret devkey-livekit-api-secret-2024-min-32-chars \
  --room test-room \
  --identity test-participant
```

You should see:
- `participant_joined` event in logs
- Participant appears in the session details
- Statistics update in real-time

## Troubleshooting

### Webhooks Not Received

1. **Check LiveKit server logs** for webhook delivery errors
2. **Verify the webhook URL** is accessible from your LiveKit server
3. **Check API credentials** match between LiveKit server and dashboard
4. **Ensure firewall rules** allow traffic from LiveKit server to dashboard

### Authentication Errors

If you see authentication errors in the logs:

```
[Webhook] Error processing webhook: Invalid signature
```

This means the API secret doesn't match. Verify:
- Dashboard `.env` has correct `LIVEKIT_API_SECRET`
- LiveKit server is using the same API secret
- No extra whitespace in the secret values

### Events Not Appearing in Dashboard

1. **Check database connection** - ensure PostgreSQL is running
2. **Check server logs** for database errors
3. **Verify database schema** - run migrations if needed:
   ```bash
   pnpm db:push
   ```

## Event Flow

Here's how webhook events flow through the system:

```
LiveKit Server
    ↓ (HTTP POST with signed payload)
Webhook Endpoint (/api/webhooks/livekit)
    ↓ (Verify signature)
Webhook Handler (webhookHandler.ts)
    ↓ (Process event type)
Database (PostgreSQL)
    ↓ (Store data)
Dashboard UI (Real-time display)
```

## Next Steps

After webhooks are configured:

1. **Monitor live sessions** in the Sessions page
2. **Track AI agents** in the Agents page
3. **Configure cost rates** in Settings to see cost calculations
4. **Set up date filters** to analyze historical data
5. **Export reports** for offline analysis

## Support

If you encounter issues:

1. Check the server logs in the dashboard terminal
2. Review LiveKit server logs for webhook delivery errors
3. Verify network connectivity between LiveKit server and dashboard
4. Contact support at https://help.manus.im
