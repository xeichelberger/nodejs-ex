import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { ExtractedFrame } from "./types";

const execFileAsync = promisify(execFile);

/**
 * Get video duration in seconds using ffprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "csv=p=0",
    videoPath,
  ]);
  return parseFloat(stdout.trim()) || 0;
}

/**
 * Extract key frames from a video at regular intervals.
 * Returns base64-encoded JPEG frames with timestamps.
 */
export async function extractFrames(
  videoPath: string,
  options: {
    maxFrames?: number;
    intervalSec?: number;
    outputDir?: string;
  } = {}
): Promise<ExtractedFrame[]> {
  const maxFrames = options.maxFrames ?? 8;
  const intervalSec = options.intervalSec ?? 5;
  const outputDir =
    options.outputDir ?? path.join(path.dirname(videoPath), "frames");

  fs.mkdirSync(outputDir, { recursive: true });

  // Get video duration
  const duration = await getVideoDuration(videoPath);
  if (duration <= 0) {
    throw new Error("Could not determine video duration");
  }

  // Calculate frame timestamps
  // For short videos (<30s), take more frequent samples
  const effectiveInterval = duration < 30 ? Math.max(2, duration / maxFrames) : intervalSec;
  const timestamps: number[] = [];

  // Always grab the first frame (1 second in to skip black frames)
  timestamps.push(Math.min(1, duration * 0.1));

  for (
    let t = effectiveInterval;
    t < duration && timestamps.length < maxFrames;
    t += effectiveInterval
  ) {
    timestamps.push(t);
  }

  // If we have room, grab a frame near the end
  if (timestamps.length < maxFrames && duration > 3) {
    timestamps.push(duration - 1);
  }

  console.log(
    `[frames] Extracting ${timestamps.length} frames from ${duration.toFixed(1)}s video`
  );

  const frames: ExtractedFrame[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const framePath = path.join(outputDir, `frame_${i}_${ts.toFixed(1)}s.jpg`);

    try {
      await execFileAsync(
        "ffmpeg",
        [
          "-ss",
          ts.toFixed(2),
          "-i",
          videoPath,
          "-vframes",
          "1",
          "-q:v",
          "3", // JPEG quality (2-5, lower is better)
          "-vf",
          "scale=720:-2", // Scale to 720px width, maintain aspect
          "-y",
          framePath,
        ],
        { timeout: 15_000 }
      );

      if (fs.existsSync(framePath)) {
        const base64 = fs.readFileSync(framePath).toString("base64");
        frames.push({
          path: framePath,
          timestampSec: ts,
          base64,
        });
      }
    } catch (err) {
      console.log(
        `[frames] Warning: Could not extract frame at ${ts.toFixed(1)}s`
      );
    }
  }

  console.log(`[frames] Successfully extracted ${frames.length} frames`);
  return frames;
}
