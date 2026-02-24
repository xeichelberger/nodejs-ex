# Reel Insight Engine — Full Build Spec

> **What this is:** A complete specification for building an IG Reel / YouTube video analysis tool. Hand this file to Claude Code in any repo and say "build this." The agent that lives in the target repo should already have access to brand materials, guidelines, and assets in that repo — the tool will use them for context-aware analysis.

---

## Overview

A Node.js + TypeScript tool that:

1. Takes an Instagram Reel or YouTube video URL (via Telegram bot, web API, or CLI)
2. Downloads the video, extracts key frames and transcript
3. Runs AI analysis (vision + text) against your brand context
4. **Only if the AI deems the idea worth testing for your business**, writes a strategic brief into `BACKLOG.md`
5. The backlog is a structured, decision-ready markdown file you review and act on

The AI should read any brand materials that exist in the repo (pitch decks, brand guides, audience docs, product catalogs, etc.) and use them as context when scoring relevance and brand fit.

---

## Architecture

```
User sends URL (Telegram / Web / CLI)
         |
         v
  ┌──────────────┐
  │  DOWNLOADER   │  yt-dlp: download video + subtitles + metadata
  └──────┬───────┘
         v
  ┌──────────────┐
  │ FRAME EXTRACT │  ffmpeg: pull 8 key frames at regular intervals, scale to 720px, output base64 JPEG
  └──────┬───────┘
         v
  ┌──────────────┐
  │ TRANSCRIBER   │  Parse VTT/SRT subtitle files into clean plain text
  └──────┬───────┘
         v
  ┌──────────────┐
  │  AI ANALYZER  │  Two-pass analysis:
  │               │    Pass 1: Vision — send frames to multimodal AI, get visual description
  │               │    Pass 2: Insight — combine transcript + visuals + brand context → strategic scoring
  └──────┬───────┘
         v
  ┌──────────────┐
  │   DECISION    │  AI recommends: "add_to_backlog" / "review_later" / "skip"
  │               │  Only "add" and "review" get written to BACKLOG.md
  └──────┬───────┘
         v
  ┌──────────────┐
  │  BACKLOG.md   │  Strategic decision board — one brief per idea
  └──────────────┘
```

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Runtime | Node.js 18+ | |
| Language | TypeScript | |
| Web framework | Express | Minimal API + serves web UI |
| AI (free default) | Kimi K2.5 via NVIDIA API | Free, supports vision + text, OpenAI-compatible |
| AI (premium option) | Claude via Anthropic SDK | Better analysis quality |
| Video download | yt-dlp (system binary) | Handles IG + YT, extracts subs |
| Frame extraction | ffmpeg / ffprobe (system binaries) | Key frame extraction |
| Bot | node-telegram-bot-api | Mobile-first input |
| Data | Local JSON file + BACKLOG.md | No database needed |

### npm dependencies

```json
{
  "@anthropic-ai/sdk": "^0.39.0",
  "express": "^4.21.0",
  "node-telegram-bot-api": "^0.67.0",
  "@types/node-telegram-bot-api": "^0.64.13",
  "openai": "^6.22.0",
  "uuid": "^11.0.0"
}
```

Dev dependencies: `@types/express`, `@types/node`, `@types/uuid`, `tsx`, `typescript`

### System dependencies (must be installed)

- `yt-dlp` — install via `pip install yt-dlp`
- `ffmpeg` + `ffprobe` — install via `apt install ffmpeg` or `brew install ffmpeg`

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NVIDIA_API_KEY` | Yes (default provider) | Free key from build.nvidia.com — powers Kimi K2.5 vision + text |
| `TELEGRAM_BOT_TOKEN` | For mobile use | From @BotFather on Telegram |
| `ANTHROPIC_API_KEY` | Only if using Claude | Anthropic API key (premium alternative to NVIDIA) |

That's it. No database, no Notion, no other services.

---

## File Structure

```
src/
  index.ts              # Express server + Telegram bot startup
  cli.ts                # CLI interface
  lib/
    types.ts            # All TypeScript interfaces
    config.ts           # Configuration loader (env vars + config.json + brand context)
    downloader.ts       # yt-dlp video downloader + platform detection
    frameExtractor.ts   # ffmpeg frame extraction
    transcriber.ts      # VTT/SRT subtitle parser
    analyzer.ts         # AI analysis (vision + insight scoring)
    backlog.ts          # Local JSON backlog manager (data/backlog.json)
    markdown-backlog.ts # Writes strategic briefs to BACKLOG.md
    pipeline.ts         # Orchestrates the full flow
    telegram.ts         # Telegram bot message handlers
