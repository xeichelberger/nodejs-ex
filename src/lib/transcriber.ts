import fs from "fs";

/**
 * Parse VTT or SRT subtitle file into plain text transcript
 */
function parseSubtitles(content: string): string {
  const lines = content.split("\n");
  const textLines: string[] = [];
  let prevLine = "";

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip VTT header
    if (line === "WEBVTT" || line.startsWith("Kind:") || line.startsWith("Language:")) {
      continue;
    }

    // Skip timestamps (both VTT and SRT formats)
    if (line.match(/^\d{2}:\d{2}[:\.]/) || line.match(/^\d{1,2}$/)) {
      continue;
    }

    // Skip empty lines
    if (!line) continue;

    // Skip sequence numbers (SRT)
    if (/^\d+$/.test(line)) continue;

    // Clean up VTT tags like <c> and positioning
    let clean = line
      .replace(/<[^>]+>/g, "")
      .replace(/\{[^}]+\}/g, "")
      .replace(/^align:.*$/i, "")
      .replace(/^position:.*$/i, "")
      .trim();

    if (!clean) continue;

    // Deduplicate consecutive identical lines (common in auto-captions)
    if (clean !== prevLine) {
      textLines.push(clean);
      prevLine = clean;
    }
  }

  return textLines.join(" ").replace(/\s+/g, " ").trim();
}

export interface TranscriptResult {
  text: string | null;
  source: "auto_captions" | "manual_subs" | "none";
}

/**
 * Extract transcript from available subtitles.
 * Subtitle file should have been downloaded by yt-dlp.
 */
export function extractTranscript(
  subtitlePath: string | null
): TranscriptResult {
  if (!subtitlePath || !fs.existsSync(subtitlePath)) {
    console.log("[transcriber] No subtitle file available");
    return { text: null, source: "none" };
  }

  console.log(`[transcriber] Parsing subtitles from: ${subtitlePath}`);

  const content = fs.readFileSync(subtitlePath, "utf-8");
  const transcript = parseSubtitles(content);

  if (!transcript || transcript.length < 10) {
    console.log("[transcriber] Subtitle file had no usable content");
    return { text: null, source: "none" };
  }

  // Determine if auto-generated or manual
  const isAuto =
    subtitlePath.includes(".auto.") ||
    subtitlePath.includes("auto-generated") ||
    content.includes("Kind: captions");

  const source = isAuto ? "auto_captions" : "manual_subs";

  console.log(
    `[transcriber] Extracted ${transcript.length} chars (${source})`
  );

  return { text: transcript, source };
}
