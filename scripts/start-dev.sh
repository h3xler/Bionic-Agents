#!/bin/bash

# Script to start all Bionic-Agents apps in development mode
# This uses docker-compose.dev.yml to run all services

set -e

echo "🚀 Starting Bionic-Agents development environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose.dev.yml exists
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ docker-compose.dev.yml not found. Please run this script from the project root."
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker compose -f docker-compose.dev.yml build

echo ""
echo "🚀 Starting all services..."
docker compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Services started!"
echo ""
echo "📋 Service URLs:"
echo "   - Agent-Builder:    http://localhost:3000"
echo "   - Agent-Dashboard:  http://localhost:3001"
echo "   - Agent-Runtime:    http://localhost:8080"
echo "   - PostgreSQL:       localhost:5432"
echo ""
echo "📊 View logs with:"
echo "   docker compose -f docker-compose.dev.yml logs -f"
echo ""
echo "🛑 Stop services with:"
echo "   docker compose -f docker-compose.dev.yml down"
echo ""