public/
  index.html            # Web UI
data/                   # Auto-created, stores backlog.json
tmp/                    # Auto-created, temporary video/frame files (cleaned after each run)
BACKLOG.md              # Auto-generated strategic backlog (the main output)
```

---

## Core Data Types

```typescript
type Platform = "instagram" | "youtube";
type BacklogStatus = "pending" | "approved" | "rejected" | "implemented";
type BacklogPriority = "low" | "medium" | "high" | "critical";

interface BrandProfile {
  name: string;
  description: string;
  verticals: string[];           // e.g. ["ecommerce", "marketing", "AI"]
  targetAudience: string;
  toneKeywords: string[];        // e.g. ["professional", "innovative"]
}

interface ContentSource {
  url: string;
  platform: Platform;
  videoId: string;
  title?: string;
  author?: string;
  duration?: number;             // seconds
}

interface InsightAnalysis {
  summary: string;
  keyInsights: string[];
  visualContext: string;
  spokenContent: string;
  category: "ecommerce" | "marketing" | "AI" | "growth" | "branding" | "content" | "other";
  relevanceScore: number;        // 1-10
  actionability: number;         // 1-10
  brandFitScores: BrandFitScore[];
  overallRecommendation: "add_to_backlog" | "skip" | "review_later";
  reasoning: string;
  suggestedImplementation: string;
  tags: string[];
}

interface BrandFitScore {
  brandName: string;
  score: number;                 // 1-10
  reasoning: string;
}

interface BacklogItem {
  id: string;                    // UUID
  createdAt: string;             // ISO date
  updatedAt: string;
  source: ContentSource;
  analysis: InsightAnalysis;
  status: BacklogStatus;
  priority: BacklogPriority;
  notes: string;
  transcript: string | null;
  frameDescriptions: string[];
}

interface AnalysisPipelineResult {
  success: boolean;
  backlogItem?: BacklogItem;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}
```

---

## Module Specifications

### 1. downloader.ts — Video Download

**Platform detection** (`detectPlatform(url) → Platform | null`):
- Instagram: URL contains `instagram.com`, `instagr.am`, `/reel/`, or `/reels/`
- YouTube: URL contains `youtube.com`, `youtu.be`, or `/shorts/`

**Video ID extraction** (`extractVideoId(url, platform) → string`):
- YouTube: parse `youtu.be/ID`, `?v=ID`, `/shorts/ID`
- Instagram: parse `/reel/CODE/` or `/reels/CODE/`
- Fallback: base64url hash of URL, truncated to 16 chars

**Download** (`downloadVideo(url, tempDir) → DownloadResult`):

Runs yt-dlp with these flags:
```
yt-dlp <url>
  -o <tempDir>/<platform>_<videoId>/video.%(ext)s
  --write-auto-subs --write-subs
  --sub-langs "en.*,en"
  --sub-format "vtt/srt/best"
  --write-info-json
  --no-playlist
  --format "bestvideo[height<=720]+bestaudio/best[height<=720]/best"
  --merge-output-format mp4
  --no-check-certificates
  --socket-timeout 30
  --retries 3
