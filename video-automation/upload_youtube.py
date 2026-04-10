#!/usr/bin/env python3
"""
PhenoMap YouTube Uploader
Uploads generated videos to YouTube using the Data API v3.

SETUP (one-time):
  1. Go to https://console.cloud.google.com
  2. Create a new project (or use existing)
  3. Enable "YouTube Data API v3"
  4. Go to Credentials → Create OAuth 2.0 Client ID → Desktop App
  5. Download the JSON → save as client_secret.json in this folder
  6. First run will open a browser for OAuth consent

Usage:
  python upload_youtube.py --file output/spotlight_Nimitz.mp4
  python upload_youtube.py --file output/top5_uap.mp4 --title "Top 5 UAP"
"""
import argparse
import os
import sys
from pathlib import Path

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

import config


SCOPES = config.YOUTUBE_SCOPES
DEFAULT_CATEGORY = "28"  # Science & Technology
DEFAULT_TAGS = [
    "UAP", "UFO", "PhenoMap", "sighting", "government", "declassified",
    "Pentagon", "AARO", "Navy", "military", "unexplained", "aerial phenomena",
    "disclosure", "congress", "intelligence",
]


def get_authenticated_service():
    """Authenticate with YouTube API and return a service object."""
    creds = None
    token_path = Path(config.YOUTUBE_TOKEN_FILE)
    secret_path = Path(config.YOUTUBE_CLIENT_SECRET)

    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not secret_path.exists():
                print(f"ERROR: {secret_path} not found.")
                print("Download OAuth credentials from Google Cloud Console.")
                print("See README.md for setup instructions.")
                sys.exit(1)
            flow = InstalledAppFlow.from_client_secrets_file(str(secret_path), SCOPES)
            creds = flow.run_local_server(port=8080)

        token_path.write_text(creds.to_json())
        print(f"Token saved to {token_path}")

    return build("youtube", "v3", credentials=creds)


def upload_video(
    file_path,
    title=None,
    description=None,
    tags=None,
    category=DEFAULT_CATEGORY,
    privacy="private",
):
    """Upload a video to YouTube.

    Args:
        file_path: Path to the video file
        title: Video title (auto-generated from filename if not provided)
        description: Video description
        tags: List of tags
        category: YouTube category ID (default: Science & Technology)
        privacy: "private", "unlisted", or "public"

    Returns:
        Video ID string on success, None on failure
    """
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"ERROR: Video file not found: {file_path}")
        return None

    if not title:
        title = file_path.stem.replace("_", " ").title()

    if not description:
        description = (
            f"{title}\n\n"
            "Sourced from government records, declassified documents, "
            "and verified witness accounts.\n\n"
            "PhenoMap — Global UAP Intelligence Platform\n"
            "https://shawne1976.github.io\n\n"
            "#UAP #UFO #Disclosure #PhenoMap #Pentagon #AARO "
            "#Declassified #Government #Military #Sighting"
        )

    if not tags:
        tags = DEFAULT_TAGS

    youtube = get_authenticated_service()

    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category,
        },
        "status": {
            "privacyStatus": privacy,
            "selfDeclaredMadeForKids": False,
        },
    }

    media = MediaFileUpload(
        str(file_path),
        mimetype="video/mp4",
        resumable=True,
        chunksize=1024 * 1024 * 10,  # 10MB chunks
    )

    print(f"Uploading: {file_path.name}")
    print(f"Title:     {title}")
    print(f"Privacy:   {privacy}")

    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media,
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"  Uploaded {pct}%")

    video_id = response["id"]
    print(f"\nUpload complete!")
    print(f"Video ID: {video_id}")
    print(f"URL: https://www.youtube.com/watch?v={video_id}")
    return video_id


def main():
    parser = argparse.ArgumentParser(description="Upload video to YouTube")
    parser.add_argument("--file", required=True, help="Path to video file")
    parser.add_argument("--title", default=None, help="Video title")
    parser.add_argument("--description", default=None, help="Video description")
    parser.add_argument("--tags", nargs="+", default=None, help="Video tags")
    parser.add_argument("--privacy", choices=["private", "unlisted", "public"],
                        default="private", help="Privacy status (default: private)")
    args = parser.parse_args()

    video_id = upload_video(
        file_path=args.file,
        title=args.title,
        description=args.description,
        tags=args.tags,
        privacy=args.privacy,
    )

    if video_id:
        print(f"\nDone! Manage at: https://studio.youtube.com/video/{video_id}")


if __name__ == "__main__":
    main()
