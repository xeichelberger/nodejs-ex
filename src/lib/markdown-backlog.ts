import fs from "fs";
import path from "path";
import { BacklogItem } from "./types";

const BACKLOG_FILENAME = "BACKLOG.md";

/**
 * Append a backlog item to BACKLOG.md in the project root.
 * Creates the file with a header if it doesn't exist yet.
 */
export function appendToMarkdownBacklog(
  item: BacklogItem,
  rootDir?: string
): string {
  const dir = rootDir ?? path.resolve(__dirname, "../..");
  const filePath = path.join(dir, BACKLOG_FILENAME);
  const a = item.analysis;

  // Create file with header if it doesn't exist
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(
      filePath,
      "# Reel Insight Engine — Content Backlog\n\n" +
        "Ideas and insights captured from Instagram Reels and YouTube videos.\n\n" +
        "---\n\n"
    );
  }

  // Build the markdown entry
  const priorityIcon =
    item.priority === "critical"
      ? "🟥"
      : item.priority === "high"
        ? "🟧"
        : item.priority === "medium"
          ? "🟦"
          : "⬜";

  const platformIcon =
    item.source.platform === "instagram" ? "📸" : "🎥";

  const brandFitLines = a.brandFitScores
    .map((b) => `  - **${b.brandName}**: ${b.score}/10 — ${b.reasoning}`)
    .join("\n");

  const insightLines = a.keyInsights
    .map((insight) => `- ${insight}`)
    .join("\n");

  const tagLine = a.tags.length > 0
    ? a.tags.map((t) => `\`${t}\``).join(" ")
    : "_none_";

  const entry = [
    `## ${platformIcon} ${a.summary}`,
    "",
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Status** | ${item.status} |`,
    `| **Priority** | ${priorityIcon} ${item.priority} |`,
    `| **Category** | ${a.category} |`,
    `| **Platform** | ${item.source.platform} |`,
    `| **Relevance** | ${a.relevanceScore}/10 |`,
    `| **Actionability** | ${a.actionability}/10 |`,
    `| **Recommendation** | ${a.overallRecommendation} |`,
    `| **Source** | [${item.source.title ?? "Link"}](${item.source.url}) |`,
    item.source.author ? `| **Creator** | ${item.source.author} |` : null,
    item.source.duration ? `| **Duration** | ${item.source.duration}s |` : null,
    `| **Date** | ${item.createdAt.split("T")[0]} |`,
    `| **ID** | \`${item.id}\` |`,
    "",
    "### Key Insights",
    insightLines,
    "",
    "### Brand Fit",
    brandFitLines || "_No brand scores_",
    "",
    "### Suggested Implementation",
    a.suggestedImplementation,
    "",
    "### AI Reasoning",
    a.reasoning,
    "",
    `**Tags:** ${tagLine}`,
    "",
    "<details>",
    "<summary>Visual Context</summary>",
    "",
    a.visualContext,
    "",
    "</details>",
    "",
    "<details>",
    "<summary>Spoken Content</summary>",
    "",
    a.spokenContent,
    "",
    "</details>",
    item.transcript
      ? [
          "",
          "<details>",
          "<summary>Full Transcript</summary>",
          "",
          item.transcript,
          "",
          "</details>",
        ].join("\n")
      : null,
    "",
    "---",
    "",
  ]
    .filter((line) => line !== null)
    .join("\n");

  fs.appendFileSync(filePath, entry);

  console.log(`[backlog-md] Appended to ${filePath}`);
  return filePath;
}