```

For Instagram, add user-agent:
```
--user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
```

After download: extract audio to mp3 with ffmpeg (`ffmpeg -i video -vn -acodec libmp3lame -q:a 4 -y audio.mp3`).

Parse the `.info.json` file for metadata (title, uploader/channel, duration).

Returns: `{ source, videoPath, audioPath, subtitlePath, infoJson }`

**Cleanup** (`cleanupDownload(tempDir, source)`): `rm -rf` the download directory.

---

### 2. frameExtractor.ts — Key Frame Extraction

**Duration** (`getVideoDuration(videoPath) → number`):
```
ffprobe -v error -show_entries format=duration -of csv=p=0 <videoPath>
```

**Frame extraction** (`extractFrames(videoPath, options) → ExtractedFrame[]`):

Logic:
- Default: 8 frames max, 5-second intervals
- For short videos (<30s): interval = `max(2, duration / maxFrames)`
- Always grab frame at ~1s (skip black intro frames)
- If room, grab a frame at `duration - 1s`
- Extract each frame with ffmpeg:
  ```
  ffmpeg -ss <timestamp> -i <video> -vframes 1 -q:v 3 -vf "scale=720:-2" -y <output.jpg>
  ```
- Read each frame as base64 string

Returns array of `{ path, timestampSec, base64 }`.

---

### 3. transcriber.ts — Subtitle Parser

**Parse subtitles** (`parseSubtitles(content) → string`):
- Skip VTT headers (`WEBVTT`, `Kind:`, `Language:`)
- Skip timestamp lines (both VTT `00:00:00.000 -->` and SRT formats)
- Skip sequence numbers
- Strip VTT tags: `<c>`, `{...}`, `align:`, `position:`
- Deduplicate consecutive identical lines (common in auto-captions)
- Join all lines with spaces, normalize whitespace

**Extract transcript** (`extractTranscript(subtitlePath) → { text, source }`):
- If no file or empty: return `{ text: null, source: "none" }`
- Detect auto-generated vs manual based on filename/content
- Return cleaned text + source type

---

### 4. analyzer.ts — AI Analysis (The Brain)

Supports multiple AI providers via a common interface.

**Provider setup:**

| Provider | Endpoint | Model | Key |
|----------|----------|-------|-----|
| kimi-nvidia (default, free) | `https://integrate.api.nvidia.com/v1` | `moonshotai/kimi-k2.5` | `NVIDIA_API_KEY` |
| kimi-moonshot | `https://api.moonshot.cn/v1` | `kimi-k2.5` | `KIMI_API_KEY` |
| claude | Anthropic SDK | `claude-sonnet-4-20250514` | `ANTHROPIC_API_KEY` |

All non-Claude providers use the OpenAI SDK with custom `baseURL`.

**Pass 1: Vision Analysis** (`analyzeFrames(frames, source, config) → string`):

Send all extracted frames (as base64 images) to the AI with this prompt:

```
These are {frameCount} key frames extracted at regular intervals from a {platform}.

Analyze the visual content across all frames and describe:
1. What is being shown visually (products, people, text overlays, demonstrations, B-roll, screen recordings, etc.)
2. What the speaker/presenter looks like and their presentation style (if a person is visible)
3. Any on-screen text, graphics, data, or call-to-actions
4. The production style (talking head, screen share, cinematic, UGC-style, slideshow, etc.)
5. The overall visual narrative — what story do the frames tell when viewed in sequence

Be specific and detailed. This visual context will be combined with a transcript to fully understand the content's message.
```

For Claude: use `type: "image"` with `source: { type: "base64", media_type: "image/jpeg", data }`.
For OpenAI-compatible: use `type: "image_url"` with `image_url: { url: "data:image/jpeg;base64,{data}" }`.

Max tokens: 2000.

**Pass 2: Insight Analysis** (`analyzeInsight(transcript, visualAnalysis, source, brands, config) → InsightAnalysis`):

This is the strategic analysis. The prompt combines transcript + visual description + brand profiles and asks the AI to output a JSON object:

