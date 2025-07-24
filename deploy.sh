#!/bin/bash

# Production deployment script for Capvid

echo "🚀 Starting Capvid deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Check if containers are running
echo "✅ Checking container status..."
docker-compose ps

echo "🎉 Deployment complete!"
echo "📱 Frontend: http://localhost"
echo "🖥️  Backend API: http://localhost:5001"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
