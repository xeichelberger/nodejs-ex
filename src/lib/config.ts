import path from "path";
import fs from "fs";
import { AppConfig, BrandProfile } from "./types";

const ROOT_DIR = path.resolve(__dirname, "../..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const TEMP_DIR = path.join(ROOT_DIR, "tmp");

const DEFAULT_BRANDS: BrandProfile[] = [
  {
    name: "Default Brand",
    description:
      "A modern ecommerce and digital marketing brand focused on AI-powered growth strategies",
    verticals: ["ecommerce", "marketing", "AI"],
    targetAudience:
      "Business owners, marketers, and entrepreneurs looking to leverage AI and digital strategies",
    toneKeywords: [
      "professional",
      "innovative",
      "data-driven",
      "actionable",
      "growth-oriented",
    ],
  },
];

export function loadConfig(): AppConfig {
  const configPath = path.join(ROOT_DIR, "config.json");

  let userConfig: Partial<AppConfig> = {};
  if (fs.existsSync(configPath)) {
    try {
      userConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    } catch {
      console.warn("Warning: Could not parse config.json, using defaults");
    }
  }

  const config: AppConfig = {
    brands: userConfig.brands ?? DEFAULT_BRANDS,
    anthropicApiKey:
      userConfig.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY,
    dataDir: userConfig.dataDir ?? DATA_DIR,
    tempDir: userConfig.tempDir ?? TEMP_DIR,
    minRelevanceScore: userConfig.minRelevanceScore ?? 6,
    maxFrames: userConfig.maxFrames ?? 8,
    frameIntervalSec: userConfig.frameIntervalSec ?? 5,
    port: userConfig.port ?? (Number(process.env.PORT) || 3000),
    // Notion
    notionApiKey: userConfig.notionApiKey ?? process.env.NOTION_API_KEY,
    notionDatabaseId:
      userConfig.notionDatabaseId ?? process.env.NOTION_DATABASE_ID,
    notionParentPageId:
      userConfig.notionParentPageId ?? process.env.NOTION_PARENT_PAGE_ID,
    // Telegram
    telegramBotToken:
      userConfig.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN,
    telegramAllowedUsers: userConfig.telegramAllowedUsers,
  };

  // Ensure directories exist
  fs.mkdirSync(config.dataDir, { recursive: true });
  fs.mkdirSync(config.tempDir, { recursive: true });

  return config;
}

export function saveConfig(config: AppConfig): void {
  const configPath = path.join(ROOT_DIR, "config.json");
  const { anthropicApiKey, ...safeConfig } = config;
  fs.writeFileSync(configPath, JSON.stringify(safeConfig, null, 2));
}