```
You are an expert content strategist specializing in ecommerce, digital marketing, and AI-powered business growth. You are evaluating a {platform} as a potential source of ideas for our brand(s).

## Source Information
- Platform: {platform}
- URL: {url}
- Title: {title}
- Creator: {author}
- Duration: {duration}s

## Visual Analysis (from frame-by-frame review)
{visualAnalysis}

## Transcript / Spoken Content
{transcript or "No transcript available. Rely on visual analysis only."}

## Our Brand(s)
{For each brand: name, description, verticals, audience, tone keywords}

---

## Your Task

Deeply analyze this content and extract the core insight(s) or idea(s) being presented. Then evaluate whether this idea is worth implementing for our brand(s).

Respond with a JSON object matching this exact schema:
{
  "summary": "2-3 sentence summary of the content's core message/idea",
  "keyInsights": ["insight 1", "insight 2", ...],
  "visualContext": "Brief summary of what the visual content showed",
  "spokenContent": "Brief summary of what was said/communicated verbally",
  "category": "ecommerce" | "marketing" | "AI" | "growth" | "branding" | "content" | "other",
  "relevanceScore": 1-10,
  "actionability": 1-10,
  "brandFitScores": [
    { "brandName": "...", "score": 1-10, "reasoning": "..." }
  ],
  "overallRecommendation": "add_to_backlog" | "skip" | "review_later",
  "reasoning": "Why this recommendation — be specific about what makes this idea valuable or not",
  "suggestedImplementation": "If recommended, how could we implement this idea? Specific next steps.",
  "tags": ["tag1", "tag2", ...]
}

Scoring guide:
- relevanceScore: How relevant is this to ecommerce/marketing/AI? (1=irrelevant, 10=directly applicable)
- actionability: How easy is it to act on this insight? (1=vague/theoretical, 10=clear playbook)
- brandFitScores: Per-brand fit (1=completely off-brand, 10=perfect alignment)
- Recommend "add_to_backlog" if relevance >= 6 AND actionability >= 5
- Recommend "review_later" if promising but unclear
- Recommend "skip" if irrelevant or low-quality

Return ONLY the JSON object, no markdown fencing or explanation.
```

Max tokens: 4000.

**JSON parsing:** Strip markdown fencing if present (```` ```json ... ``` ````), then `JSON.parse`. If parsing fails, return a fallback object with `overallRecommendation: "review_later"` and `tags: ["parse-error", "needs-review"]`.

**IMPORTANT — Brand Context Integration:**
The build should look for brand materials in the repo (markdown files, PDFs, docs in a `brand/` or `docs/` folder, a `BRAND_CONTEXT.md`, etc.) and incorporate them into the brand profiles that get passed to the AI. The richer the brand context, the better the strategic scoring.

---

### 5. backlog.ts — Local JSON Storage

Stores items in `data/backlog.json` as a JSON array.

**BacklogManager class:**

- `constructor(dataDir)` — loads existing JSON or starts empty
- `hasUrl(url) → boolean` — duplicate check
- `add(source, analysis, transcript, frameDescriptions) → BacklogItem` — creates item with UUID, auto-sets priority:
  - avgScore (relevance + actionability / 2) >= 8 → critical
  - >= 6.5 → high
  - >= 5 → medium
  - else → low
- `getAll(filters?) → BacklogItem[]` — filter by status, priority, category, platform
- `getById(id) → BacklogItem | undefined`
- `updateStatus(id, status) → BacklogItem | undefined`
- `updatePriority(id, priority) → BacklogItem | undefined`
- `addNotes(id, notes) → BacklogItem | undefined`
- `delete(id) → boolean`
- `getStats()` — returns totals and breakdowns by status/priority/category/platform + averages

All mutations call `save()` which writes the full array to disk.

---

### 6. markdown-backlog.ts — Strategic BACKLOG.md Writer

This is the **main output**. Each entry is a strategic brief, not a data dump.

**`appendToMarkdownBacklog(item, rootDir?) → filePath`**

Creates `BACKLOG.md` with header on first call. Then appends one entry per analyzed item.

**File header:**
```markdown
# Reel Insight Engine — Content Backlog

Ideas and insights captured from Instagram Reels and YouTube videos.

---
```

