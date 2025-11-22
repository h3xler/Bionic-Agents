#!/bin/bash
# Test webhook locally by running the app in Docker

set -e

cd "$(dirname "$0")"

echo "=== Local Webhook Testing Setup ==="
echo ""

# Check if dist exists
if [ ! -f "dist/index.js" ]; then
    echo "❌ dist/index.js not found. Building..."
    echo "Note: This requires pnpm. If not available, we'll use Docker to build."
    exit 1
fi

echo "✅ Build files found"
echo ""

# Get database URL from Kubernetes
echo "📦 Getting database connection from Kubernetes..."
DB_URL=$(kubectl get secret livekit-dashboard-db -n livekit -o jsonpath='{.data.DATABASE_URL}' 2>/dev/null | base64 -d)
if [ -z "$DB_URL" ]; then
    echo "⚠️  Could not get DB URL from K8s, using default..."
    DB_URL="postgresql://livekit:L1v3K1tTh1515T0p53cr3t@192.168.0.212:5432/livekit_dashboard"
fi

echo "Starting local server in Docker..."
echo ""

# Stop any existing test container
sudo docker stop livekit-dashboard-test 2>/dev/null || true
sudo docker rm livekit-dashboard-test 2>/dev/null || true

# Run the app in Docker
sudo docker run -d --name livekit-dashboard-test \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DATABASE_URL="$DB_URL" \
  -e LIVEKIT_URL=https://livekit.bionicaisolutions.com \
  -e LIVEKIT_API_KEY=devkey-livekit-api-key-2024 \
  -e LIVEKIT_API_SECRET=devkey-livekit-api-secret-2024-min-32-chars \
  -e STATIC_DIR=/app/dist/public \
  -v "$(pwd)/dist:/app/dist:ro" \
  -v "$(pwd)/node_modules:/app/node_modules:ro" \
  -v "$(pwd)/package.json:/app/package.json:ro" \
  node:20-alpine \
  sh -c "cd /app && node dist/index.js"

echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:3000/api/trpc/livekit.getSessionStats > /dev/null; then
    echo "✅ Server is running on http://localhost:3000"
    echo ""
    echo "📝 To test webhooks:"
    echo "1. In another terminal, run: kubectl port-forward -n livekit svc/livekit-dashboard 3001:3000"
    echo "2. Temporarily update LiveKit webhook config to point to your local machine"
    echo "   Or use a tool like ngrok to expose localhost:3000"
    echo ""
    echo "📊 View logs: sudo docker logs -f livekit-dashboard-test"
    echo "🛑 Stop server: sudo docker stop livekit-dashboard-test"
else
    echo "❌ Server failed to start. Check logs:"
    sudo docker logs livekit-dashboard-test
    exit 1
fi

