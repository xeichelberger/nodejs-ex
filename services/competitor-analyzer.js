const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const config = require('../config');
const { getDb } = require('../database');

/**
 * Competitor Analysis module
 *
 * Replicates the "Screaming Frog" workflow:
 * 1. Crawl a competitor site, discover all URLs
 * 2. Categorize pages (HTML, status 200, indexable)
 * 3. Count internal links pointing to each page
 * 4. Find the competitor's most valuable content (most linked-to pages)
 * 5. Analyze that content structure (H1, H2s, word count, topics)
 * 6. Generate a content brief to outperform it
 */
class CompetitorAnalyzer {
  constructor() {
    this.timeout = config.crawl.timeoutMs;
    this.delay = config.crawl.delayMs;
  }

  /**
   * Full competitor crawl — the "Screaming Frog export" equivalent.
   * Returns every discovered URL with status, indexability, inlink count,
   * content type, word count, and heading structure.
   */
  async crawlCompetitor(competitorUrl, { maxPages = 200 } = {}) {
    const base = new URL(competitorUrl);
    const visited = new Map();
    const queue = [competitorUrl];
    const inlinks = {}; // url -> count of internal links pointing to it

    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift();
      const norm = this._norm(url);
      if (visited.has(norm)) continue;

      const page = await this._fetchPage(url);
      visited.set(norm, page);

      // Count internal links and discover new URLs
      if (page.links) {
        for (const link of page.links) {
          try {
            const linkUrl = new URL(link, url);
            if (linkUrl.hostname !== base.hostname) continue;
            const linkNorm = this._norm(linkUrl.href);
            inlinks[linkNorm] = (inlinks[linkNorm] || 0) + 1;
            if (!visited.has(linkNorm) && !linkNorm.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|mp4|mp3|woff|woff2|ico)$/i)) {
              queue.push(linkUrl.href);
            }
          } catch { /* skip malformed */ }
        }
      }

      await this._sleep(this.delay);
    }

    // Build results — mirrors a Screaming Frog CSV export
    const pages = [];
    for (const [url, data] of visited) {
      pages.push({
        url,
        status_code: data.status_code,
        content_type: data.content_type,
        indexable: data.indexable,
        title: data.title,
        meta_description: data.meta_description,
        h1: data.h1,
        h2s: data.h2s,
        word_count: data.word_count,
        inlinks: inlinks[url] || 0,
        outlinks: (data.links || []).length,
        has_canonical: data.has_canonical,
        canonical_url: data.canonical_url,
        is_blog_or_article: this._isBlogContent(url),
      });
    }

    return pages;
  }

  /**
   * Get the competitor's most valuable pages — sorted by internal link count.
   * This is the core "steal their best content" step.
   * Filters for HTML, status 200, indexable, optionally blog/article content.
   */
  async getTopCompetitorPages(competitorUrl, { maxPages = 200, blogOnly = false, limit = 30 } = {}) {
    const allPages = await this.crawlCompetitor(competitorUrl, { maxPages });

    let filtered = allPages
      .filter(p => p.status_code === 200)
      .filter(p => p.indexable)
      .filter(p => p.content_type === 'html');

    if (blogOnly) {
      filtered = filtered.filter(p => p.is_blog_or_article);
    }

    // Sort by inlinks descending — most linked = most valuable to competitor
    filtered.sort((a, b) => b.inlinks - a.inlinks);

    return {
      total_crawled: allPages.length,
      total_indexable: filtered.length,
      top_pages: filtered.slice(0, limit),
    };
  }

  /**
   * Deep-analyze a single competitor page.
   * Extracts full content structure for use in content briefs.
   */
  async analyzeCompetitorPage(pageUrl) {
    const page = await this._fetchPage(pageUrl);

    if (page.status_code !== 200) {
      return { url: pageUrl, error: `Page returned status ${page.status_code}` };
    }

    return {
      url: pageUrl,
      title: page.title,
      meta_description: page.meta_description,
      h1: page.h1,
      heading_structure: page.heading_structure,
      word_count: page.word_count,
      topics: page.topics,
      internal_links: page.internal_link_count,
      external_links: page.external_link_count,
      images: page.image_count,
      images_with_alt: page.images_with_alt,
      has_schema: page.has_schema,
      schema_types: page.schema_types,
      has_faq: page.has_faq,
      has_table: page.has_table,
      content_preview: page.content_preview,
    };
  }

  /**
   * Generate a content brief to outperform a competitor page.
   * Uses Claude to analyze the competitor content and create a better plan.
   */
  async generateContentBrief(competitorPageUrl, { brandName, targetKeyword } = {}) {
    const analysis = await this.analyzeCompetitorPage(competitorPageUrl);

    if (analysis.error) {
      return { error: analysis.error };
    }

    const Anthropic = require('@anthropic-ai/sdk');
    if (!config.anthropic.apiKey) {
      throw new Error('Anthropic API not configured. Set ANTHROPIC_API_KEY.');
    }

    const client = new Anthropic({ apiKey: config.anthropic.apiKey });

    const prompt = `You are an expert SEO strategist. Analyze this competitor page and create a content brief to outperform it.

COMPETITOR PAGE: ${competitorPageUrl}
COMPETITOR TITLE: ${analysis.title}
COMPETITOR META: ${analysis.meta_description}
COMPETITOR H1: ${analysis.h1}
COMPETITOR HEADINGS: ${JSON.stringify(analysis.heading_structure)}
COMPETITOR WORD COUNT: ${analysis.word_count}
COMPETITOR HAS FAQ: ${analysis.has_faq}
COMPETITOR HAS SCHEMA: ${analysis.has_schema} (types: ${(analysis.schema_types || []).join(', ')})
CONTENT PREVIEW: ${(analysis.content_preview || '').substring(0, 2000)}

${brandName ? `OUR BRAND: ${brandName}` : ''}
${targetKeyword ? `TARGET KEYWORD: ${targetKeyword}` : ''}

Create a content brief that will OUTPERFORM this competitor page. The brief should:

1. CONTENT GAPS: What does the competitor miss or cover poorly?
2. IMPROVED H1: A stronger, more keyword-rich H1
3. IMPROVED HEADING OUTLINE: All H2s and H3s needed — more comprehensive than the competitor
4. WORD COUNT TARGET: How many words we need (typically 25-50% more than competitor, with reason)
5. UNIQUE ANGLES: What original data, insights, or perspectives we should add that they don't have
6. FAQ SECTION: Questions to include that the competitor doesn't answer
7. SCHEMA RECOMMENDATIONS: What structured data to add
8. INTERNAL LINKING PLAN: What types of pages to link to/from
9. MEDIA PLAN: Images, videos, infographics to include

Return as JSON:
{
  "competitor_strengths": ["what they do well"],
  "competitor_weaknesses": ["what they miss"],
  "improved_h1": "our better H1",
  "improved_meta_description": "our better meta (150-160 chars)",
  "heading_outline": [
    {"tag": "h2", "text": "Section title", "notes": "what to cover"}
  ],
  "target_word_count": 2000,
  "word_count_rationale": "why this count",
  "unique_angles": ["angle 1", "angle 2"],
  "faq_section": [
    {"question": "Q", "brief_answer_direction": "what to cover in the answer"}
  ],
  "schema_types": ["FAQPage", "Article"],
  "internal_linking_plan": ["link to X type of page from section Y"],
  "media_suggestions": ["image/video ideas"],
  "estimated_seo_advantage": "why this will outrank the competitor"
}`;

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return { competitor_analysis: analysis, brief: JSON.parse(match[0]) };
    } catch { /* fall through */ }
    return { competitor_analysis: analysis, brief: { raw: text } };
  }

  /**
   * Compare your site against a competitor — side-by-side content coverage.
   */
  async compareContentCoverage(yourSiteUrl, competitorUrl, { maxPages = 100 } = {}) {
    const [yourPages, theirPages] = await Promise.all([
      this.crawlCompetitor(yourSiteUrl, { maxPages }),
      this.crawlCompetitor(competitorUrl, { maxPages }),
    ]);

    const yourTopics = new Set(yourPages.filter(p => p.is_blog_or_article).map(p => p.title?.toLowerCase()).filter(Boolean));
    const theirTopics = theirPages.filter(p => p.is_blog_or_article).map(p => ({
      url: p.url,
      title: p.title,
      inlinks: p.inlinks,
      word_count: p.word_count,
    }));

    // Find competitor content we don't have equivalents for
    const contentGaps = theirTopics
      .filter(t => {
        if (!t.title) return false;
        const lower = t.title.toLowerCase();
        // Check if any of our pages have a similar title
        for (const ours of yourTopics) {
          if (this._titleSimilarity(ours, lower) > 0.4) return false;
        }
        return true;
      })
      .sort((a, b) => b.inlinks - a.inlinks);

    return {
      your_content_count: yourPages.filter(p => p.is_blog_or_article).length,
      competitor_content_count: theirTopics.length,
      content_gaps: contentGaps,
      gap_count: contentGaps.length,
    };
  }

  // ==================== Private helpers ====================

  async _fetchPage(url) {
    const result = {
      status_code: 0,
      content_type: 'unknown',
      indexable: false,
      title: '',
      meta_description: '',
      h1: '',
      h2s: [],
      heading_structure: [],
      word_count: 0,
      links: [],
      internal_link_count: 0,
      external_link_count: 0,
      image_count: 0,
      images_with_alt: 0,
      has_canonical: false,
      canonical_url: null,
      has_schema: false,
      schema_types: [],
      has_faq: false,
      has_table: false,
      content_preview: '',
      topics: [],
    };

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        maxRedirects: 5,
        validateStatus: s => s < 500,
      });

      result.status_code = response.status;

      const contentType = response.headers['content-type'] || '';
      result.content_type = contentType.includes('text/html') ? 'html' : 'other';

      if (result.content_type !== 'html') return result;

      const $ = cheerio.load(response.data);
      const baseHost = new URL(url).hostname;

      // Title
      result.title = $('title').first().text().trim();

      // Meta description
      result.meta_description = $('meta[name="description"]').attr('content') || '';

      // Indexability
      const robotsMeta = $('meta[name="robots"]').attr('content') || '';
      result.indexable = !robotsMeta.includes('noindex');

      // Canonical
      const canonical = $('link[rel="canonical"]').attr('href');
      result.has_canonical = !!canonical;
      result.canonical_url = canonical || null;

      // H1
      result.h1 = $('h1').first().text().trim();

      // All headings structure
      const headings = [];
      $('h1, h2, h3, h4').each((_, el) => {
        headings.push({
          tag: $(el).prop('tagName').toLowerCase(),
          text: $(el).text().trim().substring(0, 200),
        });
      });
      result.heading_structure = headings;
      result.h2s = headings.filter(h => h.tag === 'h2').map(h => h.text);

      // Word count and content preview
      const bodyText = $('article, main, [role="main"], .post-content, .entry-content, .blog-content, body')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();
      result.word_count = bodyText.split(/\s+/).filter(w => w.length > 0).length;
      result.content_preview = bodyText.substring(0, 3000);

      // Links
      $('a[href]').each((_, a) => {
        const href = $(a).attr('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        result.links.push(href);
        try {
          const linkHost = new URL(href, url).hostname;
          if (linkHost === baseHost) result.internal_link_count++;
          else result.external_link_count++;
        } catch { /* skip */ }
      });

      // Images
      $('img').each((_, img) => {
        result.image_count++;
        if ($(img).attr('alt')?.trim()) result.images_with_alt++;
      });

      // Schema
      $('script[type="application/ld+json"]').each((_, el) => {
        result.has_schema = true;
        try {
          const data = JSON.parse($(el).html());
          if (data['@type']) result.schema_types.push(data['@type']);
        } catch { /* skip */ }
      });

      // FAQ detection
      result.has_faq = $('[itemtype*="FAQPage"]').length > 0
        || $('script[type="application/ld+json"]').text().includes('FAQPage')
        || $('h2, h3').filter((_, el) => /faq|frequently asked/i.test($(el).text())).length > 0;

      // Table detection
      result.has_table = $('table').length > 0;

      // Extract rough topics from headings
      result.topics = headings
        .filter(h => h.tag === 'h2' || h.tag === 'h3')
        .map(h => h.text)
        .slice(0, 20);

    } catch (err) {
      result.status_code = 0;
      result.error = err.message;
    }

    return result;
  }

  _isBlogContent(url) {
    return /\/(blog|articles?|posts?|news|learn|guides?|resources|magazine|journal|insights?)\//i.test(url);
  }

  _titleSimilarity(a, b) {
    if (!a || !b) return 0;
    const wordsA = new Set(a.split(/\s+/).filter(w => w.length > 3));
    const wordsB = new Set(b.split(/\s+/).filter(w => w.length > 3));
    if (wordsA.size === 0 || wordsB.size === 0) return 0;
    let overlap = 0;
    for (const w of wordsA) { if (wordsB.has(w)) overlap++; }
    return overlap / Math.max(wordsA.size, wordsB.size);
  }

  _norm(url) {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, '').toLowerCase();
    } catch { return url; }
  }

  _sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}

module.exports = new CompetitorAnalyzer();
