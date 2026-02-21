import Anthropic from "@anthropic-ai/sdk";
import {
  BrandProfile,
  ContentSource,
  ExtractedFrame,
  InsightAnalysis,
} from "./types";

let client: Anthropic | null = null;

function getClient(apiKey?: string): Anthropic {
  if (!client) {
    client = new Anthropic(apiKey ? { apiKey } : undefined);
  }
  return client;
}

/**
 * Use Claude Vision to describe what's happening in each frame.
 * Sends all frames in a single request for context continuity.
 */
async function analyzeFrames(
  frames: ExtractedFrame[],
  source: ContentSource,
  apiKey?: string
): Promise<string> {
  if (frames.length === 0) {
    return "No frames available for visual analysis.";
  }

  const anthropic = getClient(apiKey);

  // Build content array with all frames + analysis prompt
  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = [];

  // Add each frame as an image
  for (const frame of frames) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: frame.base64,
      },
    });
  }

  content.push({
    type: "text",
    text: `These are ${frames.length} key frames extracted at regular intervals from a ${source.platform === "instagram" ? "Instagram Reel" : "YouTube video"}${source.title ? ` titled "${source.title}"` : ""}.

Analyze the visual content across all frames and describe:
1. What is being shown visually (products, people, text overlays, demonstrations, B-roll, screen recordings, etc.)
2. What the speaker/presenter looks like and their presentation style (if a person is visible)
3. Any on-screen text, graphics, data, or call-to-actions
4. The production style (talking head, screen share, cinematic, UGC-style, slideshow, etc.)
5. The overall visual narrative — what story do the frames tell when viewed in sequence

Be specific and detailed. This visual context will be combined with a transcript to fully understand the content's message.`,
  });

  console.log("[analyzer] Sending frames to Claude Vision...");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 2000,
    // adaptive thinking - cast needed as SDK types may lag behind API support
    thinking: { type: "adaptive" } as any,
    messages: [{ role: "user", content }],
  });

  // Extract text response
  const textBlock = response.content.find((b: any) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  return textBlock?.text ?? "Could not analyze frames.";
}

/**
 * Main analysis: combine transcript + visual analysis + brand context
 * to produce a full insight analysis with scoring.
 */
async function analyzeInsight(
  transcript: string | null,
  visualAnalysis: string,
  source: ContentSource,
  brands: BrandProfile[],
  apiKey?: string
): Promise<InsightAnalysis> {
  const anthropic = getClient(apiKey);

  const brandDescriptions = brands
    .map(
      (b) =>
        `- **${b.name}**: ${b.description} | Verticals: ${b.verticals.join(", ")} | Audience: ${b.targetAudience} | Tone: ${b.toneKeywords.join(", ")}`
    )
    .join("\n");

  const prompt = `You are an expert content strategist specializing in ecommerce, digital marketing, and AI-powered business growth. You are evaluating a ${source.platform === "instagram" ? "Instagram Reel" : "YouTube video"} as a potential source of ideas for our brand(s).

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

  console.log("[analyzer] Running insight analysis...");

  const response = await anthropic.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    // adaptive thinking - cast needed as SDK types may lag behind API support
    thinking: { type: "adaptive" } as any,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b: any) => b.type === "text") as
    | { type: "text"; text: string }
    | undefined;
  const raw = textBlock?.text ?? "";

  // Parse JSON from response (handle potential markdown fencing)
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  try {
    const analysis = JSON.parse(jsonStr) as InsightAnalysis;
    return analysis;
  } catch {
    console.error("[analyzer] Failed to parse analysis JSON, raw output:", raw.slice(0, 500));
    // Return a fallback analysis
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
      reasoning: "Automated analysis could not be parsed. Please review manually.",
      suggestedImplementation: "Manual review needed.",
      tags: ["parse-error", "needs-review"],
    };
  }
}

/**
 * Full analysis pipeline: frames → vision → insight analysis
 */
export async function analyzeContent(params: {
  frames: ExtractedFrame[];
  transcript: string | null;
  source: ContentSource;
  brands: BrandProfile[];
  apiKey?: string;
}): Promise<InsightAnalysis> {
  const { frames, transcript, source, brands, apiKey } = params;

  // Step 1: Visual analysis of frames
  const visualAnalysis = await analyzeFrames(frames, source, apiKey);
  console.log(
    `[analyzer] Visual analysis complete (${visualAnalysis.length} chars)`
  );

  // Step 2: Combined insight analysis
  const analysis = await analyzeInsight(
    transcript,
    visualAnalysis,
    source,
    brands,
    apiKey
  );

  console.log(
    `[analyzer] Insight analysis complete — Recommendation: ${analysis.overallRecommendation} (relevance: ${analysis.relevanceScore}, actionability: ${analysis.actionability})`
  );

  return analysis;
}
