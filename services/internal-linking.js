const axios = require('axios');
const cheerio = require('cheerio');
const { getDb } = require('../database');
const config = require('../config');

class InternalLinkingEngine {
  /**
   * Analyze the internal link structure of a site
   */
  async analyzeStructure(siteUrl, siteId) {
    const pages = await this._crawlLinks(siteUrl);

    const analysis = {
      total_pages: pages.size,
      orphan_pages: [],         // pages with 0 incoming links
      hub_pages: [],            // pages with most outgoing links
      authority_pages: [],      // pages with most incoming links
      deep_pages: [],           // pages requiring 4+ clicks from homepage
      link_distribution: {},
    };

    // Build link graph
    const incomingCount = {};
    const outgoingCount = {};

    for (const [url, data] of pages) {
      outgoingCount[url] = data.outgoing.length;
      for (const link of data.outgoing) {
        incomingCount[link] = (incomingCount[link] || 0) + 1;
      }
    }

    // Find orphan pages (no incoming links except from external)
    for (const [url] of pages) {
      if (!incomingCount[url] || incomingCount[url] === 0) {
        analysis.orphan_pages.push(url);
      }
    }

    // Find hub pages (most outgoing links)
    analysis.hub_pages = Object.entries(outgoingCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, outgoing_links: count }));

    // Find authority pages (most incoming links)
    analysis.authority_pages = Object.entries(incomingCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([url, count]) => ({ url, incoming_links: count }));

    // Calculate link depth from homepage
    const depths = this._calculateDepths(siteUrl, pages);
    analysis.deep_pages = Object.entries(depths)
      .filter(([, depth]) => depth >= 4)
      .map(([url, depth]) => ({ url, click_depth: depth }));

    // Link distribution
    const depthCounts = {};
    for (const depth of Object.values(depths)) {
      depthCounts[depth] = (depthCounts[depth] || 0) + 1;
    }
    analysis.link_distribution = depthCounts;

    return analysis;
  }

  /**
   * Generate internal link suggestions based on content similarity
   */
  async suggestLinks(siteId) {
    const db = getDb();

    // Get all audited pages with their content
    const pages = db.prepare(`
      SELECT url, title, meta_description, word_count
      FROM page_audits
      WHERE site_id = ?
      ORDER BY created_at DESC
    `).all(siteId);

    if (pages.length < 2) {
      return { suggestions: [], message: 'Need at least 2 audited pages to suggest links.' };
    }

    // Build keyword index from titles and meta descriptions
    const pageKeywords = pages.map(p => ({
      url: p.url,
      title: p.title || '',
      description: p.meta_description || '',
      keywords: this._extractKeywords(`${p.title || ''} ${p.meta_description || ''}`),
    }));

    const suggestions = [];

    // Find pages that share keywords but don't link to each other
    for (let i = 0; i < pageKeywords.length; i++) {
      for (let j = 0; j < pageKeywords.length; j++) {
        if (i === j) continue;

        const source = pageKeywords[i];
        const target = pageKeywords[j];

        const commonKeywords = source.keywords.filter(k => target.keywords.includes(k));
        if (commonKeywords.length >= 2) {
          const relevanceScore = commonKeywords.length / Math.max(source.keywords.length, target.keywords.length);

          if (relevanceScore > 0.15) {
            suggestions.push({
              source_url: source.url,
              target_url: target.url,
              anchor_text: this._generateAnchorText(target.title, commonKeywords),
              context: `Shared topics: ${commonKeywords.slice(0, 5).join(', ')}`,
              relevance_score: Math.round(relevanceScore * 100) / 100,
            });
          }
        }
      }
    }

    // Sort by relevance and deduplicate
    const uniqueSuggestions = suggestions
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 50);

    // Save to database
    this._saveSuggestions(siteId, uniqueSuggestions);

    return { suggestions: uniqueSuggestions };
  }

  /**
   * Find pages that need more internal links
   */
  async findUnderlinkedPages(siteId) {
    const db = getDb();

    const pages = db.prepare(`
      SELECT url, title, internal_links, word_count, score
      FROM page_audits
      WHERE site_id = ? AND internal_links < 3
      ORDER BY word_count DESC
    `).all(siteId);

    return pages.map(p => ({
      url: p.url,
      title: p.title,
      current_internal_links: p.internal_links,
      word_count: p.word_count,
      seo_score: p.score,
      recommendation: p.word_count > 500 && p.internal_links < 2
        ? 'High priority - long content with few internal links'
        : 'Consider adding 2-3 relevant internal links',
    }));
  }

  /**
   * Suggest anchor text distribution improvements
   */
  async analyzeAnchorText(siteUrl) {
    try {
      const response = await axios.get(siteUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SEOBot/1.0' },
      });

      const $ = cheerio.load(response.data);
      const baseHost = new URL(siteUrl).hostname;
      const anchors = {};

      $('a[href]').each((_, a) => {
        const href = $(a).attr('href');
        const text = $(a).text().trim();
        if (!href || !text) return;

        try {
          const linkUrl = new URL(href, siteUrl);
          if (linkUrl.hostname === baseHost) {
            const key = text.toLowerCase();
            if (!anchors[key]) anchors[key] = { text, count: 0, targets: [] };
            anchors[key].count++;
            anchors[key].targets.push(linkUrl.pathname);
          }
        } catch {
          // skip
        }
      });

      const anchorList = Object.values(anchors).sort((a, b) => b.count - a.count);

      const issues = [];
      // Check for generic anchor text
      const genericAnchors = ['click here', 'read more', 'learn more', 'here', 'link'];
      for (const a of anchorList) {
        if (genericAnchors.includes(a.text.toLowerCase())) {
          issues.push({
            severity: 'warning',
            message: `Generic anchor text "${a.text}" used ${a.count} times. Use descriptive keywords instead.`,
          });
        }
      }

      // Check for over-optimized anchors (same exact text pointing to same page many times)
      for (const a of anchorList) {
        if (a.count > 5 && new Set(a.targets).size === 1) {
          issues.push({
            severity: 'info',
            message: `Anchor text "${a.text}" links to same page ${a.count} times. Vary your anchor text.`,
          });
        }
      }

      return { anchors: anchorList.slice(0, 50), issues };
    } catch (err) {
      return { error: err.message, anchors: [], issues: [] };
    }
  }

  // ==================== Private helpers ====================

  async _crawlLinks(siteUrl, maxPages = 50) {
    const baseHost = new URL(siteUrl).hostname;
    const visited = new Map();
    const queue = [siteUrl];

    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift();
      const normalized = this._normalizeUrl(url);

      if (visited.has(normalized)) continue;

      try {
        const response = await axios.get(url, {
          timeout: 10000,
          headers: { 'User-Agent': 'SEOBot/1.0' },
        });

        const $ = cheerio.load(response.data);
        const outgoing = [];

        $('a[href]').each((_, a) => {
          const href = $(a).attr('href');
          if (!href) return;
          try {
            const linkUrl = new URL(href, url);
            if (linkUrl.hostname === baseHost) {
              const norm = this._normalizeUrl(linkUrl.href);
              outgoing.push(norm);
              if (!visited.has(norm)) queue.push(linkUrl.href);
            }
          } catch {
            // skip
          }
        });

        visited.set(normalized, { outgoing: [...new Set(outgoing)] });

        await new Promise(r => setTimeout(r, config.crawl.delayMs));
      } catch {
        visited.set(normalized, { outgoing: [] });
      }
    }

    return visited;
  }

  _calculateDepths(startUrl, pages) {
    const depths = {};
    const normalized = this._normalizeUrl(startUrl);
    depths[normalized] = 0;

    const queue = [normalized];

    while (queue.length > 0) {
      const current = queue.shift();
      const pageData = pages.get(current);
      if (!pageData) continue;

      for (const link of pageData.outgoing) {
        if (depths[link] === undefined) {
          depths[link] = depths[current] + 1;
          queue.push(link);
        }
      }
    }

    return depths;
  }

  _extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'shall', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my',
      'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who',
      'when', 'where', 'how', 'not', 'no', 'all', 'each', 'every', 'both',
      'few', 'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very',
      'just', 'about', 'above', 'after', 'again', 'also', 'any', 'because',
      'before', 'between', 'into', 'through', 'during', 'out', 'up', 'down',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  _generateAnchorText(title, commonKeywords) {
    if (title && title.length <= 60) return title;
    if (commonKeywords.length > 0) return commonKeywords.slice(0, 3).join(' ');
    return title ? title.substring(0, 60) : 'related content';
  }

  _saveSuggestions(siteId, suggestions) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO link_suggestions (site_id, source_url, target_url, anchor_text, context, relevance_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insert = db.transaction((rows) => {
      for (const s of rows) {
        stmt.run(siteId, s.source_url, s.target_url, s.anchor_text, s.context, s.relevance_score);
      }
    });

    insert(suggestions);
  }

  _normalizeUrl(url) {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, '');
    } catch {
      return url;
    }
  }
}

module.exports = new InternalLinkingEngine();
