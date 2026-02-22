import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  AIProvider,
  AppConfig,
  BrandProfile,
  ContentSource,
  ExtractedFrame,
  InsightAnalysis,
} from "./types";

// ─── Provider Clients ─────────────────────────────────────────

const PROVIDER_ENDPOINTS: Record<string, { baseUrl: string; model: string }> = {
  "kimi-nvidia": {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    model: "moonshotai/kimi-k2.5",
  },
  "kimi-moonshot": {
    baseUrl: "https://api.moonshot.cn/v1",
    model: "kimi-k2.5",
  },
  "kimi-together": {
    baseUrl: "https://api.together.xyz/v1",
    model: "moonshotai/Kimi-K2.5",
  },
};

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;
let currentProvider: AIProvider | null = null;

function getAnthropicClient(apiKey?: string): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic(apiKey ? { apiKey } : undefined);
  }
  return anthropicClient;
}

function getOpenAIClient(config: AppConfig): OpenAI {
  if (!openaiClient || currentProvider !== config.aiProvider) {
    const providerCfg = PROVIDER_ENDPOINTS[config.aiProvider];
    let baseURL: string;
    let apiKey: string;

    if (config.aiProvider === "openai-compatible") {
      baseURL = config.openaiCompatibleBaseUrl!;
      apiKey = config.openaiCompatibleApiKey!;
    } else {
      baseURL = providerCfg?.baseUrl ?? "https://integrate.api.nvidia.com/v1";
      apiKey = config.kimiApiKey ?? "";
    }

    openaiClient = new OpenAI({ apiKey, baseURL });
    currentProvider = config.aiProvider;
  }
  return openaiClient;
}

function getModel(config: AppConfig): string {
  if (config.openaiCompatibleModel) return config.openaiCompatibleModel;
  return (
    PROVIDER_ENDPOINTS[config.aiProvider]?.model ?? "moonshotai/kimi-k2.5"
  );
}

function isClaude(config: AppConfig): boolean {
  return config.aiProvider === "claude";
}

// ─── Frame Analysis (Vision) ──────────────────────────────────

const FRAME_ANALYSIS_PROMPT = (
  frameCount: number,
  source: ContentSource
) => `These are ${frameCount} key frames extracted at regular intervals from a ${source.platform === "instagram" ? "Instagram Reel" : "YouTube video"}${source.title ? ` titled "${source.title}"` : ""}.

Analyze the visual content across all frames and describe:
1. What is being shown visually (products, people, text overlays, demonstrations, B-roll, screen recordings, etc.)
2. What the speaker/presenter looks like and their presentation style (if a person is visible)
3. Any on-screen text, graphics, data, or call-to-actions
4. The production style (talking head, screen share, cinematic, UGC-style, slideshow, etc.)
5. The overall visual narrative — what story do the frames tell when viewed in sequence

Be specific and detailed. This visual context will be combined with a transcript to fully understand the content's message.`;

async function analyzeFramesClaude(
  frames: ExtractedFrame[],
  source: ContentSource,
  config: AppConfig
): Promise<string> {
  const anthropic = getAnthropicClient(config.anthropicApiKey);

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];
  for (const frame of frames) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: frame.base64 },
    });
  }
  content.push({
    type: "text",
    text: FRAME_ANALYSIS_PROMPT(frames.length, source),
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b: any) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  return textBlock?.text ?? "Could not analyze frames.";
}

