#!/bin/bash
# AgentHub - Double-click to launch
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "First run - installing dependencies..."
  npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo ""
  echo "================================================"
  echo "  SETUP NEEDED: Edit .env with your API key"
  echo "  File location: $(pwd)/.env"
  echo "================================================"
  echo ""
  open .env
  read -p "Press Enter after saving your API key..."
fi

echo ""
echo "  Starting AgentHub..."
echo ""

# Open browser after 2 second delay
(sleep 2 && open http://localhost:3000) &

# Start server
node server.js
