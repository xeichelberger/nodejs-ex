# Reel Insight Engine

Analyze Instagram Reels and YouTube videos to extract actionable ecommerce, marketing, and AI insights. Send a link from your phone via **Telegram**, get a full AI analysis, and the best ideas land in your **Notion** backlog automatically.

## How It Works

```
You send an IG/YT link (via Telegram or web)
    │
    ▼
┌──────────────┐
│   yt-dlp     │  Download video + auto-captions
└──────┬───────┘
   ┌───┴───┐
   ▼       ▼
┌──────┐ ┌──────────┐
│ffmpeg│ │Transcript │  Extract key frames + parse subtitles
│frames│ │ parser    │
└──┬───┘ └────┬─────┘
   ▼          ▼
┌──────────────────────────┐
│   Claude Vision + Text   │  "See" + "hear" the full content
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│   Score & Decide         │  Relevance, actionability, brand fit
└──────────┬───────────────┘
     ┌─────┴──────┐
     ▼            ▼
 [Notion]     [Skip]       → Results sent back to Telegram
```

**Key:** The tool doesn't just read captions — it extracts frames and uses Claude's vision to *see* what's shown (products, demos, screen shares, text overlays), then combines that with the transcript.

## Quick Start (No Terminal Required)

### 1. Create a Telegram Bot (30 seconds)
1. Open Telegram, search for **@BotFather**
2. Send `/newbot`, pick a name
3. Copy the token it gives you

### 2. Set Up Notion Backlog (2 minutes)
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations) → **New integration**
2. Name it "Reel Insight", copy the API key
3. Create a Notion page for your backlog, connect the integration to it
4. Copy the page ID from the URL

### 3. Deploy (Free)

**Option A: Render.com** (recommended)
- Push this repo to GitHub
- Create a new Web Service on Render, connect the repo
- Add these environment variables:
  - `ANTHROPIC_API_KEY` — your Claude API key
  - `TELEGRAM_BOT_TOKEN` — from step 1
  - `NOTION_API_KEY` — from step 2
  - `NOTION_DATABASE_ID` — (set after first setup via web UI)

**Option B: Railway.app**
- One-click deploy from GitHub
- Add the same env vars above

### 4. Connect Notion via Web UI
- Open your deployed app's URL
- Go to the **Setup** tab
- Paste your Notion API key and page ID
- Click "Create Backlog Database"

### 5. Start Sharing Links!
Open your Telegram bot and send any IG Reel or YouTube link. You'll get back:
- Full analysis with scores
- Key insights extracted
- Brand fit evaluation
- Suggested implementation steps
- Auto-added to your Notion backlog if relevant

## Usage

### From Telegram (Primary)
Just send a link to your bot:
```
https://www.instagram.com/reel/ABC123/
https://www.youtube.com/shorts/XYZ789
```

Bot commands:
- `/start` — Welcome message
- `/recent` — Last 5 analyzed ideas
- `/stats` — Backlog statistics
- `/status` — Check what's connected

### From Web UI
Open the app URL in your browser:
- **Analyze** tab — Paste and analyze URLs
- **Backlog** tab — Browse and manage ideas
- **Stats** tab — Dashboard metrics
- **Setup** tab — Connect Notion, view status

### From the API
```bash
# Analyze
curl -X POST https://your-app.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtube.com/shorts/abc"}'

# List backlog
curl https://your-app.onrender.com/api/backlog

# Filter
curl https://your-app.onrender.com/api/backlog?status=pending&priority=high
```

## Configuration

Create `config.json` to customize your brand profile:

```json
{
  "brands": [
    {
      "name": "My Brand",
      "description": "DTC supplements brand focused on performance",
      "verticals": ["ecommerce", "health", "DTC"],
      "targetAudience": "Health-conscious adults 25-45",
      "toneKeywords": ["clean", "scientific", "premium"]
    }
  ],
  "minRelevanceScore": 6,
  "maxFrames": 8
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI analysis |
| `TELEGRAM_BOT_TOKEN` | For Telegram | From @BotFather |
| `NOTION_API_KEY` | For Notion | From Notion integrations |
| `NOTION_DATABASE_ID` | For Notion | Auto-set via Setup tab |
| `NOTION_PARENT_PAGE_ID` | For setup | Page ID to create the database under |
| `PORT` | No | Server port (default: 3000) |

## What Gets Analyzed

Each video produces:
- **Summary** — Core idea in 2-3 sentences
- **Key Insights** — Actionable takeaways
- **Visual Context** — What was shown on screen
- **Spoken Content** — What was said
- **Category** — ecommerce, marketing, AI, growth, branding, content
- **Relevance Score** (1-10)
- **Actionability** (1-10)
- **Brand Fit** (1-10 per brand)
- **Suggested Implementation** — Concrete next steps
- **Tags** — For organization

## Project Structure

```
src/
  index.ts              Web server + Telegram bot startup
  cli.ts                CLI (optional, for terminal users)
  lib/
    types.ts            Type definitions
    config.ts           Configuration
    downloader.ts       yt-dlp video downloader
    frameExtractor.ts   ffmpeg frame extraction
    transcriber.ts      Subtitle/transcript parser
    analyzer.ts         Claude Vision + text analysis
    backlog.ts          Local JSON backlog
    notion.ts           Notion database integration
    telegram.ts         Telegram bot
    pipeline.ts         Full analysis pipeline
public/
  index.html            Web UI
Dockerfile              Container deployment
render.yaml             Render.com deployment config
```
