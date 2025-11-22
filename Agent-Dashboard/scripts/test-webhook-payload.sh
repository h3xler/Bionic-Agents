#!/bin/bash
# Test webhook with a sample LiveKit payload

set -e

cd "$(dirname "$0")"

echo "=== Testing Webhook with Sample Payload ==="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/trpc/livekit.getSessionStats > /dev/null; then
    echo "❌ Server not running on localhost:3000"
    echo "Please start the server first using test-webhook-local.sh"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Create a test webhook payload (room_started event)
# Note: This won't have a valid signature, but we can test the endpoint structure
PAYLOAD='{
  "event": "room_started",
  "room": {
    "sid": "RM_test123",
    "name": "test-room",
    "creationTime": 1234567890,
    "metadata": "{}"
  }
}'

echo "📤 Sending test webhook payload..."
echo ""

# Send to webhook endpoint (will fail signature verification, but we can see the error)
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST http://localhost:3000/api/webhooks/livekit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE")

echo "Response:"
echo "$BODY"
echo ""
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "500" ]; then
    echo "⚠️  Expected: Signature verification will fail (we're using a test payload)"
    echo "✅ But the endpoint is accessible and processing requests"
    echo ""
    echo "To test with real webhooks, you need to:"
    echo "1. Expose localhost:3000 to the cluster (port-forward or ngrok)"
    echo "2. Update LiveKit webhook config to point to the exposed URL"
fi

