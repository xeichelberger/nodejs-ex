import TelegramBot from "node-telegram-bot-api";
import { AppConfig } from "./types";
import { detectPlatform } from "./downloader";
import { BacklogManager } from "./backlog";
import { runPipeline } from "./pipeline";
import { addToNotion } from "./notion";

/**
 * Start the Telegram bot.
 * Users send IG Reel or YouTube links, the bot analyzes them
 * and adds good ones to the Notion backlog.
 */
export function startTelegramBot(
  config: AppConfig,
  backlog: BacklogManager
): TelegramBot {
  if (!config.telegramBotToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is required");
  }

  const bot = new TelegramBot(config.telegramBotToken, { polling: true });

  console.log("[telegram] Bot started, waiting for messages...");

  // /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `*Reel Insight Engine* 🎬\n\nSend me an Instagram Reel or YouTube video link and I'll:\n\n1. Download and watch the video\n2. Read what's said AND see what's shown\n3. Score it for relevance to your brand\n4. Add high-value ideas to your Notion backlog\n\nJust paste a link to get started!`,
      { parse_mode: "Markdown" }
    );
  });

  // /help command
  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      `*Commands:*\n\n` +
        `Send any IG Reel or YouTube link → Analyze it\n` +
        `/status — Check system status\n` +
        `/recent — Show last 5 backlog items\n` +
        `/stats — Backlog statistics\n` +
        `/help — This message`,
      { parse_mode: "Markdown" }
    );
  });

  // /status command
  bot.onText(/\/status/, (msg) => {
    const hasNotion = !!(config.notionApiKey && config.notionDatabaseId);
    const hasClaude = !!config.anthropicApiKey;
    bot.sendMessage(
      msg.chat.id,
      `*System Status*\n\n` +
        `Claude API: ${hasClaude ? "✅ Connected" : "❌ Missing"}\n` +
        `Notion: ${hasNotion ? "✅ Connected" : "❌ Not configured"}\n` +
        `Backlog items: ${backlog.getAll().length}`,
      { parse_mode: "Markdown" }
    );
  });

  // /recent command
  bot.onText(/\/recent/, (msg) => {
    const items = backlog.getAll().slice(0, 5);
    if (items.length === 0) {
      bot.sendMessage(msg.chat.id, "No items in the backlog yet.");
      return;
    }

    const lines = items.map((item, i) => {
      const a = item.analysis;
      const statusIcon =
        item.status === "approved"
          ? "🟢"
          : item.status === "rejected"
            ? "🔴"
            : item.status === "implemented"
              ? "✅"
              : "🟡";
      return `${i + 1}. ${statusIcon} *${a.summary.slice(0, 80)}*\n   Relevance: ${a.relevanceScore}/10 | ${a.category} | ${item.source.platform}`;
    });

    bot.sendMessage(
      msg.chat.id,
      `*Recent Ideas:*\n\n${lines.join("\n\n")}`,
      { parse_mode: "Markdown" }
    );
  });

  // /stats command
  bot.onText(/\/stats/, (msg) => {
    const stats = backlog.getStats();
    bot.sendMessage(
      msg.chat.id,
      `*Backlog Stats*\n\n` +
        `Total ideas: *${stats.total}*\n` +
        `Avg relevance: *${stats.avgRelevance.toFixed(1)}*/10\n` +
        `Avg actionability: *${stats.avgActionability.toFixed(1)}*/10\n\n` +
        `By status:\n${formatMap(stats.byStatus)}\n` +
        `By priority:\n${formatMap(stats.byPriority)}\n` +
        `By category:\n${formatMap(stats.byCategory)}`,
      { parse_mode: "Markdown" }
    );
  });

  // Main handler: detect URLs in messages
  bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ?? "";

    // Skip commands (already handled above)
    if (text.startsWith("/")) return;

    // Check if user is allowed (if restrictions set)
    if (config.telegramAllowedUsers?.length) {
      const username = msg.from?.username;
      if (!username || !config.telegramAllowedUsers.includes(username)) {
        bot.sendMessage(chatId, "Sorry, you're not authorized to use this bot.");
        return;
      }
    }

    // Extract URLs from message
    const urlMatch = text.match(
      /https?:\/\/[^\s]+/i
    );

    if (!urlMatch) {
      bot.sendMessage(
        chatId,
        "Send me an Instagram Reel or YouTube video link to analyze it."
      );
      return;
    }

    const url = urlMatch[0].replace(/[,.]$/, ""); // trim trailing punctuation
    const platform = detectPlatform(url);

    if (!platform) {
      bot.sendMessage(
        chatId,
        "I only support Instagram Reels and YouTube videos. Please send a valid link from one of those platforms."
      );
      return;
    }

    if (!config.anthropicApiKey) {
      bot.sendMessage(chatId, "Error: Claude API key is not configured.");
      return;
    }

    // Send "analyzing" message
    const statusMsg = await bot.sendMessage(
      chatId,
      `⏳ *Analyzing ${platform === "instagram" ? "Instagram Reel" : "YouTube video"}...*\n\nThis takes about 30-60 seconds. I'm downloading the video, extracting frames, reading the transcript, and running AI analysis.`,
      { parse_mode: "Markdown" }
    );

    try {
      const result = await runPipeline(url, config, backlog);

      if (result.skipped) {
        await bot.editMessageText(
          `⏭ *Skipped*\n\n${result.skipReason}`,
          {
            chat_id: chatId,
            message_id: statusMsg.message_id,
            parse_mode: "Markdown",
          }
        );
        return;
      }

      if (!result.backlogItem) {
        await bot.editMessageText(
          `❌ Analysis completed but no item was created.`,
          { chat_id: chatId, message_id: statusMsg.message_id }
        );
        return;
      }

      const item = result.backlogItem;
      const a = item.analysis;

      // Try to add to Notion
      let notionUrl = "";
      if (config.notionApiKey && config.notionDatabaseId) {
        try {
          notionUrl = await addToNotion(item, config);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error("[telegram] Notion error:", errMsg);
        }
      }

      // Build response message
      const recIcon =
        a.overallRecommendation === "add_to_backlog"
          ? "✅"
          : a.overallRecommendation === "review_later"
            ? "🟡"
            : "⏭";

      const brandFitLine = a.brandFitScores
        .map((b) => `${b.brandName}: *${b.score}*/10`)
        .join(" | ");

      let response =
        `${recIcon} *${a.overallRecommendation === "add_to_backlog" ? "Added to Backlog!" : a.overallRecommendation === "review_later" ? "Saved for Review" : "Skipped"}*\n\n` +
        `*${a.summary}*\n\n` +
        `📊 Relevance: *${a.relevanceScore}*/10 | Actionability: *${a.actionability}*/10\n` +
        `🏷 Category: *${a.category}* | Priority: *${item.priority}*\n`;

      if (brandFitLine) {
        response += `🎯 Brand Fit: ${brandFitLine}\n`;
      }

      response += `\n*Key Insights:*\n`;
      for (const insight of a.keyInsights.slice(0, 5)) {
        response += `→ ${insight}\n`;
      }

      response += `\n*Next Steps:*\n${a.suggestedImplementation.slice(0, 300)}`;

      if (a.tags.length > 0) {
        response += `\n\n🏷 ${a.tags.slice(0, 6).map((t) => `#${t.replace(/\s+/g, "_")}`).join(" ")}`;
      }

      if (notionUrl) {
        response += `\n\n📋 [View in Notion](${notionUrl})`;
      }

      await bot.editMessageText(response, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[telegram] Analysis error:", errMsg);

      await bot.editMessageText(
        `❌ *Analysis failed*\n\n${errMsg.slice(0, 300)}`,
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
          parse_mode: "Markdown",
        }
      );
    }
  });

  return bot;
}

function formatMap(m: Record<string, number>): string {
  return Object.entries(m)
    .map(([k, v]) => `  ${k}: *${v}*`)
    .join("\n");
}
