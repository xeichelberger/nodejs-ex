#!/bin/bash
# ================================================================
# Instagram Video Organizer — Runner
# ================================================================
# Activates the virtual environment and runs the organizer.
# Run setup.sh first if you haven't already.
# ================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "ERROR: Virtual environment not found."
    echo "Run setup.sh first:  bash setup.sh"
    exit 1
fi

source "$VENV_DIR/bin/activate"
python "$SCRIPT_DIR/organize_videos.py"
