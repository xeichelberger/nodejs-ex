import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { ContentSource, Platform } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): Platform | null {
  const lower = url.toLowerCase();
  if (
    lower.includes("instagram.com") ||
    lower.includes("instagr.am") ||
    lower.includes("/reel/") ||
    lower.includes("/reels/")
  ) {
    return "instagram";
  }
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("/shorts/")
  ) {
    return "youtube";
  }
  return null;
}

/**
 * Extract video ID from URL
 */
function extractVideoId(url: string, platform: Platform): string {
  if (platform === "youtube") {
    // Handle youtu.be/ID, youtube.com/watch?v=ID, youtube.com/shorts/ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return shortMatch[1];
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return watchMatch[1];
    const shortsMatch = url.match(/\/shorts\/([^?&/]+)/);
    if (shortsMatch) return shortsMatch[1];
  }
  if (platform === "instagram") {
    // Handle /reel/CODE/ or /reels/CODE/
    const reelMatch = url.match(/\/reels?\/([^/?]+)/);
    if (reelMatch) return reelMatch[1];
  }
  // Fallback: hash the URL
  return Buffer.from(url).toString("base64url").slice(0, 16);
}

/**
 * Check if yt-dlp is available
 */
export async function checkYtDlp(): Promise<boolean> {
  try {
    await execFileAsync("yt-dlp", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if ffmpeg is available
 */
export async function checkFfmpeg(): Promise<boolean> {
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    return true;
  } catch {
    return false;
  }
}

export interface DownloadResult {
  source: ContentSource;
  videoPath: string;
  audioPath: string | null;
  subtitlePath: string | null;
  infoJson: Record<string, unknown> | null;
}

/**
 * Download a video and extract metadata, audio, and subtitles using yt-dlp
 */
export async function downloadVideo(
  url: string,
  tempDir: string
): Promise<DownloadResult> {
  const platform = detectPlatform(url);
  if (!platform) {
    throw new Error(
      `Unsupported URL. Only Instagram Reels and YouTube videos are supported.`
    );
  }

  const videoId = extractVideoId(url, platform);
  const outputDir = path.join(tempDir, `${platform}_${videoId}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const videoOutput = path.join(outputDir, "video.%(ext)s");

  console.log(`[downloader] Downloading from ${platform}: ${url}`);

  // Download video with subtitles and metadata
  const ytDlpArgs = [
    url,
    "-o",
    videoOutput,
    "--write-auto-subs",
    "--write-subs",
    "--sub-langs",
    "en.*,en",
    "--sub-format",
    "vtt/srt/best",
    "--write-info-json",
    "--no-playlist",
    "--format",
    "bestvideo[height<=720]+bestaudio/best[height<=720]/best",
    "--merge-output-format",
    "mp4",
    "--no-check-certificates",
    "--socket-timeout",
    "30",
    "--retries",
    "3",
  ];

  // IG often needs cookies or specific user-agent
  if (platform === "instagram") {
    ytDlpArgs.push(
      "--user-agent",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
    );
  }

  try {
    const { stdout, stderr } = await execFileAsync("yt-dlp", ytDlpArgs, {
      timeout: 120_000,
    });
    if (stderr) {
      console.log(`[downloader] yt-dlp warnings: ${stderr.slice(0, 500)}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to download video: ${msg}`);
  }

  // Find downloaded files
  const files = fs.readdirSync(outputDir);
  const videoFile = files.find(
    (f) => f.startsWith("video.") && !f.endsWith(".json") && !f.includes(".vtt") && !f.includes(".srt")
  );
  const subtitleFile = files.find(
    (f) => f.endsWith(".vtt") || f.endsWith(".srt")
  );
  const infoFile = files.find((f) => f.endsWith(".info.json"));

  if (!videoFile) {
    throw new Error("Video download failed — no video file found");
  }

  const videoPath = path.join(outputDir, videoFile);

  // Parse info json for metadata
  let infoJson: Record<string, unknown> | null = null;
  if (infoFile) {
    try {
      infoJson = JSON.parse(
        fs.readFileSync(path.join(outputDir, infoFile), "utf-8")
      );
    } catch {
      // ignore parse errors
    }
  }

  // Extract audio as separate file
  let audioPath: string | null = null;
  try {
    audioPath = path.join(outputDir, "audio.mp3");
    await execFileAsync("ffmpeg", [
      "-i",
      videoPath,
      "-vn",
      "-acodec",
      "libmp3lame",
      "-q:a",
      "4",
      "-y",
      audioPath,
    ], { timeout: 60_000 });
  } catch {
    audioPath = null;
    console.log("[downloader] Could not extract audio track");
  }

  const source: ContentSource = {
    url,
    platform,
    videoId,
    title: infoJson?.title as string | undefined,
    author:
      (infoJson?.uploader as string) ??
      (infoJson?.channel as string) ??
      undefined,
    duration: infoJson?.duration as number | undefined,
  };

  return {
    source,
    videoPath,
    audioPath,
    subtitlePath: subtitleFile
      ? path.join(outputDir, subtitleFile)
      : null,
    infoJson,
  };
}

/**
 * Clean up temp files for a download
 */
export function cleanupDownload(tempDir: string, source: ContentSource): void {
  const dir = path.join(
    tempDir,
    `${source.platform}_${source.videoId}`
  );
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
