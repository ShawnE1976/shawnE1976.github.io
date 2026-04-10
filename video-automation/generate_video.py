#!/usr/bin/env python3
"""
PhenoMap Video Generator
Generates vertical (9:16) videos from UAP sighting data for TikTok/YouTube Shorts/Reels.

Video types:
  - spotlight: Single sighting deep-dive (default)
  - top5:      Top 5 sightings compilation
  - breaking:  Breaking news style for new sightings

Usage:
  python generate_video.py --style spotlight --sighting-id 1
  python generate_video.py --style top5
  python generate_video.py --style breaking --sighting-id 26
"""
import argparse
import math
import textwrap
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    ImageClip,
    concatenate_videoclips,
    CompositeVideoClip,
    AudioFileClip,
    ColorClip,
)

import config
from sighting_data import SIGHTINGS


# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

def get_font(size, bold=False):
    """Load a TrueType font, falling back to Pillow's default."""
    path = config.FONT_BOLD if bold else config.FONT_REGULAR
    try:
        return ImageFont.truetype(path, size)
    except (OSError, IOError):
        # Try common system fonts
        for fallback in [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold
            else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ]:
            try:
                return ImageFont.truetype(fallback, size)
            except (OSError, IOError):
                continue
        return ImageFont.load_default()


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def draw_rounded_rect(draw, xy, radius, fill, outline=None):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline)


