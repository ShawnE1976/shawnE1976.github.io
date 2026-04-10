# PhenoMap Video Automation

Automated video generation and social media upload pipeline for PhenoMap UAP sighting content.

Generates vertical (9:16) videos optimized for **TikTok**, **YouTube Shorts**, and **Instagram Reels** from your PhenoMap sighting database, then uploads them directly.

## What It Does

1. **Generates videos** from PhenoMap sighting data using Python (Pillow + moviepy + FFmpeg)
2. **Uploads to YouTube** via the YouTube Data API v3
3. **Uploads to TikTok** via the TikTok Content Posting API

No CapCut or manual editing needed.

## Quick Start

```bash
cd video-automation

# Install dependencies
pip install -r requirements.txt

# Also need FFmpeg installed:
# macOS:  brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: download from ffmpeg.org

# Generate a spotlight video (no upload)
python generate_video.py --style spotlight --sighting-id 1

# Generate a Top 5 countdown
python generate_video.py --style top5

# Generate + upload to YouTube in one command
python run_pipeline.py --style spotlight --sighting-id 1 --youtube
```

## Video Styles

| Style | Description | Example |
|-------|-------------|---------|
| `spotlight` | Deep-dive on a single sighting | `--style spotlight --sighting-id 1` |
| `top5` | Top 5 countdown compilation | `--style top5 --ids 1 2 3 12 26` |
| `breaking` | Breaking news style | `--style breaking --sighting-id 26` |

## YouTube Setup (One-Time)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or use existing)
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create OAuth 2.0 Client ID** → **Desktop App**
5. Download the JSON file → save as `client_secret.json` in this folder
6. Copy `.env.example` to `.env`
7. First upload run will open a browser for OAuth consent

```bash
# Upload a generated video
python upload_youtube.py --file output/spotlight_USS_Nimitz.mp4 --privacy unlisted

# Or use the pipeline
python run_pipeline.py --style spotlight --sighting-id 1 --youtube --privacy public
```

## TikTok Setup (One-Time)

1. Go to [TikTok Developer Portal](https://developers.tiktok.com)
2. Create a developer account
3. Create an app → request **Content Posting** permission
4. Wait for approval (can take days)
5. Add `TIKTOK_CLIENT_KEY` and `TIKTOK_CLIENT_SECRET` to `.env`

```bash
python run_pipeline.py --style spotlight --sighting-id 1 --tiktok
```

## Full Pipeline Examples

```bash
# Generate spotlight + upload to YouTube as private (safe default)
python run_pipeline.py --style spotlight --sighting-id 1 --youtube

# Generate top 5 + upload to both platforms
python run_pipeline.py --style top5 --youtube --tiktok --privacy unlisted

# Breaking news + public YouTube upload with custom title
python run_pipeline.py --style breaking --sighting-id 26 --youtube \
  --privacy public --title "BREAKING: Grusch Testimony — Non-Human Craft Confirmed"

# Just generate, no upload
python run_pipeline.py --style top5 --ids 1 2 3 12 26
```

## Adding Background Music

Drop an MP3/WAV file in the `assets/` folder, then:

```bash
python generate_video.py --style spotlight --sighting-id 1 --audio assets/bg_music.mp3
```

## File Structure

```
video-automation/
  generate_video.py   — Video generation (Pillow frames → moviepy assembly)
  upload_youtube.py   — YouTube Data API v3 uploader
  upload_tiktok.py    — TikTok Content Posting API uploader
  run_pipeline.py     — One-command generate + upload
  sighting_data.py    — Sighting database (mirrors data.js)
  config.py           — Settings (colors, sizes, API config)
  requirements.txt    — Python dependencies
  .env.example        — Environment variable template
  .gitignore          — Keeps secrets and outputs out of git
  assets/             — Fonts, audio, images
  output/             — Generated videos land here
```

## Customization

- **Colors/theme**: Edit `config.py` — matches PhenoMap's dark theme
- **Sighting data**: Edit `sighting_data.py` — add new sightings
- **Video layout**: Edit frame renderers in `generate_video.py`
- **Duration**: Adjust `DURATION_PER_SLIDE` in `config.py`
- **Custom fonts**: Drop `.ttf` files in `assets/` as `font-bold.ttf` and `font-regular.ttf`
