#!/usr/bin/env python3
"""
Instagram Video Organizer
=========================
Scans Apple Photos for downloaded/saved Instagram videos, extracts frames,
analyzes them with AI vision, categorizes, and uploads to Google Drive.

Requirements: macOS, Python 3.10+, ffmpeg, rclone
Optionally: Anthropic API key (for Claude vision) OR ollama + llava (local)
Run setup.sh first to install all dependencies.
"""

import os
import sys
import json
import glob
import shutil
import base64
import subprocess
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIGURATION — Edit these to customize behavior
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MONTHS_TO_SCAN = 6
RCLONE_REMOTE = "gdrive"
DRIVE_BASE_FOLDER = "Instagram Videos"
FRAMES_PER_VIDEO = 4          # Number of frames to extract per video
WHISPER_MODEL = "base"        # Whisper model size: tiny, base, small, medium

# AI backend for categorization: "claude" (best) or "ollama" (free/local)
AI_BACKEND = "claude"
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"
OLLAMA_MODEL = "llava"        # Vision model for Ollama (llava can see images)
OLLAMA_TEXT_MODEL = "llama3.1" # Text-only fallback

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MECE CATEGORY STRUCTURE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CATEGORIES = {
    "E-Commerce & Online Selling": {
        "description": (
            "Dropshipping, Shopify stores, Amazon FBA, product sourcing, "
            "TikTok Shop, print-on-demand, online arbitrage, digital products, "
            "supplier tips, e-commerce platforms, online store strategies"
        ),
        "subfolder": "01 - E-Commerce & Online Selling",
    },
    "AI Tools & Technology": {
        "description": (
            "ChatGPT, AI tools, automation workflows, AI news & breakthroughs, "
            "software tutorials, apps, coding, no-code tools, tech gadgets, "
            "machine learning, AI for business"
        ),
        "subfolder": "02 - AI Tools & Technology",
    },
    "Awakening & Manifestation": {
        "description": (
            "Law of attraction, manifesting, spiritual awakening, consciousness, "
            "meditation, visualization, affirmations, energy work, "
            "higher self, universe/source, vibration, quantum manifestation"
        ),
        "subfolder": "03 - Awakening & Manifestation",
    },
    "Business Ideas & Entrepreneurship": {
        "description": (
            "Startup ideas, side hustles, passive income, freelancing, "
            "business models, making money online (general), agency building, "
            "real estate investing, flipping, service businesses"
        ),
        "subfolder": "04 - Business Ideas & Entrepreneurship",
    },
    "Marketing & Content Creation": {
        "description": (
            "Social media growth, content strategy, Instagram/TikTok/YouTube tips, "
            "branding, ads, copywriting, funnels, email marketing, "
            "influencer strategies, audience building, SEO"
        ),
        "subfolder": "05 - Marketing & Content Creation",
    },
    "Personal Development & Mindset": {
        "description": (
            "Productivity, discipline, habits, goal setting, motivation, "
            "self-improvement, stoicism, confidence, leadership, "
            "health & fitness for performance, morning routines, reading"
        ),
        "subfolder": "06 - Personal Development & Mindset",
    },
    "Finance & Investing": {
        "description": (
            "Stocks, crypto, real estate investing, budgeting, saving, "
            "financial literacy, tax strategies, credit, wealth building, "
            "trading, index funds, retirement"
        ),
        "subfolder": "07 - Finance & Investing",
    },
    "Lifestyle & Other": {
        "description": (
            "Travel, cooking, fashion, entertainment, relationships, fitness, "
            "humor, culture, anything that doesn't clearly fit the categories above"
        ),
        "subfolder": "08 - Lifestyle & Other",
    },
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PREFLIGHT CHECKS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def check_macos():
    if sys.platform != "darwin":
        print("ERROR: This script requires macOS for Apple Photos access.")
        print("Please run this on your MacBook.")
        sys.exit(1)


def check_command(name, install_hint):
    if shutil.which(name) is None:
        print(f"ERROR: '{name}' is not installed.")
        print(f"  Install it with: {install_hint}")
        sys.exit(1)


def check_python_package(package, pip_name=None):
    try:
        __import__(package)
    except ImportError:
        pip_name = pip_name or package
        print(f"ERROR: Python package '{pip_name}' is not installed.")
        print(f"  Install it with: pip install {pip_name}")
        sys.exit(1)


def check_claude_api():
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        # Check if there's a .env file
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            with open(env_path) as f:
                for line in f:
                    if line.strip().startswith("ANTHROPIC_API_KEY="):
                        key = line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                        os.environ["ANTHROPIC_API_KEY"] = key
                        break

    if not key:
        print("WARNING: ANTHROPIC_API_KEY not set.")
        print("  Claude vision (best quality) won't be available.")
        print("  Falling back to Ollama for categorization.")
        print()
        print("  To use Claude, either:")
        print("    export ANTHROPIC_API_KEY='your-key-here'")
        print(f"    Or create a .env file in {os.path.dirname(__file__)}/.env")
        print()
        return False
    return True


def check_ollama_running():
    import requests

    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        if resp.status_code != 200:
            raise Exception("bad status")
        return True
    except Exception:
        return False


def check_rclone_remote():
    result = subprocess.run(
        ["rclone", "listremotes"], capture_output=True, text=True
    )
    remotes = result.stdout.strip().split("\n")
    if f"{RCLONE_REMOTE}:" not in remotes:
        print(f"ERROR: rclone remote '{RCLONE_REMOTE}' not configured.")
        print("  Run: rclone config")
        print(f"  Create a new remote named '{RCLONE_REMOTE}' with type 'drive' (Google Drive)")
        sys.exit(1)


def run_preflight():
    global AI_BACKEND

    print("Running preflight checks...")
    check_macos()
    check_command("ffmpeg", "brew install ffmpeg")
    check_command("rclone", "brew install rclone")
    check_python_package("osxphotos")
    check_python_package("requests")

    # Determine best available AI backend
    has_claude = check_claude_api()
    has_ollama = check_ollama_running()

    if AI_BACKEND == "claude" and has_claude:
        check_python_package("anthropic")
        print("  AI backend: Claude API (vision + text)")
    elif has_ollama:
        AI_BACKEND = "ollama"
        print(f"  AI backend: Ollama (local)")
    else:
        print("ERROR: No AI backend available.")
        print("  Either set ANTHROPIC_API_KEY for Claude, or start Ollama (ollama serve)")
        sys.exit(1)

    check_python_package("whisper", "openai-whisper")
    print("  Audio transcription: Whisper (local)")

    check_rclone_remote()
    print("  All checks passed!\n")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1: SCAN APPLE PHOTOS FOR INSTAGRAM VIDEOS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def scan_photos():
    import osxphotos

    print(f"Scanning Apple Photos for videos from the last {MONTHS_TO_SCAN} months...")
    print("(macOS may ask for Photos access permission — click Allow)\n")

    photosdb = osxphotos.PhotosDB()
    cutoff = datetime.now() - timedelta(days=MONTHS_TO_SCAN * 30)

    all_photos = photosdb.photos()
    videos = [
        p for p in all_photos
        if p.ismovie and p.date.replace(tzinfo=None) >= cutoff
    ]
    print(f"  Found {len(videos)} total videos in the last {MONTHS_TO_SCAN} months")

    # Separate into high-confidence Instagram and possible Instagram
    instagram_confident = []
    instagram_possible = []
    non_instagram = []

    for v in videos:
        confidence = detect_instagram_confidence(v)
        if confidence == "high":
            instagram_confident.append(v)
        elif confidence == "medium":
            instagram_possible.append(v)
        else:
            non_instagram.append(v)

    # Count screen recordings vs downloads in possible matches
    screen_recs = sum(1 for v in instagram_possible if getattr(v, "screenshot", False)
                      or (v.original_filename or v.filename or "").lower().startswith("rpreplay"))
    downloads = len(instagram_possible) - screen_recs

    print(f"  High-confidence Instagram videos: {len(instagram_confident)}")
    print(f"  Possible Instagram videos: {len(instagram_possible)}", end="")
    if instagram_possible:
        parts = []
        if screen_recs:
            parts.append(f"{screen_recs} screen recordings")
        if downloads:
            parts.append(f"{downloads} downloads")
        print(f"  ({', '.join(parts)})")
    else:
        print()
    print(f"  Other videos (personal recordings, etc.): {len(non_instagram)}")
    print()

    return instagram_confident, instagram_possible, non_instagram


def detect_instagram_confidence(photo):
    """
    Detect if a video was downloaded/screen-recorded from Instagram.
    Returns: 'high', 'medium', or 'low'

    Two main sources of Instagram videos in a camera roll:
    1. Downloads: Saved from Instagram app or browser. These have NO camera
       EXIF, NO GPS, are vertical 9:16, and often exactly 1080x1920.
    2. Screen recordings: iOS screen recordings while watching Instagram.
       Filenames start with "RPReplay", marked as screenshot by iOS, vertical.

    Personal recordings (shot with the phone camera) have camera EXIF and
    GPS and should always be 'low'.
    """
    # ── TIER 1: Explicit Instagram metadata → instant high confidence ──
    fname = (photo.original_filename or photo.filename or "").lower()
    if any(p in fname for p in ["instagram", "insta", "reel", "ig_", "ig-"]):
        return "high"

    for field in [photo.description, photo.title]:
        if field and any(w in field.lower() for w in ["instagram", "reel", "ig"]):
            return "high"

    for kw in photo.keywords or []:
        if any(w in kw.lower() for w in ["instagram", "reel"]):
            return "high"

    for label in photo.labels or []:
        if "instagram" in label.lower():
            return "high"

    # ── Gather video properties ──

    # Screen recording detection (iOS marks these, filenames start with RPReplay)
    is_screen_recording = getattr(photo, "screenshot", False)
    if not is_screen_recording:
        if fname.startswith("rpreplay") or "screen recording" in fname or "screen_recording" in fname:
            is_screen_recording = True

    # Vertical aspect ratio (9:16 portrait, typical for reels/stories)
    is_vertical = False
    if photo.width and photo.height and photo.height > photo.width:
        ratio = photo.height / photo.width
        if 1.5 <= ratio <= 2.2:
            is_vertical = True

    # Duration
    duration = getattr(photo, "duration", None) or 0
    is_short = 3 <= duration <= 90        # Typical reel length
    is_medium_len = 90 < duration <= 180  # Longer reels / multi-story

    # Camera EXIF — personal recordings have this, downloads don't
    has_camera = False
    try:
        exif = getattr(photo, "exif_info", None)
        if exif:
            if getattr(exif, "camera_make", None) or getattr(exif, "camera_model", None):
                has_camera = True
    except Exception:
        pass

    # GPS location — personal recordings often have this, downloads don't
    has_location = False
    try:
        loc = getattr(photo, "location", None)
        if loc and loc[0] is not None and loc[1] is not None:
            has_location = True
    except Exception:
        pass

    # Instagram-typical video resolutions
    is_insta_resolution = False
    if photo.width and photo.height:
        w, h = photo.width, photo.height
        insta_resolutions = [
            (1080, 1920),  # Standard reel / story (9:16)
            (1080, 1350),  # Portrait post (4:5)
            (720, 1280),   # Lower quality reel
        ]
        for iw, ih in insta_resolutions:
            if abs(w - iw) <= 10 and abs(h - ih) <= 10:
                is_insta_resolution = True
                break

    # ── TIER 2: Screen recording of short vertical content ──
    # A short vertical screen recording is likely a saved Instagram reel/story.
    # Longer screen recordings (tutorials, meetings, games) are filtered out.
    if is_screen_recording and is_vertical and (is_short or is_medium_len):
        return "medium"

    # ── TIER 3: Downloaded video with Instagram-specific resolution ──
    # Require the exact Instagram encoding resolution to distinguish from
    # WhatsApp, iMessage, Snapchat, and other received videos.
    # Instagram always encodes at 1080x1920 (reels/stories), 1080x1350
    # (portrait posts), or 720x1280 (lower quality).
    if not has_camera and is_insta_resolution:
        return "medium"

    # ── Everything else → low confidence (personal recordings, etc.) ──
    return "low"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2: INTERACTIVE VIDEO SELECTION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def select_videos(confident, possible, others):
    """Let user choose which videos to process."""
    selected = list(confident)  # Always include high-confidence

    if possible:
        print(f"\nFound {len(possible)} videos that MIGHT be from Instagram:")
        for i, v in enumerate(possible, 1):
            name = v.original_filename or v.filename
            date_str = v.date.strftime("%Y-%m-%d")
            dur = f"{v.duration:.0f}s" if hasattr(v, "duration") and v.duration else "?"
            dims = f"{v.width}x{v.height}" if v.width and v.height else "?"
            # Show detection reason
            is_sr = getattr(v, "screenshot", False) or (name or "").lower().startswith("rpreplay")
            tag = "screen rec" if is_sr else "download"
            print(f"  {i}. {name}  ({date_str}, {dur}, {dims}, {tag})")

        print()
        resp = input("Include these possible Instagram videos? [yes/no/pick]: ").strip().lower()
        if resp in ("yes", "y"):
            selected.extend(possible)
        elif resp == "pick":
            nums = input("Enter numbers to include (comma-separated, e.g. 1,3,5): ").strip()
            for n in nums.split(","):
                try:
                    idx = int(n.strip()) - 1
                    if 0 <= idx < len(possible):
                        selected.append(possible[idx])
                except ValueError:
                    pass

    if others and not selected:
        print("\nNo Instagram videos detected. Want to scan ALL recent videos instead?")
        resp = input("Process all videos? [yes/no]: ").strip().lower()
        if resp in ("yes", "y"):
            selected = list(confident) + list(possible) + list(others)

    return selected


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3: EXPORT VIDEOS FROM PHOTOS LIBRARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def export_videos(photos_list, export_dir):
    print(f"\nExporting {len(photos_list)} videos...\n")

    exported = []
    for i, photo in enumerate(photos_list, 1):
        name = photo.original_filename or photo.filename
        print(f"  [{i}/{len(photos_list)}] {name}...", end=" ")

        try:
            paths = photo.export(export_dir)
            if paths:
                exported.append(
                    {
                        "exported_path": paths[0],
                        "filename": name,
                        "date": photo.date.isoformat(),
                        "uuid": photo.uuid,
                        "duration": getattr(photo, "duration", None),
                    }
                )
                print("OK")
            else:
                print("SKIPPED (file may be in iCloud — download it in Photos first)")
        except Exception as e:
            print(f"FAILED ({e})")

    print(f"\n  Exported {len(exported)}/{len(photos_list)} videos\n")
    return exported


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4: EXTRACT KEY FRAMES FROM VIDEOS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def extract_frames(videos, frames_dir):
    """Extract key frames from each video using ffmpeg."""
    print(f"Extracting {FRAMES_PER_VIDEO} frames per video...\n")

    for i, video in enumerate(videos, 1):
        video_path = video["exported_path"]
        name = video["filename"]
        print(f"  [{i}/{len(videos)}] {name}...", end=" ")

        # Create per-video frame directory
        safe_name = Path(name).stem.replace(" ", "_")[:50]
        vid_frames_dir = os.path.join(frames_dir, f"{i:03d}_{safe_name}")
        os.makedirs(vid_frames_dir, exist_ok=True)

        try:
            # Get video duration
            duration = video.get("duration")
            if not duration:
                probe = subprocess.run(
                    [
                        "ffprobe", "-v", "quiet",
                        "-show_entries", "format=duration",
                        "-of", "json", video_path,
                    ],
                    capture_output=True, text=True, timeout=30,
                )
                probe_data = json.loads(probe.stdout)
                duration = float(probe_data["format"]["duration"])

            # Calculate timestamps for evenly-spaced frames
            # Skip first/last 5% to avoid black frames
            start = duration * 0.05
            end = duration * 0.95
            if FRAMES_PER_VIDEO == 1:
                timestamps = [duration / 2]
            else:
                step = (end - start) / (FRAMES_PER_VIDEO - 1)
                timestamps = [start + step * j for j in range(FRAMES_PER_VIDEO)]

            frame_paths = []
            for j, ts in enumerate(timestamps):
                frame_path = os.path.join(vid_frames_dir, f"frame_{j:02d}.jpg")
                subprocess.run(
                    [
                        "ffmpeg", "-y", "-ss", str(ts),
                        "-i", video_path,
                        "-vframes", "1",
                        "-q:v", "2",  # High quality JPEG
                        frame_path,
                    ],
                    capture_output=True, timeout=30,
                )
                if os.path.exists(frame_path):
                    frame_paths.append(frame_path)

            video["frame_paths"] = frame_paths
            print(f"OK ({len(frame_paths)} frames)")

        except Exception as e:
            video["frame_paths"] = []
            print(f"FAILED ({e})")

    extracted = sum(1 for v in videos if v.get("frame_paths"))
    print(f"\n  Extracted frames for {extracted}/{len(videos)} videos\n")
    return videos


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5: TRANSCRIBE VIDEO AUDIO (OPTIONAL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def transcribe_videos(videos):
    """Transcribe audio using Whisper — this is the primary categorization signal."""
    import whisper

    print(f"Loading Whisper '{WHISPER_MODEL}' model...")
    print("(First run downloads the model file — this is a one-time download)\n")
    model = whisper.load_model(WHISPER_MODEL)

    print(f"Transcribing {len(videos)} videos...\n")

    for i, video in enumerate(videos, 1):
        print(f"  [{i}/{len(videos)}] {video['filename']}...", end=" ")

        try:
            result = model.transcribe(video["exported_path"])
            video["transcript"] = result["text"].strip()

            if result.get("segments"):
                video["duration_seconds"] = round(result["segments"][-1]["end"])

            char_count = len(video["transcript"])
            print(f"OK ({char_count} chars)")
        except Exception as e:
            video["transcript"] = ""
            print(f"FAILED ({e})")

    transcribed = sum(1 for v in videos if v.get("transcript"))
    print(f"\n  Transcribed {transcribed}/{len(videos)} videos\n")
    return videos


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6: CATEGORIZE USING AI VISION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def build_category_prompt():
    """Build the categorization prompt with category descriptions."""
    lines = []
    for name, info in CATEGORIES.items():
        lines.append(f"  - {name}: {info['description']}")
    return "\n".join(lines)


def encode_image_b64(path):
    """Read an image file and return base64-encoded string."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def categorize_with_claude(video, category_prompt):
    """Use Claude API with vision to categorize a video from its frames + transcript."""
    import anthropic

    client = anthropic.Anthropic()

    # Build message content with frames
    content = []

    # Add frames as images
    frames = video.get("frame_paths", [])
    if frames:
        content.append({
            "type": "text",
            "text": f"Here are {len(frames)} frames extracted from an Instagram video:"
        })
        for frame_path in frames[:4]:  # Max 4 frames
            img_b64 = encode_image_b64(frame_path)
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": img_b64,
                },
            })

    # Add transcript if available
    transcript = video.get("transcript", "")
    if transcript:
        content.append({
            "type": "text",
            "text": f"\nAudio transcript:\n\"{transcript[:3000]}\""
        })

    # Add categorization instruction
    content.append({
        "type": "text",
        "text": (
            "\n\nBased on the visual content and audio transcript above, "
            "categorize this Instagram video into ONE of these categories:\n\n"
            f"{category_prompt}\n\n"
            "Respond with ONLY a JSON object in this format:\n"
            '{"category": "Exact Category Name", "confidence": "high/medium/low", '
            '"reason": "Brief 1-sentence explanation"}'
        ),
    })

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=200,
        messages=[{"role": "user", "content": content}],
    )

    raw = response.content[0].text.strip()
    return parse_category_response(raw)


def categorize_with_ollama(video, category_prompt):
    """Use Ollama (llava for vision, llama for text-only) to categorize a video."""
    import requests

    frames = video.get("frame_paths", [])
    transcript = video.get("transcript", "")

    if frames:
        # Use llava (vision model) with the first frame
        img_b64 = encode_image_b64(frames[0])

        prompt = (
            "Look at this frame from an Instagram video.\n"
        )
        if transcript:
            prompt += f'\nAudio transcript: "{transcript[:2000]}"\n'
        prompt += (
            f"\nCategorize it into ONE of these categories:\n{category_prompt}\n\n"
            "Reply with ONLY the exact category name, nothing else."
        )

        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "images": [img_b64],
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=120,
        )
        raw = resp.json()["response"].strip()

    elif transcript:
        # Text-only fallback with llama
        prompt = (
            "You are categorizing an Instagram video based on its audio transcript.\n\n"
            f"Available categories:\n{category_prompt}\n\n"
            f'Video transcript:\n"{transcript[:2000]}"\n\n'
            "Which single category best fits this video? "
            "Reply with ONLY the exact category name from the list above, nothing else."
        )
        resp = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": OLLAMA_TEXT_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.1},
            },
            timeout=120,
        )
        raw = resp.json()["response"].strip()
    else:
        return "Lifestyle & Other", "low", "No frames or transcript available"

    matched = match_category_name(raw, list(CATEGORIES.keys()))
    return matched, "medium", ""


def parse_category_response(raw):
    """Parse the JSON response from Claude."""
    try:
        # Try to extract JSON from the response
        # Handle case where model wraps in markdown code block
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned
            cleaned = cleaned.rsplit("```", 1)[0].strip()
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

        data = json.loads(cleaned)
        category = data.get("category", "")
        confidence = data.get("confidence", "medium")
        reason = data.get("reason", "")

        # Validate category name
        matched = match_category_name(category, list(CATEGORIES.keys()))
        return matched, confidence, reason

    except (json.JSONDecodeError, KeyError):
        # Fallback: try to match the raw text
        matched = match_category_name(raw, list(CATEGORIES.keys()))
        return matched, "low", ""


def match_category_name(raw, valid_categories):
    """Match LLM output to the closest valid category name."""
    raw_lower = raw.lower().strip().strip('"').strip("'")

    # Exact match
    for cat in valid_categories:
        if cat.lower() == raw_lower:
            return cat

    # Partial/substring match
    for cat in valid_categories:
        if cat.lower() in raw_lower or raw_lower in cat.lower():
            return cat

    # Keyword overlap
    for cat in valid_categories:
        words = cat.lower().replace("&", "").replace("-", " ").split()
        matches = sum(1 for w in words if len(w) > 3 and w in raw_lower)
        if matches >= 2:
            return cat

    # Single strong keyword
    for cat in valid_categories:
        words = cat.lower().replace("&", "").replace("-", " ").split()
        if any(w in raw_lower for w in words if len(w) > 4):
            return cat

    return "Lifestyle & Other"


def categorize_videos(videos):
    """Categorize all videos using the configured AI backend."""
    print(f"Categorizing videos using {AI_BACKEND}...\n")

    category_prompt = build_category_prompt()
    valid_names = list(CATEGORIES.keys())

    for i, video in enumerate(videos, 1):
        frames = video.get("frame_paths", [])
        transcript = video.get("transcript", "")

        if not frames and not transcript:
            video["category"] = "Lifestyle & Other"
            video["confidence"] = "low"
            video["reason"] = "No visual or audio data available"
            print(f"  [{i}/{len(videos)}] {video['filename']} -> Lifestyle & Other (no data)")
            continue

        print(f"  [{i}/{len(videos)}] {video['filename']}...", end=" ")

        try:
            if AI_BACKEND == "claude":
                cat, conf, reason = categorize_with_claude(video, category_prompt)
            else:
                cat, conf, reason = categorize_with_ollama(video, category_prompt)

            video["category"] = cat
            video["confidence"] = conf
            video["reason"] = reason
            print(f"-> {cat} ({conf})")

        except Exception as e:
            video["category"] = "Lifestyle & Other"
            video["confidence"] = "low"
            video["reason"] = f"Error: {e}"
            print(f"FAILED ({e})")

    categorized = sum(
        1 for v in videos if v.get("category") != "Lifestyle & Other"
        or v.get("confidence") != "low"
    )
    print(f"\n  Categorized {categorized}/{len(videos)} videos\n")
    return videos


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7: DISPLAY RESULTS + INTERACTIVE REVIEW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def display_results(videos):
    print("=" * 70)
    print("  CATEGORIZATION RESULTS")
    print("=" * 70)

    by_category = {}
    for v in videos:
        cat = v.get("category", "Lifestyle & Other")
        by_category.setdefault(cat, []).append(v)

    for cat_name, cat_info in CATEGORIES.items():
        vids = by_category.get(cat_name, [])
        if not vids:
            continue
        print(f"\n  {cat_info['subfolder']}  ({len(vids)} videos)")
        print("  " + "-" * 50)
        for v in vids:
            t = v.get("transcript", "")
            preview = (t[:60] + "...") if len(t) > 60 else (t or "(no transcript)")
            dur = v.get("duration_seconds") or v.get("duration") or "?"
            if isinstance(dur, float):
                dur = f"{dur:.0f}"
            conf = v.get("confidence", "?")
            reason = v.get("reason", "")

            print(f"    {v['filename']}")
            print(f"      Date: {v['date'][:10]}  |  Duration: {dur}s  |  Confidence: {conf}")
            if reason:
                print(f"      Reason: {reason}")
            if preview != "(no transcript)":
                print(f"      Audio: {preview}")

    print("\n" + "=" * 70)
    total = len(videos)
    high_conf = sum(1 for v in videos if v.get("confidence") == "high")
    med_conf = sum(1 for v in videos if v.get("confidence") == "medium")
    low_conf = sum(1 for v in videos if v.get("confidence") == "low")
    print(f"  Total: {total}  |  High: {high_conf}  |  Medium: {med_conf}  |  Low: {low_conf}")
    print("=" * 70)


def interactive_review(videos):
    """Allow user to review and re-categorize low-confidence videos."""
    low_conf = [v for v in videos if v.get("confidence") == "low"]

    if not low_conf:
        return videos

    print(f"\n{len(low_conf)} video(s) have low confidence. Review them?")
    resp = input("[yes/no]: ").strip().lower()

    if resp not in ("yes", "y"):
        return videos

    cat_names = list(CATEGORIES.keys())
    cat_menu = "\n".join(f"  {i+1}. {name}" for i, name in enumerate(cat_names))

    for v in low_conf:
        print(f"\n  Video: {v['filename']}")
        print(f"  Current category: {v['category']}")
        t = v.get("transcript", "")
        if t:
            print(f"  Transcript preview: {t[:100]}...")
        print(f"\n  Categories:\n{cat_menu}")
        print(f"  0. Keep current ({v['category']})")

        choice = input("  Choose [0-8]: ").strip()
        try:
            idx = int(choice)
            if 1 <= idx <= len(cat_names):
                v["category"] = cat_names[idx - 1]
                v["confidence"] = "manual"
                print(f"  -> Changed to: {v['category']}")
            else:
                print(f"  -> Keeping: {v['category']}")
        except ValueError:
            print(f"  -> Keeping: {v['category']}")

    return videos


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 8: ORGANIZE LOCAL FILES INTO CATEGORY FOLDERS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def organize_local(videos, organized_dir):
    """Copy videos into category subfolders locally before uploading."""
    print("Organizing videos into category folders...\n")

    for cat_info in CATEGORIES.values():
        os.makedirs(os.path.join(organized_dir, cat_info["subfolder"]), exist_ok=True)

    for video in videos:
        cat = video.get("category", "Lifestyle & Other")
        subfolder = CATEGORIES.get(cat, {}).get("subfolder", "08 - Lifestyle & Other")
        src = video["exported_path"]
        dest = os.path.join(organized_dir, subfolder, os.path.basename(src))
        shutil.copy2(src, dest)
        video["organized_path"] = dest

    print("  Done organizing locally.\n")
    return videos


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 9: UPLOAD TO GOOGLE DRIVE VIA RCLONE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def upload_to_drive(organized_dir):
    """Upload the entire organized folder structure to Google Drive."""
    dest = f"{RCLONE_REMOTE}:{DRIVE_BASE_FOLDER}"
    print(f"Uploading to Google Drive ({dest}/)...\n")

    try:
        result = subprocess.run(
            [
                "rclone", "copy",
                organized_dir,
                dest,
                "--progress",
                "--transfers", "4",
            ],
            timeout=1800,  # 30 min timeout for large batches
        )
        if result.returncode == 0:
            print("\n  Upload complete!\n")
            return True
        else:
            print("\n  Upload had errors. Check the output above.\n")
            return False
    except subprocess.TimeoutExpired:
        print("\n  Upload timed out after 30 minutes.\n")
        return False
    except Exception as e:
        print(f"\n  Upload failed: {e}\n")
        return False


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 10: SAVE RESULTS TO JSON
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def save_results(videos, output_path):
    results = []
    for v in videos:
        results.append(
            {
                "filename": v["filename"],
                "date": v["date"],
                "category": v.get("category", "Lifestyle & Other"),
                "confidence": v.get("confidence", ""),
                "reason": v.get("reason", ""),
                "transcript": v.get("transcript", ""),
                "duration_seconds": v.get("duration_seconds") or v.get("duration"),
                "uuid": v.get("uuid", ""),
            }
        )

    data = {
        "scan_date": datetime.now().isoformat(),
        "ai_backend": AI_BACKEND,
        "categories_used": list(CATEGORIES.keys()),
        "videos": results,
    }
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"  Results saved to: {output_path}\n")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def main():
    print()
    print("=" * 70)
    print("  INSTAGRAM VIDEO ORGANIZER v2")
    print("  Scan -> Extract Frames -> Transcribe -> AI Vision -> Upload")
    print("=" * 70)
    print()

    # ── Preflight ──
    run_preflight()

    # ── Working directory ──
    work_dir = os.path.join(os.path.expanduser("~"), ".instagram-organizer")
    export_dir = os.path.join(work_dir, "exports")
    frames_dir = os.path.join(work_dir, "frames")
    organized_dir = os.path.join(work_dir, "organized")
    os.makedirs(export_dir, exist_ok=True)
    os.makedirs(frames_dir, exist_ok=True)
    os.makedirs(organized_dir, exist_ok=True)
    results_path = os.path.join(work_dir, "results.json")

    # ── Step 1: Scan Apple Photos ──
    confident, possible, others = scan_photos()

    if not confident and not possible and not others:
        print(f"No videos found in the last {MONTHS_TO_SCAN} months.")
        return

    if not confident and not possible:
        print("No Instagram videos detected automatically.")
        print(f"But found {len(others)} other videos.\n")

    # ── Step 2: Interactive selection ──
    selected = select_videos(confident, possible, others)

    if not selected:
        print("No videos selected. Exiting.")
        return

    # ── Show selected and confirm ──
    print(f"\nReady to process {len(selected)} videos:\n")
    for i, v in enumerate(selected, 1):
        name = v.original_filename or v.filename
        date_str = v.date.strftime("%Y-%m-%d")
        dur = f"{v.duration:.0f}s" if hasattr(v, "duration") and v.duration else "?"
        print(f"  {i}. {name}  ({date_str}, {dur})")

    print()
    response = input("Proceed? [yes/no]: ").strip().lower()
    if response not in ("yes", "y"):
        print("Cancelled.")
        return

    # ── Step 3: Export from Photos library ──
    exported = export_videos(selected, export_dir)

    if not exported:
        print("No videos could be exported. They may be stored in iCloud.")
        print("Open Photos app and download them locally first, then re-run.")
        return

    # ── Step 4: Extract key frames ──
    with_frames = extract_frames(exported, frames_dir)

    # ── Step 5: Transcribe audio (optional enhancement) ──
    transcribed = transcribe_videos(with_frames)

    # ── Step 6: Categorize with AI vision ──
    categorized = categorize_videos(transcribed)

    # ── Step 7: Review results ──
    display_results(categorized)
    reviewed = interactive_review(categorized)

    # ── Step 8: Organize locally ──
    organized = organize_local(reviewed, organized_dir)

    # ── Save results ──
    save_results(organized, results_path)

    # ── Step 9: Upload to Google Drive ──
    print("\nReview the categories above. If something looks wrong, you can")
    print(f"edit the results file at: {results_path}")
    print("Or re-run the script to re-categorize.\n")
    response = input("Upload these videos to Google Drive now? [yes/no]: ").strip().lower()

    if response in ("yes", "y"):
        success = upload_to_drive(organized_dir)
        if success:
            print(f"Done! Videos uploaded to Google Drive.")
            print(f"Check your Drive under the '{DRIVE_BASE_FOLDER}/' folder.\n")
    else:
        print("Upload skipped. You can re-run the script later to upload.\n")

    # ── Wrap up ──
    print("-" * 70)
    print("NEXT STEPS:")
    print(f"  1. Check Google Drive -> '{DRIVE_BASE_FOLDER}' folder")
    print("  2. Verify videos are in the right categories")
    print("  3. Once confirmed, delete originals from Apple Photos")
    print(f"  4. Clean up temp files: rm -rf {work_dir}")
    print("-" * 70)
    print()


if __name__ == "__main__":
    main()
