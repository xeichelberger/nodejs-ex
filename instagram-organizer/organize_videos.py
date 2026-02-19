#!/usr/bin/env python3
"""
Instagram Video Organizer
=========================
Scans Apple Photos for Instagram-downloaded videos, transcribes and
categorizes them using local AI, then uploads to Google Drive.

Requirements: macOS, Python 3.10+, ffmpeg, ollama, rclone
Run setup.sh first to install all dependencies.
"""

import os
import sys
import json
import shutil
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIGURATION — Edit these to customize behavior
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MONTHS_TO_SCAN = 6
RCLONE_REMOTE = "gdrive"
DRIVE_BASE_FOLDER = "Instagram Videos"
OLLAMA_MODEL = "llama3.1"
WHISPER_MODEL = "base"

CATEGORIES = {
    "E-Commerce & Business": (
        "Online selling, dropshipping, Shopify, Amazon FBA, product sourcing, "
        "e-commerce strategies, online business, side hustles, making money online"
    ),
    "AI & Technology": (
        "Artificial intelligence, tech tools, automation, apps, software, "
        "coding, AI news, ChatGPT, machine learning, gadgets"
    ),
    "Manifestation & Mindset": (
        "Law of attraction, mindset shifts, personal growth, visualization, "
        "affirmations, spirituality, meditation, self-improvement, motivation"
    ),
    "Marketing & Growth": (
        "Social media marketing, content creation, audience building, ads, "
        "branding, funnels, influencer tips, growth hacks, SEO"
    ),
    "Lifestyle & Misc": (
        "Fitness, cooking, entertainment, travel, fashion, relationships, "
        "everything else that doesn't fit the above categories"
    ),
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


def check_ollama_running():
    import requests

    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=5)
        if resp.status_code != 200:
            raise Exception("bad status")
        models = [m["name"] for m in resp.json().get("models", [])]
        if not any(OLLAMA_MODEL in m for m in models):
            print(f"ERROR: Ollama model '{OLLAMA_MODEL}' not found.")
            print(f"  Run: ollama pull {OLLAMA_MODEL}")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("ERROR: Ollama is not running.")
        print("  Start it with: ollama serve")
        print("  (Or just open the Ollama app from your Applications folder)")
        sys.exit(1)


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
    print("Running preflight checks...")
    check_macos()
    check_command("ffmpeg", "brew install ffmpeg")
    check_command("rclone", "brew install rclone")
    check_command("ollama", "brew install ollama")
    check_python_package("osxphotos")
    check_python_package("whisper", "openai-whisper")
    check_python_package("requests")
    check_ollama_running()
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
    videos = [p for p in all_photos if p.ismovie and p.date >= cutoff]
    print(f"  Found {len(videos)} total videos in the last {MONTHS_TO_SCAN} months")

    instagram_videos = [v for v in videos if is_from_instagram(v)]
    print(f"  Identified {len(instagram_videos)} videos with Instagram metadata\n")

    return instagram_videos


