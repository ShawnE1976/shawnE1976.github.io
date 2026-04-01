#!/bin/bash
# ============================================================================
# AgentHub - One-Line Installer for Mac
#
# Paste this into Terminal:
#   curl -fsSL https://raw.githubusercontent.com/ShawnE1976/shawnE1976.github.io/claude/multi-agent-dashboard-MjYyb/voltagent-dashboard/install.sh | bash
#
# Or if you already cloned the repo:
#   bash install.sh
# ============================================================================

set -e

echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │                                         │"
echo "  │   ⚙  AgentHub Installer                 │"
echo "  │   Multi-Agent Dashboard for Mac          │"
echo "  │                                         │"
echo "  └─────────────────────────────────────────┘"
echo ""

INSTALL_DIR="$HOME/AgentHub"
APP_DIR="$HOME/Desktop/AgentHub.app"

# --------------------------------------------------
# Step 1: Check/Install Node.js
# --------------------------------------------------
echo "  [1/6] Checking for Node.js..."

if command -v node &>/dev/null; then
  NODE_VERSION=$(node -v)
  echo "         Found Node.js $NODE_VERSION ✓"
else
  echo "         Node.js not found. Installing via Homebrew..."

  # Install Homebrew if needed
  if ! command -v brew &>/dev/null; then
    echo "         Installing Homebrew first..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add brew to path for Apple Silicon
    if [ -f "/opt/homebrew/bin/brew" ]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
  fi

  brew install node
  echo "         Node.js installed ✓"
fi

# --------------------------------------------------
# Step 2: Download AgentHub
# --------------------------------------------------
echo "  [2/6] Downloading AgentHub..."

if [ -d "$INSTALL_DIR" ]; then
  echo "         Existing installation found, updating..."
  cd "$INSTALL_DIR"
  git pull origin claude/multi-agent-dashboard-MjYyb 2>/dev/null || true
else
  git clone --branch claude/multi-agent-dashboard-MjYyb --single-branch \
    https://github.com/ShawnE1976/shawnE1976.github.io.git "$INSTALL_DIR-temp"

  # Move just the dashboard folder
  mv "$INSTALL_DIR-temp/voltagent-dashboard" "$INSTALL_DIR"
  rm -rf "$INSTALL_DIR-temp"
fi

cd "$INSTALL_DIR"
echo "         Downloaded to $INSTALL_DIR ✓"

# --------------------------------------------------
# Step 3: Install dependencies
# --------------------------------------------------
echo "  [3/6] Installing dependencies..."
npm install --silent 2>/dev/null
echo "         Dependencies installed ✓"

# --------------------------------------------------
# Step 4: Set up API key
# --------------------------------------------------
echo "  [4/6] Setting up configuration..."

if [ ! -f "$INSTALL_DIR/.env" ]; then
  cp .env.example .env

  echo ""
  echo "  ┌─────────────────────────────────────────┐"
  echo "  │                                         │"
  echo "  │   🔑 API Key Required                    │"
  echo "  │                                         │"
  echo "  │   Get your key from:                    │"
  echo "  │   https://console.anthropic.com         │"
  echo "  │                                         │"
  echo "  │   It starts with: sk-ant-...            │"
  echo "  │                                         │"
  echo "  └─────────────────────────────────────────┘"
  echo ""

  read -p "  Paste your Anthropic API key here: " API_KEY

  if [ -n "$API_KEY" ]; then
    # Replace the placeholder in .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|sk-ant-xxxxx|$API_KEY|g" "$INSTALL_DIR/.env"
    else
      sed -i "s|sk-ant-xxxxx|$API_KEY|g" "$INSTALL_DIR/.env"
    fi
    echo "         API key saved ✓"
  else
    echo "         ⚠ No key entered. You'll need to edit $INSTALL_DIR/.env later."
  fi
else
  echo "         Config already exists ✓"
fi

# --------------------------------------------------
# Step 5: Create Desktop App
# --------------------------------------------------
echo "  [5/6] Creating desktop app..."

# Remove old app if exists
rm -rf "$APP_DIR"

mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

# Find node path
NODE_PATH=$(which node)
NPM_PATH=$(which npm)

# Create launcher
cat > "$APP_DIR/Contents/MacOS/AgentHub" << LAUNCHER
#!/bin/bash
export PATH="/usr/local/bin:/opt/homebrew/bin:\$PATH"
cd "$INSTALL_DIR"

# Start server in background
"$NODE_PATH" server.js &
SERVER_PID=\$!

# Wait for server to start
sleep 2

# Open browser
open http://localhost:3000

# Keep running until server stops
wait \$SERVER_PID
LAUNCHER

chmod +x "$APP_DIR/Contents/MacOS/AgentHub"

