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

# Wait for server to be ready then open browser
(
  for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    curl -s http://localhost:3000/api/health > /dev/null 2>&1 && break
  done
  open http://localhost:3000
) &

# Start server
node server.js
