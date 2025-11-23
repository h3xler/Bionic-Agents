#!/bin/bash
# Setup script for test database

set -e

echo "🚀 Setting up test database for Agent-Runtime Python..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found. Please install Docker Compose."
    exit 1
fi

# Start test database
echo "📦 Starting test PostgreSQL database..."
docker-compose -f docker-compose.test.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check database health
for i in {1..30}; do
    if docker exec agent-runtime-test-db pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Database failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Set environment variable
export TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5433/liveagents_test"

echo ""
echo "✅ Test database setup complete!"
echo "   Database URL: $TEST_DATABASE_URL"
echo ""
echo "To run schema tests:"
echo "  export TEST_DATABASE_URL=\"$TEST_DATABASE_URL\""
echo "  python scripts/test-schema-connection.py"
echo ""
echo "To stop the database:"
echo "  docker-compose -f docker-compose.test.yml down"