# Create Info.plist
cat > "$APP_DIR/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>AgentHub</string>
  <key>CFBundleDisplayName</key>
  <string>AgentHub</string>
  <key>CFBundleIdentifier</key>
  <string>com.agenthub.dashboard</string>
  <key>CFBundleVersion</key>
  <string>1.0</string>
  <key>CFBundleExecutable</key>
  <string>AgentHub</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
</dict>
</plist>
PLIST

# Create app icon
python3 << 'ICONSCRIPT' 2>/dev/null || true
import subprocess, tempfile, os

svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
<rect width="1024" height="1024" rx="220" fill="#0a0e1a"/>
<rect x="20" y="20" width="984" height="984" rx="200" fill="none" stroke="#1e3a5f" stroke-width="2"/>
<circle cx="512" cy="512" r="200" fill="none" stroke="#00d4ff" stroke-width="36"/>
<circle cx="512" cy="512" r="80" fill="#00d4ff"/>
<circle cx="512" cy="512" r="300" fill="none" stroke="#00d4ff" stroke-width="8" opacity="0.2"/>
<rect x="496" y="120" width="32" height="100" rx="16" fill="#00d4ff"/>
<rect x="496" y="804" width="32" height="100" rx="16" fill="#00d4ff"/>
<rect x="120" y="496" width="100" height="32" rx="16" fill="#00d4ff"/>
<rect x="804" y="496" width="100" height="32" rx="16" fill="#00d4ff"/>
<rect x="236" y="216" width="32" height="100" rx="16" fill="#7c3aed" transform="rotate(45 252 266)"/>
<rect x="756" y="708" width="32" height="100" rx="16" fill="#7c3aed" transform="rotate(45 772 758)"/>
<rect x="216" y="756" width="100" height="32" rx="16" fill="#7c3aed" transform="rotate(45 266 772)"/>
<rect x="708" y="236" width="100" height="32" rx="16" fill="#7c3aed" transform="rotate(45 758 252)"/>
<text x="512" y="540" text-anchor="middle" font-family="SF Pro Display,Helvetica" font-size="80" font-weight="700" fill="#0a0e1a">A</text>
</svg>'''

tmp_svg = tempfile.mktemp(suffix='.svg')
with open(tmp_svg, 'w') as f:
    f.write(svg)

tmp_png = tempfile.mktemp(suffix='.png')
iconset = tempfile.mktemp(suffix='.iconset')
os.makedirs(iconset)

# Convert SVG to PNG (try rsvg-convert first, then sips)
try:
    subprocess.run(['rsvg-convert', '-w', '1024', '-h', '1024', tmp_svg, '-o', tmp_png], check=True, capture_output=True)
except:
    # Fallback: create a simple PNG with sips if available
    subprocess.run(['sips', '-s', 'format', 'png', tmp_svg, '--out', tmp_png], capture_output=True)

if os.path.exists(tmp_png):
    for size in [16, 32, 64, 128, 256, 512, 1024]:
        out = os.path.join(iconset, f'icon_{size}x{size}.png')
        subprocess.run(['sips', '-z', str(size), str(size), tmp_png, '--out', out], capture_output=True)
        if size <= 512:
            out2x = os.path.join(iconset, f'icon_{size//2}x{size//2}@2x.png')
            subprocess.run(['sips', '-z', str(size), str(size), tmp_png, '--out', out2x], capture_output=True)

    icon_path = os.path.expanduser('~/Desktop/AgentHub.app/Contents/Resources/icon.icns')
    subprocess.run(['iconutil', '-c', 'icns', iconset, '-o', icon_path], capture_output=True)

# Cleanup
os.unlink(tmp_svg)
if os.path.exists(tmp_png):
    os.unlink(tmp_png)
import shutil
shutil.rmtree(iconset, ignore_errors=True)
ICONSCRIPT

echo "         AgentHub.app created on Desktop ✓"

# --------------------------------------------------
# Step 6: Done!
# --------------------------------------------------
echo "  [6/6] Installation complete!"
echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │                                         │"
echo "  │   ✅ AgentHub is ready!                  │"
echo "  │                                         │"
echo "  │   Double-click AgentHub on your Desktop  │"
echo "  │   to launch the dashboard.               │"
echo "  │                                         │"
echo "  │   It will open in your browser at:       │"
echo "  │   http://localhost:3000                   │"
echo "  │                                         │"
echo "  │   Files: ~/AgentHub/                     │"
echo "  │   Config: ~/AgentHub/.env                │"
echo "  │                                         │"
echo "  └─────────────────────────────────────────┘"
echo ""

# Ask if they want to launch now
read -p "  Launch AgentHub now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  open "$APP_DIR"
fi
