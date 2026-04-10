#!/usr/bin/env python3
"""
PhenoMap TikTok Uploader
Uploads videos to TikTok using the Content Posting API.

SETUP (one-time):
  1. Go to https://developers.tiktok.com
  2. Create an app → request "Content Posting" permission
  3. Wait for approval (can take days/weeks)
  4. Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to .env
  5. First run will guide you through OAuth

NOTE: TikTok's API requires app review and approval. Until approved,
you can test with sandbox mode (posts visible only to you).

Usage:
  python upload_tiktok.py --file output/spotlight_Nimitz.mp4
  python upload_tiktok.py --file output/top5_uap.mp4 --caption "Top 5 UAP encounters"
"""
import argparse
import json
import sys
import time
from pathlib import Path

import requests

import config


TOKEN_FILE = config.BASE_DIR / "tiktok_token.json"
AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/"
TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
UPLOAD_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/"
UPLOAD_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"

DEFAULT_HASHTAGS = "#UAP #UFO #PhenoMap #Disclosure #Pentagon #Declassified #Military"


def check_credentials():
    """Verify TikTok API credentials are configured."""
    if not config.TIKTOK_CLIENT_KEY or not config.TIKTOK_CLIENT_SECRET:
        print("=" * 60)
        print("TikTok API credentials not configured.")
        print()
        print("To set up TikTok posting:")
        print("  1. Go to https://developers.tiktok.com")
        print("  2. Create a developer account")
        print("  3. Create an app with 'Content Posting' scope")
        print("  4. Wait for TikTok to approve your app")
        print("  5. Add credentials to .env file:")
        print("     TIKTOK_CLIENT_KEY=your_key_here")
        print("     TIKTOK_CLIENT_SECRET=your_secret_here")
        print("=" * 60)
        return False
    return True


def get_auth_url():
    """Generate the TikTok OAuth URL for user authorization."""
    params = {
        "client_key": config.TIKTOK_CLIENT_KEY,
        "scope": "video.upload,video.publish",
        "response_type": "code",
        "redirect_uri": "http://localhost:8080/callback",
        "state": "phenomap",
    }
    url = AUTH_URL + "?" + "&".join(f"{k}={v}" for k, v in params.items())
    return url


def exchange_code_for_token(auth_code):
    """Exchange authorization code for access token."""
    resp = requests.post(TOKEN_URL, json={
        "client_key": config.TIKTOK_CLIENT_KEY,
        "client_secret": config.TIKTOK_CLIENT_SECRET,
        "code": auth_code,
        "grant_type": "authorization_code",
        "redirect_uri": "http://localhost:8080/callback",
    })
    data = resp.json()
    if "access_token" in data:
        TOKEN_FILE.write_text(json.dumps(data))
        print("Token saved!")
        return data["access_token"]
    else:
        print(f"Token exchange failed: {data}")
        return None


def load_token():
    """Load saved access token."""
    if TOKEN_FILE.exists():
        data = json.loads(TOKEN_FILE.read_text())
        return data.get("access_token")
    return None


def refresh_token_if_needed():
    """Refresh token if expired."""
    if not TOKEN_FILE.exists():
        return None
    data = json.loads(TOKEN_FILE.read_text())
    refresh = data.get("refresh_token")
    if not refresh:
        return None

    resp = requests.post(TOKEN_URL, json={
        "client_key": config.TIKTOK_CLIENT_KEY,
        "client_secret": config.TIKTOK_CLIENT_SECRET,
        "grant_type": "refresh_token",
        "refresh_token": refresh,
    })
    new_data = resp.json()
    if "access_token" in new_data:
        TOKEN_FILE.write_text(json.dumps(new_data))
        return new_data["access_token"]
    return None


def get_access_token():
    """Get a valid access token, guiding through OAuth if needed."""
    token = load_token()
    if token:
        return token

    token = refresh_token_if_needed()
    if token:
        return token

    # Need fresh authorization
    auth_url = get_auth_url()
    print("=" * 60)
    print("TikTok authorization required.")
    print()
    print("1. Open this URL in your browser:")
    print(f"   {auth_url}")
    print()
    print("2. Authorize the app")
    print("3. Copy the 'code' parameter from the redirect URL")
    print("=" * 60)
    code = input("Paste the authorization code: ").strip()
    token = exchange_code_for_token(code)
    return token


def upload_video(file_path, caption=None):
    """Upload a video to TikTok.

    Args:
        file_path: Path to the video file
        caption: Video caption with hashtags

    Returns:
        Publish ID on success, None on failure
    """
    if not check_credentials():
        return None

    file_path = Path(file_path)
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        return None

    token = get_access_token()
    if not token:
        print("ERROR: Could not obtain access token.")
        return None

    if not caption:
        name = file_path.stem.replace("_", " ").title()
        caption = f"{name} | PhenoMap UAP Intelligence {DEFAULT_HASHTAGS}"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    # Step 1: Initialize upload
    file_size = file_path.stat().st_size
    init_body = {
        "post_info": {
            "title": caption[:150],  # TikTok caption limit
            "privacy_level": "SELF_ONLY",  # Start private, change later
            "disable_duet": False,
            "disable_comment": False,
            "disable_stitch": False,
        },
        "source_info": {
            "source": "FILE_UPLOAD",
            "video_size": file_size,
            "chunk_size": file_size,  # Single chunk for smaller files
            "total_chunk_count": 1,
        },
    }

    print(f"Initializing TikTok upload: {file_path.name}")
    resp = requests.post(UPLOAD_INIT_URL, headers=headers, json=init_body)
    data = resp.json()

    if resp.status_code != 200 or "data" not in data:
        print(f"Upload init failed: {data}")
        return None

    upload_url = data["data"]["upload_url"]
    publish_id = data["data"]["publish_id"]

    # Step 2: Upload video bytes
    print("Uploading video...")
    with open(file_path, "rb") as f:
        video_bytes = f.read()

    upload_headers = {
        "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
        "Content-Type": "video/mp4",
    }
    resp = requests.put(upload_url, headers=upload_headers, data=video_bytes)

    if resp.status_code not in (200, 201):
        print(f"Upload failed: {resp.status_code} {resp.text}")
        return None

    # Step 3: Check publish status
    print("Processing...")
    for attempt in range(10):
        time.sleep(3)
        status_resp = requests.post(
            UPLOAD_STATUS_URL,
            headers=headers,
            json={"publish_id": publish_id},
        )
        status_data = status_resp.json()
        pub_status = status_data.get("data", {}).get("status", "PROCESSING")
        print(f"  Status: {pub_status}")
        if pub_status == "PUBLISH_COMPLETE":
            print(f"\nUpload complete! Publish ID: {publish_id}")
            return publish_id
        elif pub_status in ("FAILED", "PUBLISH_FAILED"):
            print(f"Publish failed: {status_data}")
            return None

    print("Upload processing timed out — check TikTok app for status.")
    return publish_id


def main():
    parser = argparse.ArgumentParser(description="Upload video to TikTok")
    parser.add_argument("--file", required=True, help="Path to video file")
    parser.add_argument("--caption", default=None, help="Video caption")
    args = parser.parse_args()

    result = upload_video(args.file, args.caption)
    if result:
        print(f"\nDone! Check your TikTok app for the uploaded video.")


if __name__ == "__main__":
    main()
