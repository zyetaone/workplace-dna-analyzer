#!/bin/bash

# Simple deployment script for VPS with libSQL

echo "🚀 Starting deployment..."

# Build the application
echo "📦 Building application..."
bun run build

# The build output is in the 'build' folder
echo "✅ Build complete!"
echo ""
echo "To deploy to your VPS:"
echo "1. Copy the 'build' folder to your server"
echo "2. Install dependencies: bun install --production"
echo "3. Set environment variables in .env:"
echo "   - DATABASE_URL=libsql://your-database-url or file:local.db"
echo "   - DATABASE_AUTH_TOKEN=your-token (if using remote libSQL)"
echo "   - OPENAI_API_KEY=your-openai-key"
echo "4. Run: bun run build/index.js"
echo ""
echo "For production with PM2:"
echo "pm2 start build/index.js --name workplace-quiz"