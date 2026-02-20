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
echo "  Instagram Video Organizer v2 — Setup"
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
echo "Installing system dependencies (ffmpeg, rclone, python)..."
echo "(Already-installed packages will be skipped)"
echo ""

brew install ffmpeg rclone python@3.11

echo ""

# ── Install Ollama (free local AI) ──
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama (free local AI for video categorization)..."
    brew install ollama
    echo ""
fi

echo "Pulling Ollama models (one-time download)..."
echo "(llava ~4GB for vision, llama3.1 ~4GB for text)"
echo ""
ollama pull llava
ollama pull llama3.1
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
echo "(anthropic is for Claude AI vision — best quality categorization)"
echo ""

source "$VENV_DIR/bin/activate"
pip install --upgrade pip --quiet
pip install -r "$SCRIPT_DIR/requirements.txt"

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
echo "  2. START OLLAMA (must be running before each use)"
echo "     In a separate terminal, run:"
echo ""
echo "       ollama serve"
echo ""
echo "  3. RUN THE ORGANIZER"
echo "     bash run.sh"
echo ""
