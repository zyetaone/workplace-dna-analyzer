#!/bin/bash

# Test script for Docker build and deployment
set -e

echo "🐳 Testing Docker build and deployment..."

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t ppt-app-test .

# Run the container
echo "🚀 Starting container..."
docker run -d \
  --name ppt-app-test \
  -p 3001:3000 \
  -e DATABASE_URL=/app/data/test.db \
  ppt-app-test

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ Health check passed!"
  curl -s http://localhost:3001/health | jq .
else
  echo "❌ Health check failed!"
  docker logs ppt-app-test
  exit 1
fi

# Test main endpoint
echo "🌐 Testing main endpoint..."
if curl -f http://localhost:3001/ > /dev/null 2>&1; then
  echo "✅ Main endpoint accessible!"
else
  echo "❌ Main endpoint failed!"
  docker logs ppt-app-test
  exit 1
fi

# Check logs for database initialization
echo "📊 Checking database initialization..."
docker logs ppt-app-test | grep -i "database initialization" || echo "No database logs found"

# Cleanup
echo "🧹 Cleaning up..."
docker stop ppt-app-test
docker rm ppt-app-test
docker rmi ppt-app-test

echo "✅ Docker test completed successfully!"