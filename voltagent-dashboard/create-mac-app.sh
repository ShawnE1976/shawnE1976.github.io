#!/bin/bash
# Creates AgentHub.app on your Desktop
# Run this once: bash create-mac-app.sh

APP_NAME="AgentHub"
APP_DIR="$HOME/Desktop/$APP_NAME.app"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create .app bundle structure
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Create the launcher script
cat > "$APP_DIR/Contents/MacOS/$APP_NAME" << 'LAUNCHER'
#!/bin/bash
PROJECT_DIR="PLACEHOLDER_DIR"
cd "$PROJECT_DIR"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  /usr/local/bin/npm install 2>/dev/null || /opt/homebrew/bin/npm install 2>/dev/null
fi

# Check for .env
if [ ! -f ".env" ]; then
  cp .env.example .env
  osascript -e 'display dialog "Edit .env with your ANTHROPIC_API_KEY first!" buttons {"OK"}'
  open .env
  exit 0
fi

# Wait for server then open browser
(for i in 1 2 3 4 5 6 7 8 9 10; do sleep 1; curl -s http://localhost:3000/api/health > /dev/null 2>&1 && break; done; open http://localhost:3000) &

# Start server
/usr/local/bin/node server.js 2>/dev/null || /opt/homebrew/bin/node server.js
LAUNCHER

# Replace placeholder with actual project path
sed -i '' "s|PLACEHOLDER_DIR|$PROJECT_DIR|g" "$APP_DIR/Contents/MacOS/$APP_NAME"
chmod +x "$APP_DIR/Contents/MacOS/$APP_NAME"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>$APP_NAME</string>
  <key>CFBundleDisplayName</key>
  <string>$APP_NAME</string>
  <key>CFBundleIdentifier</key>
  <string>com.agenthub.dashboard</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundleExecutable</key>
  <string>$APP_NAME</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.15</string>
</dict>
</plist>
PLIST

# Create a simple icon (gear symbol)
# For a custom icon, replace Resources/icon.icns with your own
python3 -c "
import subprocess, tempfile, os
svg = '''<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1024 1024\">
<rect width=\"1024\" height=\"1024\" rx=\"200\" fill=\"#0a0e1a\"/>
<circle cx=\"512\" cy=\"512\" r=\"280\" fill=\"none\" stroke=\"#00d4ff\" stroke-width=\"40\"/>
<circle cx=\"512\" cy=\"512\" r=\"120\" fill=\"#00d4ff\" opacity=\"0.3\"/>
<circle cx=\"512\" cy=\"512\" r=\"60\" fill=\"#00d4ff\"/>
<rect x=\"492\" y=\"80\" width=\"40\" height=\"120\" rx=\"20\" fill=\"#00d4ff\"/>
<rect x=\"492\" y=\"824\" width=\"40\" height=\"120\" rx=\"20\" fill=\"#00d4ff\"/>
<rect x=\"80\" y=\"492\" width=\"120\" height=\"40\" rx=\"20\" fill=\"#00d4ff\"/>
<rect x=\"824\" y=\"492\" width=\"120\" height=\"40\" rx=\"20\" fill=\"#00d4ff\"/>
<rect x=\"212\" y=\"186\" width=\"40\" height=\"120\" rx=\"20\" fill=\"#7c3aed\" transform=\"rotate(45 232 246)\"/>
<rect x=\"772\" y=\"718\" width=\"40\" height=\"120\" rx=\"20\" fill=\"#7c3aed\" transform=\"rotate(45 792 778)\"/>
<rect x=\"186\" y=\"772\" width=\"120\" height=\"40\" rx=\"20\" fill=\"#7c3aed\" transform=\"rotate(45 246 792)\"/>
<rect x=\"718\" y=\"212\" width=\"120\" height=\"40\" rx=\"20\" fill=\"#7c3aed\" transform=\"rotate(45 778 232)\"/>
</svg>'''
tmp = tempfile.mktemp(suffix='.svg')
with open(tmp, 'w') as f: f.write(svg)
png = tempfile.mktemp(suffix='.png')
try:
    subprocess.run(['sips', '-s', 'format', 'png', '-z', '512', '512', tmp, '--out', png], capture_output=True)
    iconset = tempfile.mktemp(suffix='.iconset')
    os.makedirs(iconset)
    for size in [16,32,128,256,512]:
        subprocess.run(['sips', '-z', str(size), str(size), png, '--out', os.path.join(iconset, f'icon_{size}x{size}.png')], capture_output=True)
    subprocess.run(['iconutil', '-c', 'icns', iconset, '-o', '$APP_DIR/Contents/Resources/icon.icns'], capture_output=True)
except: pass
" 2>/dev/null

echo ""
echo "  ✅ AgentHub.app created on your Desktop!"
echo ""
echo "  Double-click it to launch the dashboard."
echo "  First run will prompt you for your API key."
echo ""
