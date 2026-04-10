"""
PhenoMap Video Automation — Configuration
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / "assets"
OUTPUT_DIR = BASE_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Video settings
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920  # 9:16 vertical for TikTok/Shorts/Reels
FPS = 30
DURATION_PER_SLIDE = 5  # seconds per sighting slide
TRANSITION_DURATION = 0.5  # seconds for fade transitions

# Colors (PhenoMap dark theme)
BG_COLOR = (13, 17, 23)        # #0d1117
ACCENT_COLOR = (0, 255, 136)   # #00ff88 — PhenoMap green
TEXT_COLOR = (230, 237, 243)    # #e6edf3
SECONDARY_TEXT = (139, 148, 158)  # #8b949e
CARD_BG = (22, 27, 34)         # #161b22
BORDER_COLOR = (48, 54, 61)    # #30363d
RED_ACCENT = (255, 69, 58)     # for "classified" / "verified"
YELLOW_ACCENT = (255, 214, 10) # for "pending"

# Fonts (will use default if custom not found)
FONT_BOLD = str(ASSETS_DIR / "font-bold.ttf")
FONT_REGULAR = str(ASSETS_DIR / "font-regular.ttf")

# YouTube
YOUTUBE_CLIENT_SECRET = os.getenv("YOUTUBE_CLIENT_SECRET_FILE", "client_secret.json")
YOUTUBE_TOKEN_FILE = str(BASE_DIR / "youtube_token.json")
YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

# TikTok
TIKTOK_CLIENT_KEY = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
