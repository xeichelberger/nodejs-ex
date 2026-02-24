import express from "express";
import path from "path";
import { loadConfig, saveConfig, PROVIDER_LABELS } from "./lib/config";
import { BacklogManager } from "./lib/backlog";
import { runPipeline, checkDependencies } from "./lib/pipeline";
import { detectPlatform } from "./lib/downloader";
import { createNotionDatabase } from "./lib/notion";
import { startTelegramBot } from "./lib/telegram";

const config = loadConfig();
const backlog = new BacklogManager(config.dataDir);
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

// ─── Health / Status ──────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  const deps = await checkDependencies();
  const hasAiKey =
    config.aiProvider === "claude"
      ? !!config.anthropicApiKey
      : !!(config.kimiApiKey || config.openaiCompatibleApiKey);
  res.json({
    status: "ok",
    dependencies: deps,
    hasApiKey: hasAiKey,
    aiProvider: config.aiProvider,
    aiProviderLabel: PROVIDER_LABELS[config.aiProvider],
    hasNotion: !!(config.notionApiKey && config.notionDatabaseId),
    hasTelegram: !!config.telegramBotToken,
  });
});

// ─── Setup: Create Notion database ───────────────────────────
app.post("/api/setup/notion", async (req, res) => {
  const { notionApiKey, notionParentPageId } = req.body;

  const apiKey = notionApiKey || config.notionApiKey;
  const parentPageId = notionParentPageId || config.notionParentPageId;

  if (!apiKey || !parentPageId) {
    res.status(400).json({
      error: "Both notionApiKey and notionParentPageId are required",
    });
    return;
  }

  try {
    config.notionApiKey = apiKey;
    config.notionParentPageId = parentPageId;
    const databaseId = await createNotionDatabase(config);
    config.notionDatabaseId = databaseId;
    saveConfig(config);

    res.json({
      success: true,
      databaseId,
      message: "Notion database created! Open Notion to see it.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// ─── Analyze a URL ────────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  const platform = detectPlatform(url);
  if (!platform) {
    res.status(400).json({
      error: "Unsupported URL. Please provide an Instagram Reel or YouTube video URL.",
    });
    return;
  }

  const hasAiKey =
    config.aiProvider === "claude"
      ? !!config.anthropicApiKey
      : !!(config.kimiApiKey || config.openaiCompatibleApiKey);
  if (!hasAiKey) {
    const keyName =
      config.aiProvider === "claude"
        ? "ANTHROPIC_API_KEY"
        : config.aiProvider === "kimi-nvidia"
          ? "NVIDIA_API_KEY (free at build.nvidia.com)"
          : "KIMI_API_KEY";
    res.status(500).json({
      error: `${keyName} is not configured. Set it as an environment variable.`,
    });
    return;
  }

  try {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Analyzing: ${url}`);
    console.log(`${"=".repeat(60)}`);

    const result = await runPipeline(url, config, backlog);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api] Analysis failed:", message);
    res.status(500).json({ error: message });
  }
});

// ─── Backlog CRUD ─────────────────────────────────────────────
app.get("/api/backlog", (req, res) => {
  const { status, priority, category, platform } = req.query;
  const items = backlog.getAll({
    status: (status as any) || undefined,
    priority: (priority as any) || undefined,
    category: (category as string) || undefined,
    platform: (platform as string) || undefined,
  });
  res.json(items);
});

app.get("/api/backlog/stats", (_req, res) => {
  res.json(backlog.getStats());
});

app.get("/api/backlog/:id", (req, res) => {
  const item = backlog.getById(req.params.id);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

app.patch("/api/backlog/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["pending", "approved", "rejected", "implemented"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  const item = backlog.updateStatus(req.params.id, status);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

app.patch("/api/backlog/:id/priority", (req, res) => {
  const { priority } = req.body;
  if (!["low", "medium", "high", "critical"].includes(priority)) {
    res.status(400).json({ error: "Invalid priority" });
    return;
  }
  const item = backlog.updatePriority(req.params.id, priority);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

app.patch("/api/backlog/:id/notes", (req, res) => {
  const { notes } = req.body;
  if (typeof notes !== "string") {
    res.status(400).json({ error: "Notes must be a string" });
    return;
  }
  const item = backlog.addNotes(req.params.id, notes);
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json(item);
});

app.delete("/api/backlog/:id", (req, res) => {
  const deleted = backlog.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "Item not found" });
    return;
  }
  res.json({ deleted: true });
});

// ─── Serve UI ─────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ─── Start ────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║         Reel Insight Engine                      ║
║         Content Analysis & Idea Backlog          ║
╠══════════════════════════════════════════════════╣
║  Web UI:  http://localhost:${String(config.port).padEnd(24)}║
║  API:     http://localhost:${String(config.port).padEnd(24)}║
╚══════════════════════════════════════════════════╝
  `);

  // Start Telegram bot if configured
  if (config.telegramBotToken) {
    try {
      startTelegramBot(config, backlog);
      console.log("  Telegram bot: RUNNING");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  Telegram bot: FAILED - ${msg}`);
    }
  } else {
    console.log("  Telegram bot: not configured (set TELEGRAM_BOT_TOKEN)");
  }

  // Backlog output
  console.log("  Backlog: BACKLOG.md (auto-generated in project root)");

  // Notion status (optional)
  if (config.notionApiKey && config.notionDatabaseId) {
    console.log("  Notion sync: CONNECTED (optional)");
  }

  console.log("");
});

export default app;