**Entry format:**
```markdown
## {platformIcon} {summary}

| Field | Value |
|-------|-------|
| **Status** | {status} |
| **Priority** | {priorityIcon} {priority} |
| **Category** | {category} |
| **Platform** | {platform} |
| **Relevance** | {score}/10 |
| **Actionability** | {score}/10 |
| **Recommendation** | {recommendation} |
| **Source** | [{title}]({url}) |
| **Creator** | {author} |
| **Duration** | {duration}s |
| **Date** | {YYYY-MM-DD} |
| **ID** | `{uuid}` |

### Key Insights
- {insight 1}
- {insight 2}
- ...

### Brand Fit
  - **{brandName}**: {score}/10 — {reasoning}

### Suggested Implementation
{implementation steps}

### AI Reasoning
{why this was recommended}

**Tags:** `tag1` `tag2` `tag3`

<details>
<summary>Visual Context</summary>
{what the AI saw in the frames}
</details>

<details>
<summary>Spoken Content</summary>
{what was said}
</details>

<details>
<summary>Full Transcript</summary>
{raw transcript}
</details>

---
```

Priority icons: critical = red square, high = orange square, medium = blue square, low = white square.
Platform icons: instagram = camera, youtube = video camera.

---

### 7. pipeline.ts — Orchestrator

**`runPipeline(url, config, backlog) → AnalysisPipelineResult`**

Flow:
1. Check `backlog.hasUrl(url)` — skip if duplicate
2. `downloadVideo(url, tempDir)` — get video + subs + metadata
3. `extractFrames(videoPath, { maxFrames, intervalSec })` — get 8 key frames
4. `extractTranscript(subtitlePath)` — get clean text
5. `analyzeContent({ frames, transcript, source, brands, config })` — AI analysis
6. **Decision gate:** if `overallRecommendation === "skip"`, return skipped
7. `backlog.add(source, analysis, transcript, frameDescriptions)` — save to JSON
8. `appendToMarkdownBacklog(item)` — write strategic brief to BACKLOG.md
9. (Optional) `addToNotion(item, config)` if Notion keys are configured
10. `finally` block: `cleanupDownload(tempDir, source)` — always clean temp files

**`checkDependencies() → { ytDlp, ffmpeg, allGood }`** — verify system binaries exist.

---

### 8. telegram.ts — Telegram Bot

**`startTelegramBot(config, backlog) → TelegramBot`**

Uses `node-telegram-bot-api` in polling mode.

**Commands:**
- `/start` — welcome message explaining capabilities
- `/help` — list commands
- `/status` — show AI provider status, backlog count
- `/recent` — last 5 items with scores
- `/stats` — backlog statistics

**Main message handler:**
1. Extract URL from message text (regex: `https?://[^\s]+`)
2. Strip trailing punctuation
3. `detectPlatform(url)` — validate it's IG or YT
4. Check AI key is configured
5. Send "analyzing..." message (save message ID for later editing)
6. Call `runPipeline(url, config, backlog)`
7. Edit the original message with results:
   - Recommendation icon (green check / yellow circle / skip)
   - Summary
   - Relevance + Actionability scores
   - Category + Priority
   - Brand fit scores
   - Top 5 key insights
   - Suggested implementation (truncated to 300 chars)
   - Tags as hashtags
   - "Saved to BACKLOG.md" confirmation
8. On error: edit message with error text

**Optional user restriction:** if `config.telegramAllowedUsers` is set, only those usernames can use the bot.

---

### 9. index.ts — Web Server

Express server on configurable port (default 3000).

**Endpoints:**
- `GET /api/health` — system status (deps, AI key, integrations)
- `POST /api/analyze` — analyze a URL, returns `AnalysisPipelineResult`
- `GET /api/backlog` — list items (query params: status, priority, category, platform)
- `GET /api/backlog/stats` — statistics
- `GET /api/backlog/:id` — single item
- `PATCH /api/backlog/:id/status` — update status (body: `{ status }`)
- `PATCH /api/backlog/:id/priority` — update priority (body: `{ priority }`)
- `PATCH /api/backlog/:id/notes` — add notes (body: `{ notes }`)
- `DELETE /api/backlog/:id` — delete item
- `GET /` — serve `public/index.html`

On startup: load config, create BacklogManager, start Telegram bot if configured, print status banner.

