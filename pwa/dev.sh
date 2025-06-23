#!/bin/bash

# PWA Development Server with Progress Indicators
# Usage: ./dev.sh or bash dev.sh

echo "🚀 Starting Ultimate Expense Tracker PWA Development Server..."
echo "📁 Working directory: $(pwd)"
echo "⏰ Starting at: $(date)"
echo "─────────────────────────────────────────────────────────────"

# Check if we're in the PWA directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "💡 Please run this script from the pwa/ directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies first..."
    pnpm install
fi

# Run the development server with progress
echo "🔧 Starting development server..."
pnpm run dev:progress