def draw_status_badge(draw, x, y, status):
    """Draw a VERIFIED / PENDING badge."""
    is_verified = status == "verified"
    label = "VERIFIED" if is_verified else "PENDING"
    color = config.ACCENT_COLOR if is_verified else config.YELLOW_ACCENT
    font = get_font(28, bold=True)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    padding = 16
    draw_rounded_rect(
        draw,
        (x, y, x + tw + padding * 2, y + th + padding),
        radius=8,
        fill=(*color, 40),
        outline=color,
    )
    draw.text((x + padding, y + padding // 2), label, fill=color, font=font)
    return tw + padding * 2 + 12  # return width for chaining


def draw_source_badge(draw, x, y, source):
    """Draw a source badge (GOV / MIL / CIVILIAN / AARO)."""
    labels = {"gov": "GOVERNMENT", "mil": "MILITARY", "civilian": "CIVILIAN", "aaro": "AARO"}
    label = labels.get(source, source.upper())
    font = get_font(24, bold=True)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    padding = 12
    draw_rounded_rect(
        draw,
        (x, y, x + tw + padding * 2, y + th + padding),
        radius=8,
        fill=(255, 255, 255, 15),
        outline=config.BORDER_COLOR,
    )
    draw.text((x + padding, y + padding // 2), label, fill=config.SECONDARY_TEXT, font=font)


def wrap_text(text, font, max_width, draw):
    """Word-wrap text to fit within max_width pixels."""
    words = text.split()
    lines = []
    current_line = ""
    for word in words:
        test = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    return lines


# ---------------------------------------------------------------------------
# Frame renderers
# ---------------------------------------------------------------------------

def render_intro_frame(title_text, subtitle_text):
    """Render a branded intro frame."""
    img = Image.new("RGBA", (config.VIDEO_WIDTH, config.VIDEO_HEIGHT), config.BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Decorative grid lines
    for i in range(0, config.VIDEO_HEIGHT, 60):
        draw.line([(0, i), (config.VIDEO_WIDTH, i)], fill=(*config.BORDER_COLOR, 30), width=1)
    for i in range(0, config.VIDEO_WIDTH, 60):
        draw.line([(i, 0), (i, config.VIDEO_HEIGHT)], fill=(*config.BORDER_COLOR, 30), width=1)

    # Scanning line effect
    scan_y = config.VIDEO_HEIGHT // 3
    draw.rectangle(
        [(0, scan_y - 2), (config.VIDEO_WIDTH, scan_y + 2)],
        fill=(*config.ACCENT_COLOR, 60),
    )

    # PhenoMap logo text
    logo_font = get_font(36, bold=True)
    draw.text((config.VIDEO_WIDTH // 2, 300), "PHENOMAP", fill=config.ACCENT_COLOR,
              font=logo_font, anchor="mm")

    # Subtitle
    sub_font = get_font(24)
    draw.text((config.VIDEO_WIDTH // 2, 350), "GLOBAL UAP INTELLIGENCE",
              fill=config.SECONDARY_TEXT, font=sub_font, anchor="mm")

    # Horizontal divider
    div_y = 400
    draw.line([(100, div_y), (config.VIDEO_WIDTH - 100, div_y)],
              fill=config.ACCENT_COLOR, width=2)

    # Main title
    title_font = get_font(64, bold=True)
    lines = wrap_text(title_text, title_font, config.VIDEO_WIDTH - 120, draw)
    y = config.VIDEO_HEIGHT // 2 - len(lines) * 40
    for line in lines:
        draw.text((config.VIDEO_WIDTH // 2, y), line, fill=config.TEXT_COLOR,
                  font=title_font, anchor="mm")
        y += 80

    # Subtitle below
    if subtitle_text:
        sub2_font = get_font(32)
        draw.text((config.VIDEO_WIDTH // 2, y + 30), subtitle_text,
                  fill=config.SECONDARY_TEXT, font=sub2_font, anchor="mm")

    # Bottom branding
    brand_font = get_font(22)
    draw.text((config.VIDEO_WIDTH // 2, config.VIDEO_HEIGHT - 120),
              "shawne1976.github.io", fill=config.SECONDARY_TEXT,
              font=brand_font, anchor="mm")

    return img


def render_sighting_frame(sighting, frame_num=0):
    """Render a sighting detail card as a full frame."""
    img = Image.new("RGBA", (config.VIDEO_WIDTH, config.VIDEO_HEIGHT), config.BG_COLOR)
    draw = ImageDraw.Draw(img)

    margin = 60
    content_width = config.VIDEO_WIDTH - margin * 2

    # Subtle grid background
    for i in range(0, config.VIDEO_HEIGHT, 80):
        draw.line([(0, i), (config.VIDEO_WIDTH, i)], fill=(*config.BORDER_COLOR, 20), width=1)

    # Top bar — PhenoMap
    bar_font = get_font(22, bold=True)
    draw.text((margin, 60), "PHENOMAP", fill=config.ACCENT_COLOR, font=bar_font)
    draw.text((config.VIDEO_WIDTH - margin, 60), "UAP INTELLIGENCE",
              fill=config.SECONDARY_TEXT, font=get_font(18), anchor="ra")

    # Horizontal line
    draw.line([(margin, 100), (config.VIDEO_WIDTH - margin, 100)],
              fill=config.BORDER_COLOR, width=1)

    # --- CLASSIFIED / DATE header ---
    y = 140
    date_font = get_font(28)
    draw.text((margin, y), sighting["date"], fill=config.ACCENT_COLOR, font=date_font)

    # Status + source badges
    badge_x = margin
    y += 50
    w = draw_status_badge(draw, badge_x, y, sighting["status"])
    draw_source_badge(draw, badge_x + w, y, sighting["source"])

    # --- Title ---
    y += 80
    title_font = get_font(52, bold=True)
    title_lines = wrap_text(sighting["title"], title_font, content_width, draw)
    for line in title_lines:
        draw.text((margin, y), line, fill=config.TEXT_COLOR, font=title_font)
        y += 65

    # --- Location ---
    y += 20
    loc_font = get_font(30)
    draw.text((margin, y), f"Location: {sighting['location']}", fill=config.SECONDARY_TEXT, font=loc_font)

    # --- Main card ---
    y += 60
    card_top = y
    card_bottom = card_top + 500
    draw_rounded_rect(
        draw,
        (margin - 10, card_top, config.VIDEO_WIDTH - margin + 10, card_bottom),
        radius=16,
        fill=config.CARD_BG,
        outline=config.BORDER_COLOR,
    )

    # Card content — description
    y = card_top + 30
    desc_font = get_font(28)
    desc_lines = wrap_text(sighting["description"], desc_font, content_width - 40, draw)
    for line in desc_lines[:8]:  # max 8 lines
        draw.text((margin + 20, y), line, fill=config.TEXT_COLOR, font=desc_font)
        y += 38

    # Divider inside card
    y += 15
    draw.line([(margin + 20, y), (config.VIDEO_WIDTH - margin - 20, y)],
              fill=config.BORDER_COLOR, width=1)
    y += 20

    # Metadata rows
    meta_font = get_font(26)
    meta_items = [
        ("Shape", sighting.get("shape", "Unknown")),
        ("Duration", sighting.get("duration", "Unknown")),
        ("Witnesses", sighting.get("witnesses", "Unknown")),
    ]
    for label, value in meta_items:
        draw.text((margin + 20, y), f"{label}:", fill=config.ACCENT_COLOR, font=meta_font)
        draw.text((margin + 180, y), value, fill=config.TEXT_COLOR, font=meta_font)
        y += 36

    # --- Gov reference ---
    y = card_bottom + 30
    ref_font = get_font(22)
    ref = sighting.get("gov_ref", "")
    if ref:
        draw.text((margin, y), "Source:", fill=config.ACCENT_COLOR, font=ref_font)
        ref_lines = wrap_text(ref, ref_font, content_width - 100, draw)
        for line in ref_lines[:2]:
            y += 28
            draw.text((margin + 90, y - 28), line, fill=config.SECONDARY_TEXT, font=ref_font)

    # --- Coordinate display (bottom) ---
    coord_font = get_font(24)
    coord_text = f"{sighting['lat']:.4f}N, {abs(sighting['lng']):.4f}W"
    draw.text((config.VIDEO_WIDTH // 2, config.VIDEO_HEIGHT - 180), coord_text,
              fill=config.ACCENT_COLOR, font=coord_font, anchor="mm")

    # Bottom branding
    brand_font = get_font(20)
    draw.text((config.VIDEO_WIDTH // 2, config.VIDEO_HEIGHT - 120),
              "PhenoMap — Global UAP Intelligence", fill=config.SECONDARY_TEXT,
              font=brand_font, anchor="mm")
    draw.text((config.VIDEO_WIDTH // 2, config.VIDEO_HEIGHT - 80),
              "shawne1976.github.io", fill=(*config.ACCENT_COLOR, 180),
              font=brand_font, anchor="mm")

    return img


def render_outro_frame():
    """Render an outro/CTA frame."""
    img = Image.new("RGBA", (config.VIDEO_WIDTH, config.VIDEO_HEIGHT), config.BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Grid
    for i in range(0, config.VIDEO_HEIGHT, 60):
        draw.line([(0, i), (config.VIDEO_WIDTH, i)], fill=(*config.BORDER_COLOR, 30), width=1)

    center_y = config.VIDEO_HEIGHT // 2

    # Logo
    logo_font = get_font(48, bold=True)
    draw.text((config.VIDEO_WIDTH // 2, center_y - 200), "PHENOMAP",
              fill=config.ACCENT_COLOR, font=logo_font, anchor="mm")

    # Tagline
    tag_font = get_font(32)
    draw.text((config.VIDEO_WIDTH // 2, center_y - 130),
              "Global UAP Intelligence Platform",
              fill=config.TEXT_COLOR, font=tag_font, anchor="mm")

    # Divider
    draw.line([(200, center_y - 80), (config.VIDEO_WIDTH - 200, center_y - 80)],
              fill=config.ACCENT_COLOR, width=2)

    # CTA items
    cta_font = get_font(30)
    ctas = [
        "Follow for more UAP intelligence",
        "Like if you want the truth",
        "Comment your sighting below",
    ]
    y = center_y - 30
    for cta in ctas:
        draw.text((config.VIDEO_WIDTH // 2, y), cta,
                  fill=config.TEXT_COLOR, font=cta_font, anchor="mm")
        y += 50

    # URL
    url_font = get_font(28, bold=True)
    draw.text((config.VIDEO_WIDTH // 2, center_y + 160),
              "shawne1976.github.io",
              fill=config.ACCENT_COLOR, font=url_font, anchor="mm")

    # Bottom
    small_font = get_font(20)
    draw.text((config.VIDEO_WIDTH // 2, config.VIDEO_HEIGHT - 100),
              "Free tier available — Pro & Premium for full access",
              fill=config.SECONDARY_TEXT, font=small_font, anchor="mm")

    return img


def render_countdown_number(number, total, sighting_title):
    """Render a big countdown number frame for top-N videos."""
    img = Image.new("RGBA", (config.VIDEO_WIDTH, config.VIDEO_HEIGHT), config.BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Grid bg
    for i in range(0, config.VIDEO_HEIGHT, 80):
        draw.line([(0, i), (config.VIDEO_WIDTH, i)], fill=(*config.BORDER_COLOR, 20), width=1)

    center_y = config.VIDEO_HEIGHT // 2

    # Big number
    num_font = get_font(200, bold=True)
    draw.text((config.VIDEO_WIDTH // 2, center_y - 80), f"#{number}",
              fill=config.ACCENT_COLOR, font=num_font, anchor="mm")

    # Title preview
    title_font = get_font(36, bold=True)
    lines = wrap_text(sighting_title, title_font, config.VIDEO_WIDTH - 120, draw)
    y = center_y + 80
    for line in lines[:2]:
        draw.text((config.VIDEO_WIDTH // 2, y), line,
                  fill=config.TEXT_COLOR, font=title_font, anchor="mm")
        y += 50

    return img


# ---------------------------------------------------------------------------
# Video assembly
# ---------------------------------------------------------------------------

def frames_to_video(frames, durations, output_path, audio_path=None):
    """Convert PIL frames to a video file using moviepy."""
    clips = []
    for frame, dur in zip(frames, durations):
        # Convert RGBA to RGB for video
        rgb = frame.convert("RGB")
        temp_path = str(config.OUTPUT_DIR / f"_temp_frame_{len(clips)}.png")
        rgb.save(temp_path)
        clip = ImageClip(temp_path, duration=dur)
        clips.append(clip)

    final = concatenate_videoclips(clips, method="compose")

    if audio_path and Path(audio_path).exists():
        audio = AudioFileClip(audio_path)
        if audio.duration < final.duration:
            # Loop audio
            loops_needed = math.ceil(final.duration / audio.duration)
            from moviepy import concatenate_audioclips
            audio = concatenate_audioclips([audio] * loops_needed)
        audio = audio.with_duration(final.duration)
        final = final.with_audio(audio)

    final.write_videofile(
        str(output_path),
        fps=config.FPS,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        logger="bar",
    )

    # Clean temp frames
    for i in range(len(clips)):
        temp = config.OUTPUT_DIR / f"_temp_frame_{i}.png"
        if temp.exists():
            temp.unlink()

    print(f"\nVideo saved: {output_path}")
    return output_path


# ---------------------------------------------------------------------------
# Video styles
# ---------------------------------------------------------------------------

def generate_spotlight(sighting_id):
    """Generate a spotlight video for a single sighting."""
    sighting = next((s for s in SIGHTINGS if s["id"] == sighting_id), None)
    if not sighting:
        print(f"Sighting ID {sighting_id} not found.")
        return None

    print(f"Generating spotlight video: {sighting['title']}")

    frames = [
        render_intro_frame("UAP SPOTLIGHT", sighting["title"]),
        render_sighting_frame(sighting),
        render_outro_frame(),
    ]
    durations = [3, config.DURATION_PER_SLIDE + 2, 4]

    safe_title = sighting["title"].replace(" ", "_").replace("'", "")[:40]
    output_path = config.OUTPUT_DIR / f"spotlight_{safe_title}_{datetime.now():%Y%m%d}.mp4"
    return frames_to_video(frames, durations, output_path)


def generate_top5(sighting_ids=None):
    """Generate a Top 5 countdown video."""
    if sighting_ids:
        selected = [s for s in SIGHTINGS if s["id"] in sighting_ids]
    else:
        # Default: pick 5 verified government/military sightings
        verified = [s for s in SIGHTINGS if s["status"] == "verified"]
        selected = verified[:5]

    selected = selected[:5]  # cap at 5
    print(f"Generating Top 5 video with: {[s['title'] for s in selected]}")

    frames = [render_intro_frame("TOP 5", "Most Compelling UAP Encounters")]
    durations = [3]

    for i, sighting in enumerate(reversed(selected)):
        rank = len(selected) - i
        frames.append(render_countdown_number(rank, len(selected), sighting["title"]))
        durations.append(2)
        frames.append(render_sighting_frame(sighting, frame_num=i))
        durations.append(config.DURATION_PER_SLIDE)

    frames.append(render_outro_frame())
    durations.append(4)

    output_path = config.OUTPUT_DIR / f"top5_uap_{datetime.now():%Y%m%d}.mp4"
    return frames_to_video(frames, durations, output_path)


def generate_breaking(sighting_id):
    """Generate a breaking-news style video for a sighting."""
    sighting = next((s for s in SIGHTINGS if s["id"] == sighting_id), None)
    if not sighting:
        print(f"Sighting ID {sighting_id} not found.")
        return None

    print(f"Generating BREAKING video: {sighting['title']}")

    frames = [
        render_intro_frame("BREAKING", "NEW UAP INTELLIGENCE"),
        render_sighting_frame(sighting),
        render_outro_frame(),
    ]
    durations = [2.5, config.DURATION_PER_SLIDE + 3, 3.5]

    safe_title = sighting["title"].replace(" ", "_").replace("'", "")[:40]
    output_path = config.OUTPUT_DIR / f"breaking_{safe_title}_{datetime.now():%Y%m%d}.mp4"
    return frames_to_video(frames, durations, output_path)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="PhenoMap Video Generator")
    parser.add_argument("--style", choices=["spotlight", "top5", "breaking"],
                        default="spotlight", help="Video style")
    parser.add_argument("--sighting-id", type=int, default=1,
                        help="Sighting ID for spotlight/breaking")
    parser.add_argument("--ids", nargs="+", type=int,
                        help="List of sighting IDs for top5")
    parser.add_argument("--audio", type=str, default=None,
                        help="Path to background audio file (mp3/wav)")
    args = parser.parse_args()

    if args.style == "spotlight":
        result = generate_spotlight(args.sighting_id)
    elif args.style == "top5":
        result = generate_top5(args.ids)
    elif args.style == "breaking":
        result = generate_breaking(args.sighting_id)

    if result:
        print(f"\nDone! Video: {result}")
        print("Next: Upload with upload_youtube.py or upload_tiktok.py")


if __name__ == "__main__":
    main()
