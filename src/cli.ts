#!/usr/bin/env node

import { loadConfig, PROVIDER_LABELS } from "./lib/config";
import { BacklogManager } from "./lib/backlog";
import { runPipeline, checkDependencies } from "./lib/pipeline";
import { detectPlatform } from "./lib/downloader";

const config = loadConfig();
const backlog = new BacklogManager(config.dataDir);

function printUsage() {
  console.log(`
Reel Insight Engine - CLI

Usage:
  reel-insight analyze <url>              Analyze an IG Reel or YouTube video
  reel-insight backlog                    List all backlog items
  reel-insight backlog stats              Show backlog statistics
  reel-insight backlog view <id>          View a specific backlog item
  reel-insight backlog approve <id>       Approve a backlog item
  reel-insight backlog reject <id>        Reject a backlog item
  reel-insight backlog delete <id>        Delete a backlog item
  reel-insight check                      Check system dependencies
  reel-insight help                       Show this help

Environment:
  ANTHROPIC_API_KEY    Your Anthropic API key (required for analysis)

Examples:
  reel-insight analyze https://www.youtube.com/shorts/abc123
  reel-insight analyze https://www.instagram.com/reel/abc123/
  reel-insight backlog --status=pending --priority=high
`);
}

function formatItem(item: ReturnType<BacklogManager["getById"]>) {
  if (!item) return "Item not found";

  const lines = [
    `ID:        ${item.id}`,
    `Status:    ${item.status.toUpperCase()}`,
    `Priority:  ${item.priority.toUpperCase()}`,
    `Platform:  ${item.source.platform}`,
    `URL:       ${item.source.url}`,
    item.source.title ? `Title:     ${item.source.title}` : null,
    item.source.author ? `Author:    ${item.source.author}` : null,
    `Category:  ${item.analysis.category}`,
    `Relevance: ${item.analysis.relevanceScore}/10`,
    `Action:    ${item.analysis.actionability}/10`,
    `Created:   ${item.createdAt}`,
    "",
    `--- Summary ---`,
    item.analysis.summary,
    "",
    `--- Key Insights ---`,
    ...item.analysis.keyInsights.map((i, idx) => `  ${idx + 1}. ${i}`),
    "",
    `--- Brand Fit ---`,
    ...item.analysis.brandFitScores.map(
      (b) => `  ${b.brandName}: ${b.score}/10 - ${b.reasoning}`
    ),
    "",
    `--- Recommendation ---`,
    item.analysis.reasoning,
    "",
    `--- Suggested Implementation ---`,
    item.analysis.suggestedImplementation,
    "",
    `Tags: ${item.analysis.tags.join(", ")}`,
  ];

  return lines.filter((l) => l !== null).join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "help") {
    printUsage();
    return;
  }

  if (command === "check") {
    console.log("Checking dependencies...\n");
    const deps = await checkDependencies();
    const hasAiKey =
      config.aiProvider === "claude"
        ? !!config.anthropicApiKey
        : !!(config.kimiApiKey || config.openaiCompatibleApiKey);
    console.log(`  yt-dlp:     ${deps.ytDlp ? "OK" : "MISSING - install with: pip install yt-dlp"}`);
    console.log(`  ffmpeg:     ${deps.ffmpeg ? "OK" : "MISSING - install with: apt install ffmpeg"}`);
    console.log(`  AI:         ${hasAiKey ? "OK" : "MISSING"} (${PROVIDER_LABELS[config.aiProvider]})`);
    console.log(`  Notion:     ${config.notionDatabaseId ? "OK" : "not configured"}`);
    console.log(`  Telegram:   ${config.telegramBotToken ? "OK" : "not configured"}`);
    console.log(
      `\n${deps.allGood && hasAiKey ? "All good! Ready to analyze." : "Please set up missing items above."}`
    );
    return;
  }

  if (command === "analyze") {
    const url = args[1];
    if (!url) {
      console.error("Error: URL is required. Usage: reel-insight analyze <url>");
      process.exit(1);
    }

    const platform = detectPlatform(url);
    if (!platform) {
      console.error("Error: Unsupported URL. Provide an IG Reel or YouTube video URL.");
      process.exit(1);
    }

    const hasAiKey =
      config.aiProvider === "claude"
        ? !!config.anthropicApiKey
        : !!(config.kimiApiKey || config.openaiCompatibleApiKey);
    if (!hasAiKey) {
      console.error(
        `Error: No API key set for ${config.aiProvider}. ` +
          (config.aiProvider === "kimi-nvidia"
            ? "Set NVIDIA_API_KEY (free at build.nvidia.com)"
            : config.aiProvider === "claude"
              ? "Set ANTHROPIC_API_KEY"
              : "Set KIMI_API_KEY")
      );
      process.exit(1);
    }

    // Check deps
    const deps = await checkDependencies();
    if (!deps.allGood) {
      console.error("Error: Missing dependencies. Run 'reel-insight check' for details.");
      process.exit(1);
    }

    try {
      const result = await runPipeline(url, config, backlog);

      if (result.skipped) {
        console.log(`\nSkipped: ${result.skipReason}`);
      } else if (result.backlogItem) {
        console.log("\n" + "=".repeat(60));
        console.log("ADDED TO BACKLOG");
        console.log("=".repeat(60));
        console.log(formatItem(result.backlogItem));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\nAnalysis failed: ${msg}`);
      process.exit(1);
    }
    return;
  }

  if (command === "backlog") {
    const subCommand = args[1];

    if (subCommand === "stats") {
      const stats = backlog.getStats();
      console.log("\n=== Backlog Statistics ===\n");
      console.log(`Total items:          ${stats.total}`);
      console.log(`Avg relevance:        ${stats.avgRelevance.toFixed(1)}/10`);
      console.log(`Avg actionability:    ${stats.avgActionability.toFixed(1)}/10`);
      console.log("\nBy Status:");
      for (const [k, v] of Object.entries(stats.byStatus)) {
        console.log(`  ${k.padEnd(15)} ${v}`);
      }
      console.log("\nBy Priority:");
      for (const [k, v] of Object.entries(stats.byPriority)) {
        console.log(`  ${k.padEnd(15)} ${v}`);
      }
      console.log("\nBy Category:");
      for (const [k, v] of Object.entries(stats.byCategory)) {
        console.log(`  ${k.padEnd(15)} ${v}`);
      }
      console.log("\nBy Platform:");
      for (const [k, v] of Object.entries(stats.byPlatform)) {
        console.log(`  ${k.padEnd(15)} ${v}`);
      }
      return;
    }

    if (subCommand === "view") {
      const id = args[2];
      if (!id) {
        console.error("Error: ID is required");
        process.exit(1);
      }
      const item = backlog.getById(id);
      if (!item) {
        console.error("Error: Item not found");
        process.exit(1);
      }
      console.log(formatItem(item));
      return;
    }

    if (subCommand === "approve" || subCommand === "reject") {
      const id = args[2];
      if (!id) {
        console.error("Error: ID is required");
        process.exit(1);
      }
      const status = subCommand === "approve" ? "approved" : "rejected";
      const item = backlog.updateStatus(id, status);
      if (!item) {
        console.error("Error: Item not found");
        process.exit(1);
      }
      console.log(`Item ${id} marked as ${status.toUpperCase()}`);
      return;
    }

    if (subCommand === "delete") {
      const id = args[2];
      if (!id) {
        console.error("Error: ID is required");
        process.exit(1);
      }
      const deleted = backlog.delete(id);
      if (!deleted) {
        console.error("Error: Item not found");
        process.exit(1);
      }
      console.log(`Item ${id} deleted`);
      return;
    }

    // Default: list all items
    // Parse filter flags
    const filters: Record<string, string> = {};
    for (const arg of args.slice(1)) {
      const match = arg.match(/^--(\w+)=(.+)$/);
      if (match) {
        filters[match[1]] = match[2];
      }
    }

    const items = backlog.getAll(filters);
    if (items.length === 0) {
      console.log("Backlog is empty.");
      return;
    }

    console.log(`\n=== Backlog (${items.length} items) ===\n`);
    for (const item of items) {
      const fit = item.analysis.brandFitScores[0];
      console.log(
        [
          `[${item.status.toUpperCase().padEnd(11)}]`,
          `[${item.priority.toUpperCase().padEnd(8)}]`,
          `${item.analysis.relevanceScore}/10`,
          `| ${item.source.platform.padEnd(9)}`,
          `| ${item.analysis.category.padEnd(10)}`,
          `| ${item.analysis.summary.slice(0, 80)}...`,
        ].join(" ")
      );
      console.log(`  ID: ${item.id} | URL: ${item.source.url}`);
      if (fit) {
        console.log(`  Brand fit: ${fit.brandName} ${fit.score}/10`);
      }
      console.log("");
    }
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