---

### 10. cli.ts — Command Line Interface

```
reel-insight analyze <url>              Analyze a video
reel-insight backlog                    List all items (supports --status=X --priority=X filters)
reel-insight backlog stats              Statistics
reel-insight backlog view <id>          View item details
reel-insight backlog approve <id>       Mark approved
reel-insight backlog reject <id>        Mark rejected
reel-insight backlog delete <id>        Delete
reel-insight check                      Verify yt-dlp, ffmpeg, API keys
reel-insight help                       Usage info
```

---

### 11. config.ts — Configuration

Loads from `config.json` (if exists) + environment variables. Env vars override file values.

**AI provider auto-detection priority:**
1. If `NVIDIA_API_KEY` is set → use `kimi-nvidia` (free)
2. If `KIMI_API_KEY` is set → use `kimi-moonshot`
3. If `ANTHROPIC_API_KEY` is set → use `claude`
4. Default → `kimi-nvidia` (user needs to get free key)

**Defaults:**
- `dataDir`: `./data`
- `tempDir`: `./tmp`
- `minRelevanceScore`: 6
- `maxFrames`: 8
- `frameIntervalSec`: 5
- `port`: env `PORT` or 3000

**Brand profiles:** Default is a generic ecommerce/marketing/AI brand. The build should enhance this by reading brand materials from the repo.

`saveConfig(config)` — writes to `config.json` but **never writes API keys to disk**.

---

## Deployment

### Dockerfile

```dockerfile
FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg python3 python3-pip && \
    pip3 install --break-system-packages yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --production=false

COPY . .
RUN npm run build
RUN npm prune --production

EXPOSE 3000
CMD ["npm", "start"]
```

### render.yaml (Render.com free tier)

```yaml
services:
  - type: web
    name: reel-insight-engine
    runtime: node
    plan: free
    buildCommand: |
      npm install &&
      npm run build &&
      apt-get update && apt-get install -y ffmpeg &&
      pip install yt-dlp
    startCommand: npm start
    envVars:
      - key: NVIDIA_API_KEY
        sync: false
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: NODE_ENV
        value: production
```

---

## How to Use This Spec

### In your brand materials repo:

1. **Copy this file** into the repo
2. **Open Claude Code** in that repo
3. **Tell Claude:** "Read REEL_INSIGHT_ENGINE_SPEC.md and build this tool. Use the brand materials in this repo for the brand profiles."
4. Claude will:
   - Scaffold the project
   - Read your existing brand docs to build rich `BrandProfile` objects
   - Wire up the full pipeline
   - The AI analyzer will score content against YOUR actual brand
5. **Set your env vars** (`NVIDIA_API_KEY`, `TELEGRAM_BOT_TOKEN`)
6. **Run it** — `npm run dev` locally or deploy to Render

### What makes the backlog strategic:

The AI doesn't just dump every video into the backlog. It:
- **Skips** content that scores below relevance 6 or actionability 5
- **Scores brand fit** per-brand with specific reasoning
- **Suggests implementation** — concrete next steps tailored to your business
- **Explains its reasoning** — why this idea matters (or doesn't)
- **Prioritizes automatically** — critical/high/medium/low based on combined scores

You review `BACKLOG.md`, approve/reject items, and use the strategic briefs to drive actual implementation.

---

## Key Design Decisions

1. **BACKLOG.md over a database** — portable, readable in any editor, works on GitHub, no infrastructure
2. **yt-dlp over custom scrapers** — handles both IG and YT, extracts subs automatically, actively maintained
3. **Two-pass AI analysis** — vision pass first (frame-by-frame), then strategic analysis combining visuals + transcript. This catches things that text-only analysis misses.
4. **Free by default** — NVIDIA API key for Kimi K2.5 is free, no credit card needed. Claude is optional upgrade.
5. **Telegram-first** — fastest way to share a link from your phone while scrolling. Web UI and CLI are secondary.
6. **JSON + Markdown dual storage** — `data/backlog.json` for programmatic access (API, CLI, filtering), `BACKLOG.md` for human review and portability.