def is_from_instagram(photo):
    """Detect if a video was downloaded from Instagram based on metadata."""
    # Check original filename for Instagram-related patterns
    fname = (photo.original_filename or photo.filename or "").lower()
    if any(p in fname for p in ["instagram", "insta", "reel", "ig_", "ig-"]):
        return True

    # Check description/title fields
    for field in [photo.description, photo.title]:
        if field and "instagram" in field.lower():
            return True

    # Check user-added or Photos ML keywords
    for kw in photo.keywords or []:
        if "instagram" in kw.lower():
            return True

    # Check labels (Apple's on-device ML scene/object detection)
    for label in photo.labels or []:
        if "instagram" in label.lower():
            return True

    return False


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2: EXPORT VIDEOS FROM PHOTOS LIBRARY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def export_videos(photos_list, export_dir):
    print(f"Exporting {len(photos_list)} videos...\n")

    exported = []
    for i, photo in enumerate(photos_list, 1):
        name = photo.original_filename or photo.filename
        print(f"  [{i}/{len(photos_list)}] {name}...", end=" ")

        try:
            # Export video file from Photos library to our working directory
            paths = photo.export(export_dir)
            if paths:
                exported.append(
                    {
                        "exported_path": paths[0],
                        "filename": name,
                        "date": photo.date.isoformat(),
                        "uuid": photo.uuid,
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
# STEP 3: TRANSCRIBE VIDEO AUDIO USING WHISPER (LOCAL)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def transcribe_videos(videos):
    import whisper

    print(f"Loading Whisper '{WHISPER_MODEL}' model...")
    print("(First run downloads ~150MB model file — this is a one-time download)\n")
    model = whisper.load_model(WHISPER_MODEL)

    print(f"Transcribing {len(videos)} videos...\n")

    for i, video in enumerate(videos, 1):
        print(f"  [{i}/{len(videos)}] {video['filename']}...", end=" ")

        try:
            result = model.transcribe(video["exported_path"])
            video["transcript"] = result["text"].strip()

            # Get duration from last segment
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
# STEP 4: CATEGORIZE USING OLLAMA (LOCAL LLM)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def categorize_videos(videos):
    import requests

    print(f"Categorizing videos using Ollama ({OLLAMA_MODEL})...\n")

    category_list = "\n".join(
        f"  - {name}: {desc}" for name, desc in CATEGORIES.items()
    )
    valid_names = list(CATEGORIES.keys())

    for i, video in enumerate(videos, 1):
        transcript = video.get("transcript", "")

        if not transcript:
            video["category"] = "Uncategorized"
            print(f"  [{i}/{len(videos)}] {video['filename']} -> Uncategorized (no transcript)")
            continue

        print(f"  [{i}/{len(videos)}] {video['filename']}...", end=" ")

        prompt = (
            "You are categorizing an Instagram video based on its audio transcript.\n\n"
            f"Available categories:\n{category_list}\n\n"
            f'Video transcript:\n"{transcript[:2000]}"\n\n'
            "Which single category best fits this video? "
            "Reply with ONLY the exact category name from the list above, nothing else."
        )

        try:
            resp = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.1},
                },
                timeout=120,
            )
            raw = resp.json()["response"].strip()
            matched = match_category(raw, valid_names)
            video["category"] = matched
            print(f"-> {matched}")
        except Exception as e:
            video["category"] = "Uncategorized"
            print(f"FAILED ({e})")

    categorized = sum(1 for v in videos if v.get("category") != "Uncategorized")
    print(f"\n  Categorized {categorized}/{len(videos)} videos\n")
    return videos


