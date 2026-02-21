export type Platform = "instagram" | "youtube";

export type BacklogStatus = "pending" | "approved" | "rejected" | "implemented";

export type BacklogPriority = "low" | "medium" | "high" | "critical";

export interface BrandProfile {
  name: string;
  description: string;
  verticals: string[]; // e.g. ["ecommerce", "marketing", "AI"]
  targetAudience: string;
  toneKeywords: string[]; // e.g. ["professional", "innovative", "approachable"]
}

export interface ContentSource {
  url: string;
  platform: Platform;
  videoId: string;
  title?: string;
  author?: string;
  duration?: number; // seconds
}

export interface ExtractionResult {
  source: ContentSource;
  transcript: string | null;
  transcriptSource: "auto_captions" | "manual_subs" | "whisper" | "none";
  frames: ExtractedFrame[];
  audioPath: string | null;
  videoPath: string | null;
}

export interface ExtractedFrame {
  path: string;
  timestampSec: number;
  base64: string;
  description?: string; // filled by Claude vision
}

export interface InsightAnalysis {
  summary: string;
  keyInsights: string[];
  visualContext: string;
  spokenContent: string;
  category: "ecommerce" | "marketing" | "AI" | "growth" | "branding" | "content" | "other";
  relevanceScore: number; // 1-10
  actionability: number; // 1-10
  brandFitScores: BrandFitScore[];
  overallRecommendation: "add_to_backlog" | "skip" | "review_later";
  reasoning: string;
  suggestedImplementation: string;
  tags: string[];
}

export interface BrandFitScore {
  brandName: string;
  score: number; // 1-10
  reasoning: string;
}

export interface BacklogItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  source: ContentSource;
  analysis: InsightAnalysis;
  status: BacklogStatus;
  priority: BacklogPriority;
  notes: string;
  transcript: string | null;
  frameDescriptions: string[];
}

export interface AnalysisPipelineResult {
  success: boolean;
  backlogItem?: BacklogItem;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface AppConfig {
  brands: BrandProfile[];
  anthropicApiKey?: string;
  dataDir: string;
  tempDir: string;
  minRelevanceScore: number; // threshold for auto-adding to backlog
  maxFrames: number; // max frames to extract per video
  frameIntervalSec: number; // seconds between frame captures
  port: number;
}
