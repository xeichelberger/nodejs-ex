#!/bin/bash
# ================================================================
# Instagram Video Organizer — One-Time Setup
# ================================================================
# This script installs everything you need. Run it once on your Mac.
# After setup, use run.sh to launch the organizer.
# ================================================================

set -e

echo ""
echo "================================================================"
echo "  Instagram Video Organizer — Setup"
echo "================================================================"
echo ""

# ── Check we're on macOS ──
if [[ "$(uname)" != "Darwin" ]]; then
    echo "ERROR: This tool only works on macOS (for Apple Photos access)."
    exit 1
fi

# ── Check/install Homebrew ──
if ! command -v brew &> /dev/null; then
    echo "Homebrew is not installed. Installing it now..."
    echo "(You may be asked for your Mac password)"
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    echo ""
fi

# ── Install system tools ──
echo "Installing system dependencies (ffmpeg, rclone, ollama, python)..."
echo "(Already-installed packages will be skipped)"
echo ""

brew install ffmpeg rclone ollama python@3.11

echo ""

# ── Create Python virtual environment ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"

if [ -d "$VENV_DIR" ]; then
    echo "Python virtual environment already exists."
else
    echo "Creating Python virtual environment..."
    python3.11 -m venv "$VENV_DIR"
fi

echo "Installing Python packages..."
echo "(openai-whisper includes PyTorch — expect ~2GB download on first run)"
echo ""

source "$VENV_DIR/bin/activate"
pip install --upgrade pip --quiet
pip install -r "$SCRIPT_DIR/requirements.txt"

echo ""

# ── Pull Ollama model ──
echo "Downloading AI model for categorization (llama3.1 — ~4.7GB)..."
echo "(This is a one-time download)"
echo ""

ollama pull llama3.1

echo ""
echo "================================================================"
echo "  Setup complete!"
echo "================================================================"
echo ""
echo "BEFORE YOUR FIRST RUN, you need to do two things:"
echo ""
echo "  1. CONFIGURE GOOGLE DRIVE"
echo "     Run this command and follow the prompts:"
echo ""
echo "       rclone config"
echo ""
echo "     When asked:"
echo "       - Type 'n' for new remote"
echo "       - Name it: gdrive"
echo "       - Storage type: Choose 'drive' (Google Drive)"
echo "       - Leave client_id and client_secret blank (press Enter)"
echo "       - Scope: Choose '1' (full access)"
echo "       - Leave root_folder_id and service_account_file blank"
echo "       - Auto config: Choose 'y' (yes)"
echo "       - A browser will open — sign in to your Google account"
echo "       - Shared drive: Choose 'n' (no)"
echo "       - Confirm with 'y'"
echo ""
echo "  2. START OLLAMA"
echo "     Open the Ollama app from Applications,"
echo "     or run: ollama serve"
echo ""
echo "  3. RUN THE ORGANIZER"
echo "     bash run.sh"
echo ""
