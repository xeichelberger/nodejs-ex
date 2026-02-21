import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  BacklogItem,
  BacklogStatus,
  BacklogPriority,
  ContentSource,
  InsightAnalysis,
} from "./types";

const BACKLOG_FILE = "backlog.json";

export class BacklogManager {
  private filePath: string;
  private items: BacklogItem[];

  constructor(dataDir: string) {
    this.filePath = path.join(dataDir, BACKLOG_FILE);
    this.items = this.load();
  }

  private load(): BacklogItem[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(data) as BacklogItem[];
    } catch {
      console.warn("[backlog] Could not parse backlog file, starting fresh");
      return [];
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2));
  }

  /**
   * Check if a URL already exists in the backlog
   */
  hasUrl(url: string): boolean {
    return this.items.some((item) => item.source.url === url);
  }

  /**
   * Add a new item to the backlog
   */
  add(
    source: ContentSource,
    analysis: InsightAnalysis,
    transcript: string | null,
    frameDescriptions: string[]
  ): BacklogItem {
    // Determine priority from scores
    const avgScore =
      (analysis.relevanceScore + analysis.actionability) / 2;
    let priority: BacklogPriority = "low";
    if (avgScore >= 8) priority = "critical";
    else if (avgScore >= 6.5) priority = "high";
    else if (avgScore >= 5) priority = "medium";

    const item: BacklogItem = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source,
      analysis,
      status: "pending",
      priority,
      notes: "",
      transcript,
      frameDescriptions,
    };

    this.items.unshift(item); // newest first
    this.save();

    console.log(
      `[backlog] Added item ${item.id} (priority: ${priority})`
    );
    return item;
  }

  /**
   * Get all backlog items, optionally filtered
   */
  getAll(filters?: {
    status?: BacklogStatus;
    priority?: BacklogPriority;
    category?: string;
    platform?: string;
  }): BacklogItem[] {
    let result = [...this.items];

    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.priority) {
      result = result.filter((i) => i.priority === filters.priority);
    }
    if (filters?.category) {
      result = result.filter(
        (i) => i.analysis.category === filters.category
      );
    }
    if (filters?.platform) {
      result = result.filter(
        (i) => i.source.platform === filters.platform
      );
    }

    return result;
  }

  /**
   * Get a single item by ID
   */
  getById(id: string): BacklogItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  /**
   * Update an item's status
   */
  updateStatus(id: string, status: BacklogStatus): BacklogItem | undefined {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      this.save();
    }
    return item;
  }

  /**
   * Update an item's priority
   */
  updatePriority(
    id: string,
    priority: BacklogPriority
  ): BacklogItem | undefined {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.priority = priority;
      item.updatedAt = new Date().toISOString();
      this.save();
    }
    return item;
  }

  /**
   * Add notes to an item
   */
  addNotes(id: string, notes: string): BacklogItem | undefined {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.notes = notes;
      item.updatedAt = new Date().toISOString();
      this.save();
    }
    return item;
  }

  /**
   * Delete an item
   */
  delete(id: string): boolean {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    this.save();
    return true;
  }

  /**
   * Get summary stats
   */
  getStats(): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byCategory: Record<string, number>;
    byPlatform: Record<string, number>;
    avgRelevance: number;
    avgActionability: number;
  } {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byPlatform: Record<string, number> = {};
    let totalRelevance = 0;
    let totalActionability = 0;

    for (const item of this.items) {
      byStatus[item.status] = (byStatus[item.status] ?? 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] ?? 0) + 1;
      byCategory[item.analysis.category] =
        (byCategory[item.analysis.category] ?? 0) + 1;
      byPlatform[item.source.platform] =
        (byPlatform[item.source.platform] ?? 0) + 1;
      totalRelevance += item.analysis.relevanceScore;
      totalActionability += item.analysis.actionability;
    }

    return {
      total: this.items.length,
      byStatus,
      byPriority,
      byCategory,
      byPlatform,
      avgRelevance: this.items.length
        ? totalRelevance / this.items.length
        : 0,
      avgActionability: this.items.length
        ? totalActionability / this.items.length
        : 0,
    };
  }
}
