import { downloadVideo, cleanupDownload, checkYtDlp, checkFfmpeg } from "./downloader";
import { extractFrames } from "./frameExtractor";
import { extractTranscript } from "./transcriber";
import { analyzeContent } from "./analyzer";
import { BacklogManager } from "./backlog";
import { addToNotion } from "./notion";
import { AppConfig, AnalysisPipelineResult, ExtractionResult } from "./types";

/**
 * Check that required system dependencies are available
 */
export async function checkDependencies(): Promise<{
  ytDlp: boolean;
  ffmpeg: boolean;
  allGood: boolean;
}> {
  const [ytDlp, ffmpeg] = await Promise.all([checkYtDlp(), checkFfmpeg()]);
  return { ytDlp, ffmpeg, allGood: ytDlp && ffmpeg };
}

/**
 * Run the full analysis pipeline on a URL:
 * Download → Extract frames + transcript → Analyze with Claude → Add to backlog
 */
export async function runPipeline(
  url: string,
  config: AppConfig,
  backlog: BacklogManager
): Promise<AnalysisPipelineResult> {
  // Check for duplicates
  if (backlog.hasUrl(url)) {
    return {
      success: false,
      skipped: true,
      skipReason: "URL already exists in the backlog",
    };
  }

  // Step 1: Download
  console.log("\n=== Step 1/4: Downloading video ===");
  const download = await downloadVideo(url, config.tempDir);

  try {
    // Step 2: Extract frames
    console.log("\n=== Step 2/4: Extracting frames ===");
    const frames = await extractFrames(download.videoPath, {
      maxFrames: config.maxFrames,
      intervalSec: config.frameIntervalSec,
    });

    // Step 3: Extract transcript
    console.log("\n=== Step 3/4: Extracting transcript ===");
    const transcriptResult = extractTranscript(download.subtitlePath);

    const extraction: ExtractionResult = {
      source: download.source,
      transcript: transcriptResult.text,
      transcriptSource: transcriptResult.source,
      frames,
      audioPath: download.audioPath,
      videoPath: download.videoPath,
    };

    // Step 4: Analyze with Claude
    console.log("\n=== Step 4/4: Analyzing with Claude ===");
    const analysis = await analyzeContent({
      frames: extraction.frames,
      transcript: extraction.transcript,
      source: extraction.source,
      brands: config.brands,
      apiKey: config.anthropicApiKey,
    });

    // Decision: add to backlog or skip
    if (analysis.overallRecommendation === "skip") {
      console.log("\n--- SKIPPED: Content not relevant enough ---");
      console.log(`Reason: ${analysis.reasoning}`);
      return {
        success: true,
        skipped: true,
        skipReason: analysis.reasoning,
      };
    }

    // Add to backlog
    const item = backlog.add(
      extraction.source,
      analysis,
      extraction.transcript,
      extraction.frames.map(
        (f) => f.description ?? `Frame at ${f.timestampSec.toFixed(1)}s`
      )
    );

    console.log("\n--- ADDED TO BACKLOG ---");
    console.log(`ID: ${item.id}`);
    console.log(`Priority: ${item.priority}`);
    console.log(`Category: ${analysis.category}`);
    console.log(`Summary: ${analysis.summary}`);

    // Push to Notion if configured
    if (config.notionApiKey && config.notionDatabaseId) {
      try {
        const notionUrl = await addToNotion(item, config);
        console.log(`[notion] Synced to Notion: ${notionUrl}`);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[notion] Failed to sync to Notion: ${errMsg}`);
      }
    }

    return {
      success: true,
      backlogItem: item,
    };
  } finally {
    // Clean up temp files
    cleanupDownload(config.tempDir, download.source);
  }
}