async function analyzeFramesKimi(
  frames: ExtractedFrame[],
  source: ContentSource,
  config: AppConfig
): Promise<string> {
  const client = getOpenAIClient(config);
  const model = getModel(config);

  // Build OpenAI-compatible content with images
  const content: OpenAI.Chat.ChatCompletionContentPart[] = [];
  for (const frame of frames) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${frame.base64}` },
    });
  }
  content.push({
    type: "text",
    text: FRAME_ANALYSIS_PROMPT(frames.length, source),
  });

  const response = await client.chat.completions.create({
    model,
    max_tokens: 2000,
    messages: [{ role: "user", content }],
  });

  return response.choices[0]?.message?.content ?? "Could not analyze frames.";
}

async function analyzeFrames(
  frames: ExtractedFrame[],
  source: ContentSource,
  config: AppConfig
): Promise<string> {
  if (frames.length === 0) {
    return "No frames available for visual analysis.";
  }

  const providerLabel = isClaude(config) ? "Claude" : "Kimi K2.5";
  console.log(`[analyzer] Sending ${frames.length} frames to ${providerLabel} Vision...`);

  if (isClaude(config)) {
    return analyzeFramesClaude(frames, source, config);
  } else {
    return analyzeFramesKimi(frames, source, config);
  }
}

// ─── Insight Analysis ─────────────────────────────────────────

function buildInsightPrompt(
  transcript: string | null,
  visualAnalysis: string,
  source: ContentSource,
  brands: BrandProfile[]
): string {
  const brandDescriptions = brands
    .map(
      (b) =>
        `- **${b.name}**: ${b.description} | Verticals: ${b.verticals.join(", ")} | Audience: ${b.targetAudience} | Tone: ${b.toneKeywords.join(", ")}`
    )
    .join("\n");

  return `You are an expert content strategist specializing in ecommerce, digital marketing, and AI-powered business growth. You are evaluating a ${source.platform === "instagram" ? "Instagram Reel" : "YouTube video"} as a potential source of ideas for our brand(s).

## Source Information
- **Platform**: ${source.platform === "instagram" ? "Instagram Reels" : "YouTube"}
- **URL**: ${source.url}
${source.title ? `- **Title**: ${source.title}` : ""}
${source.author ? `- **Creator**: ${source.author}` : ""}
${source.duration ? `- **Duration**: ${source.duration}s` : ""}

## Visual Analysis (from frame-by-frame review)
${visualAnalysis}

## Transcript / Spoken Content
${transcript ? transcript : "No transcript available. Rely on visual analysis only."}

## Our Brand(s)
${brandDescriptions}

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
- **relevanceScore**: How relevant is this to ecommerce/marketing/AI? (1=irrelevant, 10=directly applicable)
- **actionability**: How easy is it to act on this insight? (1=vague/theoretical, 10=clear playbook)
- **brandFitScores**: Per-brand fit (1=completely off-brand, 10=perfect alignment)
- Recommend "add_to_backlog" if relevance >= 6 AND actionability >= 5
- Recommend "review_later" if promising but unclear
- Recommend "skip" if irrelevant or low-quality

Return ONLY the JSON object, no markdown fencing or explanation.`;
}

async function analyzeInsightClaude(
  prompt: string,
  config: AppConfig
): Promise<string> {
  const anthropic = getAnthropicClient(config.anthropicApiKey);
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = response.content.find((b: any) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  return textBlock?.text ?? "";
}

async function analyzeInsightKimi(
  prompt: string,
  config: AppConfig
): Promise<string> {
  const client = getOpenAIClient(config);
  const response = await client.chat.completions.create({
    model: getModel(config),
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content ?? "";
}

async function analyzeInsight(
  transcript: string | null,
  visualAnalysis: string,
  source: ContentSource,
  brands: BrandProfile[],
  config: AppConfig
): Promise<InsightAnalysis> {
  const prompt = buildInsightPrompt(transcript, visualAnalysis, source, brands);

  console.log("[analyzer] Running insight analysis...");

  const raw = isClaude(config)
    ? await analyzeInsightClaude(prompt, config)
    : await analyzeInsightKimi(prompt, config);

  // Parse JSON from response (handle potential markdown fencing)
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const analysis = JSON.parse(jsonStr) as InsightAnalysis;
    return analysis;
  } catch {
    console.error(
      "[analyzer] Failed to parse analysis JSON, raw output:",
      raw.slice(0, 500)
    );
    return {
      summary: raw.slice(0, 300),
      keyInsights: ["Analysis parsing failed — review raw output"],
      visualContext: visualAnalysis.slice(0, 200),
      spokenContent: transcript?.slice(0, 200) ?? "No transcript",
      category: "other",
      relevanceScore: 5,
      actionability: 5,
      brandFitScores: brands.map((b) => ({
        brandName: b.name,
        score: 5,
        reasoning: "Could not parse automated analysis",
      })),
      overallRecommendation: "review_later",
      reasoning:
        "Automated analysis could not be parsed. Please review manually.",
      suggestedImplementation: "Manual review needed.",
      tags: ["parse-error", "needs-review"],
    };
  }
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Full analysis pipeline: frames → vision → insight analysis.
 * Automatically uses the configured AI provider (Claude or Kimi).
 */
export async function analyzeContent(params: {
  frames: ExtractedFrame[];
  transcript: string | null;
  source: ContentSource;
  brands: BrandProfile[];
  config: AppConfig;
}): Promise<InsightAnalysis> {
  const { frames, transcript, source, brands, config } = params;

  // Step 1: Visual analysis of frames
  const visualAnalysis = await analyzeFrames(frames, source, config);
  console.log(
    `[analyzer] Visual analysis complete (${visualAnalysis.length} chars)`
  );

  // Step 2: Combined insight analysis
  const analysis = await analyzeInsight(
    transcript,
    visualAnalysis,
    source,
    brands,
    config
  );

  console.log(
    `[analyzer] Insight analysis complete — Recommendation: ${analysis.overallRecommendation} (relevance: ${analysis.relevanceScore}, actionability: ${analysis.actionability})`
  );

  return analysis;
}
