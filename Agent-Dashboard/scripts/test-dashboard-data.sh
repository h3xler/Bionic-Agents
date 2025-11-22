#!/bin/bash
# Test script to verify all dashboard data is accessible

BASE_URL="http://localhost:3000"
echo "=== LiveKit Dashboard Data Verification ==="
echo "Testing endpoints at: $BASE_URL"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    echo -n "Testing $name... "
    response=$(curl -s -w "\n%{http_code}" "$url")
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        # Try to parse JSON and extract useful info
        if command -v python3 &> /dev/null; then
            count=$(echo "$body" | python3 -c "import sys, json; d=json.load(sys.stdin); r=d.get('result',{}).get('data',{}); print(len(r.get('json',{}).get('sessions', r.get('json',{}).get('costs', r.get('json',{}).get('agents', []))))) if isinstance(r.get('json',{}), dict) else len(r) if isinstance(r, list) else 0" 2>/dev/null || echo "?")
            echo "✅ OK (HTTP $http_code, Data: $count items)"
        else
            echo "✅ OK (HTTP $http_code)"
        fi
    else
        echo "⚠️  HTTP $http_code"
    fi
}

# Test all endpoints
test_endpoint "Sessions" "$BASE_URL/api/trpc/livekit.getSessions?input=%7B%22json%22%3A%7B%22limit%22%3A10%7D%7D"
test_endpoint "Session Stats" "$BASE_URL/api/trpc/livekit.getSessionStats"
test_endpoint "Agents" "$BASE_URL/api/trpc/livekit.getAgents?input=%7B%7D"
test_endpoint "Agent Stats" "$BASE_URL/api/trpc/livekit.getAgentStats"
test_endpoint "Costs" "$BASE_URL/api/trpc/livekit.getCosts?input=%7B%22json%22%3A%7B%22limit%22%3A10%7D%7D"
test_endpoint "Cost Stats" "$BASE_URL/api/trpc/livekit.getCostStats"

echo ""
echo "=== UI Pages ==="
for page in "/" "/sessions" "/agents" "/costs"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$status" = "200" ]; then
        echo "✅ $page (HTTP $status)"
    else
        echo "⚠️  $page (HTTP $status)"
    fi
done

echo ""
echo "=== Webhook Activity (last 10 events) ==="
if command -v docker &> /dev/null; then
    docker logs livekit-dashboard-dev --tail=50 2>&1 | grep -E "(Webhook|Room|Participant|Track|Agent)" | tail -10 || echo "No webhook activity found"
fi

echo ""
echo "=== Summary ==="
echo "To see full data:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Navigate to Sessions, Agents, and Costs pages"
echo "3. Create rooms with participants to see real-time updates"
