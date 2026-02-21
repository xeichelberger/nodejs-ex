# Reel Insight Engine

Analyze Instagram Reels and YouTube videos to extract actionable ecommerce, marketing, and AI insights for your brand. Automatically scores content for relevance and brand fit, then adds high-value ideas to a managed backlog.

## How It Works

```
URL (IG Reel / YouTube)
    │
    ▼
┌──────────────┐
│   yt-dlp     │  Download video + auto-captions
└──────┬───────┘
       │
   ┌───┴───┐
   ▼       ▼
┌──────┐ ┌──────────┐
│ffmpeg│ │Transcript │  Extract key frames + parse subtitles
│frames│ │ parser    │
└──┬───┘ └────┬─────┘
   │          │
   ▼          ▼
┌──────────────────────────┐
│   Claude Vision + Text   │  Analyze frames visually, combine
│   (claude-opus-4-6)      │  with transcript for deep understanding
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Insight Scoring        │  Score relevance, actionability,
│   & Brand Fit            │  brand fit (1-10 each)
└──────────┬───────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
 [Backlog]    [Skip]
```

**Key feature:** The tool doesn't just read captions — it extracts frames and uses Claude's vision to *see* what's being shown (products, demos, screen shares, text overlays), then combines that with the transcript to fully understand the insight being presented.

## Prerequisites

- **Node.js** >= 18
- **yt-dlp** — `pip install yt-dlp` or `brew install yt-dlp`
- **ffmpeg** — `apt install ffmpeg` or `brew install ffmpeg`
- **Anthropic API Key** — set `ANTHROPIC_API_KEY` environment variable

Check that everything is installed:

```bash
npm run cli -- check
```

## Quick Start

```bash
# Install dependencies
npm install

# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start the web UI
npm run dev

# Or analyze from the command line
npm run cli -- analyze https://www.youtube.com/shorts/VIDEO_ID
npm run cli -- analyze https://www.instagram.com/reel/REEL_CODE/
```

## Usage

### Web UI

Start the server and open `http://localhost:3000`:

```bash
npm run dev
```

The web interface has three sections:
- **Analyze** — Paste a URL, get a full insight analysis with scores
- **Backlog** — Browse, filter, approve/reject ideas
- **Stats** — Dashboard with aggregate metrics

### CLI

```bash
# Analyze a video
npm run cli -- analyze <url>

# View backlog
npm run cli -- backlog
npm run cli -- backlog --status=pending --priority=high

# Backlog management
npm run cli -- backlog stats
npm run cli -- backlog view <id>
npm run cli -- backlog approve <id>
npm run cli -- backlog reject <id>
npm run cli -- backlog delete <id>

# Check dependencies
npm run cli -- check
```

### API

```bash
# Analyze a URL
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/shorts/abc123"}'

# List backlog
curl http://localhost:3000/api/backlog
curl http://localhost:3000/api/backlog?status=pending&priority=high

# Get stats
curl http://localhost:3000/api/backlog/stats

# Update status
curl -X PATCH http://localhost:3000/api/backlog/<id>/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

## Configuration

Create a `config.json` in the project root to customize brands and behavior:

```json
{
  "brands": [
    {
      "name": "My Ecom Brand",
      "description": "DTC supplements brand focused on performance and wellness",
      "verticals": ["ecommerce", "health", "DTC"],
      "targetAudience": "Health-conscious adults 25-45 interested in performance optimization",
      "toneKeywords": ["clean", "scientific", "approachable", "premium"]
    }
  ],
  "minRelevanceScore": 6,
  "maxFrames": 8,
  "frameIntervalSec": 5,
  "port": 3000
}
```

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `brands` | Default ecom/marketing/AI brand | Array of brand profiles to score against |
| `minRelevanceScore` | 6 | Minimum relevance score to auto-add to backlog |
| `maxFrames` | 8 | Maximum frames to extract per video |
| `frameIntervalSec` | 5 | Seconds between frame captures |
| `port` | 3000 | Web server port |

## Analysis Output

Each analyzed video produces:

- **Summary** — Core message/idea in 2-3 sentences
- **Key Insights** — Extracted actionable insights
- **Visual Context** — What the video showed visually
- **Spoken Content** — What was communicated verbally
- **Category** — ecommerce, marketing, AI, growth, branding, content, or other
- **Relevance Score** (1-10) — How relevant to your verticals
- **Actionability** (1-10) — How easy to act on
- **Brand Fit Scores** — Per-brand fit with reasoning
- **Recommendation** — add_to_backlog, skip, or review_later
- **Suggested Implementation** — Concrete next steps
- **Tags** — For filtering and organization

## Project Structure

```
src/
  index.ts              Web server entry point
  cli.ts                CLI entry point
  lib/
    types.ts            TypeScript type definitions
    config.ts           Configuration loader
    downloader.ts       yt-dlp video downloader
    frameExtractor.ts   ffmpeg frame extraction
    transcriber.ts      Subtitle/transcript parser
    analyzer.ts         Claude Vision + text analysis
    backlog.ts          Backlog CRUD manager
    pipeline.ts         Orchestrates the full pipeline
public/
  index.html            Web UI (single-page app)
```
