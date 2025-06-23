#!/bin/bash

# Firebase Functions Build and Deploy Script
# Usage: ./deploy.sh

echo "🚀 Building and deploying Firebase Functions..."
echo "📁 Working directory: $(pwd)"
echo "⏰ Started at: $(date)"
echo "─────────────────────────────────────────────────────────────"

# Check if we're in the functions directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "💡 Please run this script from the functions/ directory"
    exit 1
fi

# Set discovery timeout for complex functions
export FUNCTIONS_DISCOVERY_TIMEOUT=60
echo "🔧 Set FUNCTIONS_DISCOVERY_TIMEOUT=60"

# Build TypeScript
echo "📦 Building TypeScript..."
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
npm run deploy

# Check if deploy succeeded
if [ $? -ne 0 ]; then
    echo "❌ Deploy failed!"
    exit 1
fi

echo "✅ Deploy successful!"
echo "🎉 Firebase Functions deployed successfully at: $(date)"
echo "🌐 Functions are available at: https://us-central1-uet-stg.cloudfunctions.net/"