#!/bin/bash

# CapVid Backend Restart Script
# This script rebuilds and restarts the backend Docker container with optimizations

echo "🔄 Restarting CapVid Backend with Production Optimizations..."

# Navigate to backend directory
cd backend/

echo "📦 Rebuilding Docker image..."
docker-compose down --remove-orphans
docker-compose build --no-cache

echo "🚀 Starting optimized backend..."
docker-compose up -d

echo "📊 Checking container status..."
docker-compose ps

echo "📋 Recent logs..."
docker-compose logs --tail=20

echo "✅ Backend restart complete!"
echo "🌐 API available at: https://api.capvid.app"
echo "📱 Health check: curl https://api.capvid.app/system_info"

# Optional: Show memory usage
echo "💾 Current memory usage:"
docker stats --no-stream