def match_category(raw, valid_categories):
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
        words = cat.lower().replace("&", "").split()
        if any(w in raw_lower for w in words if len(w) > 3):
            return cat

    return "Uncategorized"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5: DISPLAY RESULTS FOR REVIEW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def display_results(videos):
    print("=" * 70)
    print("  CATEGORIZATION RESULTS")
    print("=" * 70)

    by_category = {}
    for v in videos:
        cat = v.get("category", "Uncategorized")
        by_category.setdefault(cat, []).append(v)

    for cat in list(CATEGORIES.keys()) + ["Uncategorized"]:
        vids = by_category.get(cat, [])
        if not vids:
            continue
        print(f"\n  {cat} ({len(vids)} videos)")
        print("  " + "-" * 40)
        for v in vids:
            t = v.get("transcript", "")
            preview = (t[:70] + "...") if len(t) > 70 else (t or "(no transcript)")
            dur = v.get("duration_seconds", "?")
            print(f"    {v['filename']}")
            print(f"      Date: {v['date'][:10]}  |  Duration: {dur}s")
            print(f"      Preview: {preview}")

    print("\n" + "=" * 70)
    total = len(videos)
    categorized = sum(1 for v in videos if v.get("category") != "Uncategorized")
    print(f"  Total: {total}  |  Categorized: {categorized}  |  Uncategorized: {total - categorized}")
    print("=" * 70)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6: UPLOAD TO GOOGLE DRIVE VIA RCLONE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def upload_to_drive(videos):
    print(f"\nUploading to Google Drive ({RCLONE_REMOTE}:{DRIVE_BASE_FOLDER}/)...\n")

    success = 0
    for i, video in enumerate(videos, 1):
        category = video.get("category", "Uncategorized")
        src = video["exported_path"]
        basename = os.path.basename(src)
        dest = f"{RCLONE_REMOTE}:{DRIVE_BASE_FOLDER}/{category}/{basename}"

        print(f"  [{i}/{len(videos)}] -> {category}/{basename}...", end=" ")

        try:
            result = subprocess.run(
                ["rclone", "copyto", src, dest],
                capture_output=True,
                text=True,
                timeout=300,
            )
            if result.returncode == 0:
                print("OK")
                success += 1
            else:
                print(f"FAILED ({result.stderr.strip()[:100]})")
        except subprocess.TimeoutExpired:
            print("FAILED (upload timed out)")
        except Exception as e:
            print(f"FAILED ({e})")

    print(f"\n  Uploaded {success}/{len(videos)} videos\n")
    return success


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 7: SAVE RESULTS TO JSON
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def save_results(videos, output_path):
    results = []
    for v in videos:
        results.append(
            {
                "filename": v["filename"],
                "date": v["date"],
                "category": v.get("category", "Uncategorized"),
                "transcript": v.get("transcript", ""),
                "duration_seconds": v.get("duration_seconds"),
                "uuid": v.get("uuid", ""),
            }
        )

    data = {"scan_date": datetime.now().isoformat(), "videos": results}
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"  Results saved to: {output_path}\n")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def main():
    print()
    print("=" * 70)
    print("  INSTAGRAM VIDEO ORGANIZER")
    print("  Scan  ->  Transcribe  ->  Categorize  ->  Upload to Google Drive")
    print("=" * 70)
    print()

    # ── Preflight ──
    run_preflight()

    # ── Working directory ──
    work_dir = os.path.join(os.path.expanduser("~"), ".instagram-organizer")
    export_dir = os.path.join(work_dir, "exports")
    os.makedirs(export_dir, exist_ok=True)
    results_path = os.path.join(work_dir, "results.json")

    # ── Step 1: Scan Apple Photos ──
    instagram_videos = scan_photos()

    if not instagram_videos:
        print("No Instagram videos found in the last {} months.".format(MONTHS_TO_SCAN))
        print("\nPossible reasons:")
        print("  - Videos were not downloaded directly from Instagram")
        print("  - Videos don't have Instagram metadata in their filenames")
        print("  - No videos in the specified time range")
        print("\nTip: Screen-recorded videos won't be detected in this version.")
        return

    # ── Show found videos and confirm ──
    print("Found these Instagram videos:\n")
    for i, v in enumerate(instagram_videos, 1):
        name = v.original_filename or v.filename
        date_str = v.date.strftime("%Y-%m-%d")
        print(f"  {i}. {name}  ({date_str})")

    print()
    response = input("Proceed with processing these videos? [yes/no]: ").strip().lower()
    if response not in ("yes", "y"):
        print("Cancelled.")
        return

    # ── Step 2: Export from Photos library ──
    print()
    exported = export_videos(instagram_videos, export_dir)

    if not exported:
        print("No videos could be exported. They may be stored in iCloud.")
        print("Open Photos app and download them locally first, then re-run.")
        return

    # ── Step 3: Transcribe audio ──
    transcribed = transcribe_videos(exported)

    # ── Step 4: Categorize with local AI ──
    categorized = categorize_videos(transcribed)

    # ── Step 5: Review results ──
    display_results(categorized)
    save_results(categorized, results_path)

    # ── Step 6: Upload to Google Drive ──
    print("\nReview the categories above. If something looks wrong, you can")
    print(f"edit the results file at: {results_path}")
    print()
    response = input("Upload these videos to Google Drive now? [yes/no]: ").strip().lower()

    if response in ("yes", "y"):
        uploaded = upload_to_drive(categorized)
        print(f"Done! {uploaded} videos uploaded to Google Drive.")
        print(f"Check your Drive under the '{DRIVE_BASE_FOLDER}/' folder.\n")
    else:
        print("Upload skipped. You can re-run the script later to upload.\n")

    # ── Wrap up ──
    print("-" * 70)
    print("NEXT STEPS:")
    print(f"  1. Check Google Drive -> '{DRIVE_BASE_FOLDER}' folder")
    print("  2. Verify videos are in the right categories")
    print("  3. Once confirmed, manually delete originals from Apple Photos")
    print(f"  4. Clean up temp files: rm -rf {export_dir}")
    print("-" * 70)
    print()


if __name__ == "__main__":
    main()
