#!/bin/bash

echo "🚀 Deploying Capvid to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Set up Vercel environment for frontend build
cd frontend
cp .env.vercel .env.production
cd ..

# Deploy to Vercel
echo "📤 Starting deployment..."
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app should be available at the URL shown above"
echo ""
echo "📝 Note: This deploys a demo version with limited video processing"
echo "💡 For full production, see VERCEL_DEPLOYMENT.md"
