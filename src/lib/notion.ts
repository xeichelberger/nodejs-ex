import { Client } from "@notionhq/client";
import {
  BacklogItem,
  BacklogStatus,
  BacklogPriority,
  ContentSource,
  InsightAnalysis,
  AppConfig,
} from "./types";

let notion: Client | null = null;

function getClient(apiKey: string): Client {
  if (!notion) {
    notion = new Client({ auth: apiKey });
  }
  return notion;
}

// Notion status → emoji mapping for visual clarity
const STATUS_EMOJI: Record<BacklogStatus, string> = {
  pending: "🟡",
  approved: "🟢",
  rejected: "🔴",
  implemented: "✅",
};

const PRIORITY_EMOJI: Record<BacklogPriority, string> = {
  low: "⬜",
  medium: "🟦",
  high: "🟧",
  critical: "🟥",
};

/**
 * Create the Reel Insight database in Notion.
 * Returns the new database ID.
 */
export async function createNotionDatabase(
  config: AppConfig
): Promise<string> {
  if (!config.notionApiKey) {
    throw new Error("NOTION_API_KEY is required");
  }

  const client = getClient(config.notionApiKey);

  // Build parent — either under a specific page or as a top-level page
  const parent: any = config.notionParentPageId
    ? { type: "page_id", page_id: config.notionParentPageId }
    : { type: "page_id", page_id: config.notionParentPageId! };

  if (!config.notionParentPageId) {
    throw new Error(
      "NOTION_PARENT_PAGE_ID is required. Create a page in Notion and copy its ID from the URL."
    );
  }

  // Cast needed because Notion SDK types don't expose all valid properties
  const db = await (client.databases.create as Function)({
    parent,
    title: [{ type: "text", text: { content: "Reel Insight Engine" } }],
    icon: { type: "emoji", emoji: "🎬" },
    properties: {
      Name: { title: {} },
      Status: {
        select: {
          options: [
            { name: "🟡 Pending", color: "yellow" },
            { name: "🟢 Approved", color: "green" },
            { name: "🔴 Rejected", color: "red" },
            { name: "✅ Implemented", color: "blue" },
          ],
        },
      },
      Priority: {
        select: {
          options: [
            { name: "🟥 Critical", color: "red" },
            { name: "🟧 High", color: "orange" },
            { name: "🟦 Medium", color: "blue" },
            { name: "⬜ Low", color: "default" },
          ],
        },
      },
      "Relevance (1-10)": { number: {} },
      "Actionability (1-10)": { number: {} },
      "Brand Fit (1-10)": { number: {} },
      Category: {
        select: {
          options: [
            { name: "ecommerce", color: "green" },
            { name: "marketing", color: "purple" },
            { name: "AI", color: "blue" },
            { name: "growth", color: "orange" },
            { name: "branding", color: "pink" },
            { name: "content", color: "yellow" },
            { name: "other", color: "default" },
          ],
        },
      },
      Platform: {
        select: {
          options: [
            { name: "Instagram", color: "pink" },
            { name: "YouTube", color: "red" },
          ],
        },
      },
      URL: { url: {} },
      Creator: { rich_text: {} },
      Tags: { multi_select: { options: [] } },
      "Date Added": { date: {} },
    },
  });

  console.log(`[notion] Created database: ${db.id}`);
  return db.id;
}

/**
 * Add a backlog item as a page in the Notion database.
 * Returns the Notion page URL.
 */
export async function addToNotion(
  item: BacklogItem,
  config: AppConfig
): Promise<string> {
  if (!config.notionApiKey || !config.notionDatabaseId) {
    throw new Error("Notion API key and database ID are required");
  }

  const client = getClient(config.notionApiKey);
  const a = item.analysis;

  // Get the top brand fit score
  const topBrandFit = a.brandFitScores[0]?.score ?? 0;

  const page = await client.pages.create({
    parent: { database_id: config.notionDatabaseId },
    icon: { type: "emoji", emoji: item.source.platform === "instagram" ? "📸" : "🎥" },
    properties: {
      Name: {
        title: [{ text: { content: a.summary.slice(0, 200) } }],
      },
      Status: {
        select: { name: `${STATUS_EMOJI[item.status]} ${capitalize(item.status)}` },
      },
      Priority: {
        select: { name: `${PRIORITY_EMOJI[item.priority]} ${capitalize(item.priority)}` },
      },
      "Relevance (1-10)": { number: a.relevanceScore },
      "Actionability (1-10)": { number: a.actionability },
      "Brand Fit (1-10)": { number: topBrandFit },
      Category: { select: { name: a.category } },
      Platform: {
        select: {
          name: item.source.platform === "instagram" ? "Instagram" : "YouTube",
        },
      },
      URL: { url: item.source.url },
      Creator: {
        rich_text: item.source.author
          ? [{ text: { content: item.source.author } }]
          : [],
      },
      Tags: {
        multi_select: a.tags.slice(0, 10).map((t) => ({ name: t.slice(0, 100) })),
      },
      "Date Added": { date: { start: item.createdAt } },
    },
    // Page content = detailed analysis
    children: buildPageContent(item),
  });

  const pageUrl = (page as any).url as string;
  console.log(`[notion] Added page: ${pageUrl}`);
  return pageUrl;
}

/**
 * Build rich page content blocks for the Notion page body.
 */
function buildPageContent(item: BacklogItem): any[] {
  const a = item.analysis;
  const blocks: any[] = [];

  // Key Insights heading
  blocks.push(heading2("Key Insights"));
  for (const insight of a.keyInsights) {
    blocks.push(bulletItem(insight));
  }

  // Brand Fit
  if (a.brandFitScores.length > 0) {
    blocks.push(heading2("Brand Fit"));
    for (const b of a.brandFitScores) {
      blocks.push(
        bulletItem(`${b.brandName}: ${b.score}/10 — ${b.reasoning}`)
      );
    }
  }

  // Visual Context
  blocks.push(heading2("Visual Context"));
  blocks.push(paragraph(a.visualContext));

  // Spoken Content
  blocks.push(heading2("Spoken Content"));
  blocks.push(paragraph(a.spokenContent));

  // Suggested Implementation
  blocks.push(heading2("Suggested Implementation"));
  blocks.push(paragraph(a.suggestedImplementation));

  // Reasoning
  blocks.push(heading2("Analysis Reasoning"));
  blocks.push(paragraph(a.reasoning));

  // Transcript
  if (item.transcript) {
    blocks.push(heading2("Full Transcript"));
    // Notion has a 2000 char limit per block
    const chunks = chunkString(item.transcript, 1900);
    for (const chunk of chunks) {
      blocks.push(paragraph(chunk));
    }
  }

  // Source info
  blocks.push(divider());
  blocks.push(
    paragraph(
      `Source: ${item.source.platform} | ${item.source.url}${item.source.author ? ` | Creator: ${item.source.author}` : ""}${item.source.duration ? ` | Duration: ${item.source.duration}s` : ""}`
    )
  );

  return blocks;
}

// ─── Notion block helpers ─────────────────────────────────────

function heading2(text: string) {
  return {
    object: "block",
    type: "heading_2",
    heading_2: { rich_text: [{ type: "text", text: { content: text } }] },
  };
}

function paragraph(text: string) {
  return {
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }],
    },
  };
}

function bulletItem(text: string) {
  return {
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: {
      rich_text: [{ type: "text", text: { content: text.slice(0, 2000) } }],
    },
  };
}

function divider() {
  return { object: "block", type: "divider", divider: {} };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}
