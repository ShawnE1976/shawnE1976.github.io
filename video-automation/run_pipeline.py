#!/usr/bin/env python3
"""
PhenoMap Video Pipeline — Generate and Upload in one command.

Examples:
  # Generate a spotlight video and upload to YouTube (private)
  python run_pipeline.py --style spotlight --sighting-id 1 --youtube

  # Generate top 5 and upload to both platforms
  python run_pipeline.py --style top5 --youtube --tiktok

  # Generate breaking news, upload public to YouTube
  python run_pipeline.py --style breaking --sighting-id 26 --youtube --privacy public

  # Just generate, no upload
  python run_pipeline.py --style top5 --ids 1 2 3 12 26
"""
import argparse
import sys
from pathlib import Path

from generate_video import generate_spotlight, generate_top5, generate_breaking
from upload_youtube import upload_video as youtube_upload
from upload_tiktok import upload_video as tiktok_upload


def main():
    parser = argparse.ArgumentParser(
        description="PhenoMap Video Pipeline — Generate + Upload",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_pipeline.py --style spotlight --sighting-id 1 --youtube
  python run_pipeline.py --style top5 --youtube --tiktok
  python run_pipeline.py --style breaking --sighting-id 26 --youtube --privacy public
        """,
    )

    # Generation options
    parser.add_argument("--style", choices=["spotlight", "top5", "breaking"],
                        default="spotlight", help="Video style")
    parser.add_argument("--sighting-id", type=int, default=1,
                        help="Sighting ID (for spotlight/breaking)")
    parser.add_argument("--ids", nargs="+", type=int,
                        help="Sighting IDs (for top5)")
    parser.add_argument("--audio", type=str, default=None,
                        help="Background audio file path")

    # Upload options
    parser.add_argument("--youtube", action="store_true", help="Upload to YouTube")
    parser.add_argument("--tiktok", action="store_true", help="Upload to TikTok")
    parser.add_argument("--privacy", choices=["private", "unlisted", "public"],
                        default="private", help="YouTube privacy (default: private)")
    parser.add_argument("--title", type=str, default=None,
                        help="Custom video title")
    parser.add_argument("--caption", type=str, default=None,
                        help="Custom TikTok caption")

    args = parser.parse_args()

    # --- Step 1: Generate ---
    print("=" * 60)
    print("PHENOMAP VIDEO PIPELINE")
    print("=" * 60)
    print(f"\n[1/3] Generating {args.style} video...\n")

    video_path = None
    if args.style == "spotlight":
        video_path = generate_spotlight(args.sighting_id)
    elif args.style == "top5":
        video_path = generate_top5(args.ids)
    elif args.style == "breaking":
        video_path = generate_breaking(args.sighting_id)

    if not video_path:
        print("ERROR: Video generation failed.")
        sys.exit(1)

    print(f"\nVideo generated: {video_path}")

    # --- Step 2: Upload to YouTube ---
    youtube_id = None
    if args.youtube:
        print(f"\n[2/3] Uploading to YouTube ({args.privacy})...\n")
        youtube_id = youtube_upload(
            file_path=video_path,
            title=args.title,
            privacy=args.privacy,
        )
        if youtube_id:
            print(f"YouTube: https://www.youtube.com/watch?v={youtube_id}")
        else:
            print("WARNING: YouTube upload failed.")
    else:
        print("\n[2/3] YouTube upload skipped (use --youtube to enable)")

    # --- Step 3: Upload to TikTok ---
    tiktok_id = None
    if args.tiktok:
        print(f"\n[3/3] Uploading to TikTok...\n")
        tiktok_id = tiktok_upload(
            file_path=video_path,
            caption=args.caption,
        )
        if tiktok_id:
            print(f"TikTok publish ID: {tiktok_id}")
        else:
            print("WARNING: TikTok upload failed.")
    else:
        print("\n[3/3] TikTok upload skipped (use --tiktok to enable)")

    # --- Summary ---
    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)
    print(f"Video file:  {video_path}")
    if youtube_id:
        print(f"YouTube:     https://www.youtube.com/watch?v={youtube_id}")
    if tiktok_id:
        print(f"TikTok:      Published (ID: {tiktok_id})")
    if not args.youtube and not args.tiktok:
        print("Upload:      None (use --youtube and/or --tiktok)")
    print()


if __name__ == "__main__":
    main()
