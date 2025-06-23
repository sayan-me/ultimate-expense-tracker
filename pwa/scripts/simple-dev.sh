#!/bin/bash

echo "🚀 Starting Ultimate Expense Tracker PWA..."
echo "⏳ Please wait while the development server starts..."
echo ""

# Show a spinner while waiting for the server
show_spinner() {
    local -r pid="${1}"
    local -r delay='0.5'
    local spinstr='\|/-'
    local temp
    while ps a | awk '{print $1}' | grep -q "${pid}"; do
        temp="${spinstr#?}"
        printf " [%c] Starting development server..." "${spinstr}"
        spinstr=${temp}${spinstr%"${temp}"}
        sleep "${delay}"
        printf "\r"
    done
    printf "    \r"
}

# Start Next.js in background to monitor it
pnpm next dev &
NEXT_PID=$!

# Show spinner
show_spinner $NEXT_PID

echo "✅ Development server should be ready!"
echo "🌐 Open: http://localhost:3000"

# Wait for the background process
wait $NEXT_PID