const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const config = require('../config');
const { getDb } = require('../database');

class SEOAnalyzer {
  constructor() {
    this.crawlDelay = config.crawl.delayMs;
    this.timeout = config.crawl.timeoutMs;
  }

  /**
   * Full SEO audit of a single page
   */
  async analyzePage(pageUrl, siteId) {
    const startTime = Date.now();
    let response;

    try {
      response = await axios.get(pageUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'SEOBot/1.0 (SEO Analysis Tool)',
          'Accept': 'text/html,application/xhtml+xml',
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });
    } catch (err) {
      return {
        url: pageUrl,
        status_code: 0,
        error: err.message,
        score: 0,
        issues: [{ severity: 'critical', message: `Failed to fetch page: ${err.message}` }],
      };
    }

    const loadTime = Date.now() - startTime;
    const $ = cheerio.load(response.data);
    const issues = [];
    let score = 100;

    // --- Title analysis ---
    const title = $('title').first().text().trim();
    if (!title) {
      issues.push({ severity: 'critical', category: 'title', message: 'Missing page title' });
      score -= 15;
    } else if (title.length < 30) {
      issues.push({ severity: 'warning', category: 'title', message: `Title too short (${title.length} chars). Aim for 50-60.` });
      score -= 5;
    } else if (title.length > 60) {
      issues.push({ severity: 'warning', category: 'title', message: `Title too long (${title.length} chars). Aim for 50-60.` });
      score -= 3;
    }

    // --- Meta description ---
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    if (!metaDesc) {
      issues.push({ severity: 'critical', category: 'meta', message: 'Missing meta description' });
      score -= 10;
    } else if (metaDesc.length < 120) {
      issues.push({ severity: 'warning', category: 'meta', message: `Meta description too short (${metaDesc.length} chars). Aim for 150-160.` });
      score -= 3;
    } else if (metaDesc.length > 160) {
      issues.push({ severity: 'warning', category: 'meta', message: `Meta description too long (${metaDesc.length} chars). Aim for 150-160.` });
      score -= 2;
    }

    // --- Headings ---
    const h1s = $('h1');
    const h2s = $('h2');
    const h3s = $('h3');

    if (h1s.length === 0) {
      issues.push({ severity: 'critical', category: 'headings', message: 'Missing H1 tag' });
      score -= 10;
    } else if (h1s.length > 1) {
      issues.push({ severity: 'warning', category: 'headings', message: `Multiple H1 tags found (${h1s.length}). Use only one.` });
      score -= 5;
    }

    if (h2s.length === 0) {
      issues.push({ severity: 'info', category: 'headings', message: 'No H2 tags found. Consider adding subheadings for structure.' });
      score -= 2;
    }

    // --- Images ---
    const images = $('img');
    let imagesWithoutAlt = 0;
    images.each((_, img) => {
      const alt = $(img).attr('alt');
      if (!alt || alt.trim() === '') imagesWithoutAlt++;
    });

    if (imagesWithoutAlt > 0) {
      issues.push({
        severity: 'warning',
        category: 'images',
        message: `${imagesWithoutAlt} of ${images.length} images missing alt text`,
      });
      score -= Math.min(imagesWithoutAlt * 2, 10);
    }

    // --- Links ---
    const baseUrl = new URL(pageUrl);
    let internalLinks = 0;
    let externalLinks = 0;
    const linkUrls = [];

    $('a[href]').each((_, a) => {
      const href = $(a).attr('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      try {
        const linkUrl = new URL(href, pageUrl);
        if (linkUrl.hostname === baseUrl.hostname) {
          internalLinks++;
        } else {
          externalLinks++;
        }
        linkUrls.push(linkUrl.href);
      } catch {
        // malformed URL
      }
    });

    if (internalLinks === 0) {
      issues.push({ severity: 'warning', category: 'links', message: 'No internal links found on page' });
      score -= 5;
    }

    // --- Canonical ---
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) {
      issues.push({ severity: 'warning', category: 'canonical', message: 'Missing canonical tag' });
      score -= 5;
    }

    // --- Open Graph ---
    const hasOgTitle = $('meta[property="og:title"]').length > 0;
    const hasOgDesc = $('meta[property="og:description"]').length > 0;
    const hasOgImage = $('meta[property="og:image"]').length > 0;
    const hasOgTags = hasOgTitle && hasOgDesc && hasOgImage;

    if (!hasOgTags) {
      const missing = [];
      if (!hasOgTitle) missing.push('og:title');
      if (!hasOgDesc) missing.push('og:description');
      if (!hasOgImage) missing.push('og:image');
      issues.push({ severity: 'info', category: 'social', message: `Missing Open Graph tags: ${missing.join(', ')}` });
      score -= 3;
    }

    // --- Schema/structured data ---
    const schemaScripts = $('script[type="application/ld+json"]');
    const hasSchema = schemaScripts.length > 0;
    if (!hasSchema) {
      issues.push({ severity: 'warning', category: 'schema', message: 'No structured data (JSON-LD) found' });
      score -= 5;
    }

    // --- Robots meta ---
    const robotsMeta = $('meta[name="robots"]').attr('content') || '';
    const hasRobotsMeta = robotsMeta.length > 0;
    if (robotsMeta.includes('noindex')) {
      issues.push({ severity: 'info', category: 'robots', message: 'Page is set to noindex' });
    }

    // --- Word count ---
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < 300) {
      issues.push({ severity: 'warning', category: 'content', message: `Low word count (${wordCount}). Aim for 300+ words for better SEO.` });
      score -= 5;
    }

    // --- Page speed indicator ---
    if (loadTime > 3000) {
      issues.push({ severity: 'warning', category: 'performance', message: `Slow page load (${loadTime}ms). Aim for under 3 seconds.` });
      score -= 5;
    }

    // --- Status code ---
    if (response.status !== 200) {
      issues.push({ severity: 'critical', category: 'status', message: `Non-200 status code: ${response.status}` });
      score -= 20;
    }

    // --- Mobile viewport ---
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) {
      issues.push({ severity: 'warning', category: 'mobile', message: 'Missing viewport meta tag for mobile responsiveness' });
      score -= 5;
    }

    // --- HTTPS check ---
    if (!pageUrl.startsWith('https://')) {
      issues.push({ severity: 'critical', category: 'security', message: 'Page not served over HTTPS' });
      score -= 10;
    }

    score = Math.max(0, Math.min(100, score));

    const result = {
      url: pageUrl,
      title,
      meta_description: metaDesc,
      h1_count: h1s.length,
      h2_count: h2s.length,
      h3_count: h3s.length,
      word_count: wordCount,
      image_count: images.length,
      images_without_alt: imagesWithoutAlt,
      internal_links: internalLinks,
      external_links: externalLinks,
      broken_links: 0,
      has_canonical: canonical ? 1 : 0,
      has_robots_meta: hasRobotsMeta ? 1 : 0,
      has_og_tags: hasOgTags ? 1 : 0,
      has_schema_markup: hasSchema ? 1 : 0,
      load_time_ms: loadTime,
      status_code: response.status,
      score,
      issues,
    };

    // Save to database
    if (siteId) {
      this._saveAudit(siteId, result);
    }

    return result;
  }

  /**
   * Crawl a site starting from root URL, discover and audit pages
   */
  async auditSite(siteUrl, siteId, maxPages) {
    maxPages = maxPages || config.crawl.maxPages;
    const baseUrl = new URL(siteUrl);
    const visited = new Set();
    const queue = [siteUrl];
    const results = [];

    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift();
      const normalized = this._normalizeUrl(url);

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      const result = await this.analyzePage(url, siteId);
      results.push(result);

      // Delay between requests
      await this._delay(this.crawlDelay);

      // Discover new internal pages from this page
      try {
        const response = await axios.get(url, {
          timeout: this.timeout,
          headers: { 'User-Agent': 'SEOBot/1.0' },
        });
        const $ = cheerio.load(response.data);

        $('a[href]').each((_, a) => {
          const href = $(a).attr('href');
          if (!href) return;

          try {
            const linkUrl = new URL(href, url);
            if (
              linkUrl.hostname === baseUrl.hostname &&
              !visited.has(this._normalizeUrl(linkUrl.href)) &&
              !linkUrl.href.includes('#') &&
              !linkUrl.href.match(/\.(pdf|jpg|jpeg|png|gif|svg|css|js|zip|mp4|mp3)$/i)
            ) {
              queue.push(linkUrl.href);
            }
          } catch {
            // skip malformed
          }
        });
      } catch {
        // skip on error
      }
    }

    // Calculate site-wide summary
    const summary = {
      total_pages: results.length,
      average_score: results.reduce((sum, r) => sum + r.score, 0) / (results.length || 1),
      critical_issues: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'critical').length, 0),
      warning_issues: results.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'warning').length, 0),
      pages_without_meta: results.filter(r => !r.meta_description).length,
      pages_without_h1: results.filter(r => r.h1_count === 0).length,
      total_images_without_alt: results.reduce((sum, r) => sum + r.images_without_alt, 0),
    };

    return { summary, pages: results };
  }

  /**
   * Analyze a sitemap to discover all pages
   */
  async parseSitemap(sitemapUrl) {
    const xml2js = require('xml2js');
    try {
      const response = await axios.get(sitemapUrl, {
        timeout: this.timeout,
        headers: { 'User-Agent': 'SEOBot/1.0' },
      });

      const parsed = await xml2js.parseStringPromise(response.data);

      // Handle sitemap index
      if (parsed.sitemapindex) {
        const sitemaps = parsed.sitemapindex.sitemap || [];
        const allUrls = [];
        for (const sm of sitemaps) {
          const childUrls = await this.parseSitemap(sm.loc[0]);
          allUrls.push(...childUrls);
        }
        return allUrls;
      }

      // Handle regular sitemap
      if (parsed.urlset && parsed.urlset.url) {
        return parsed.urlset.url.map(entry => ({
          url: entry.loc ? entry.loc[0] : null,
          lastmod: entry.lastmod ? entry.lastmod[0] : null,
          priority: entry.priority ? entry.priority[0] : null,
        })).filter(e => e.url);
      }

      return [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Check robots.txt
   */
  async checkRobotsTxt(siteUrl) {
    try {
      const robotsUrl = new URL('/robots.txt', siteUrl).href;
      const response = await axios.get(robotsUrl, {
        timeout: this.timeout,
        headers: { 'User-Agent': 'SEOBot/1.0' },
      });

      const robotsParser = require('robots-parser');
      const robots = robotsParser(robotsUrl, response.data);

      return {
        exists: true,
        content: response.data,
        sitemapUrls: robots.getSitemaps(),
        isAllowed: (url) => robots.isAllowed(url, 'Googlebot'),
      };
    } catch {
      return { exists: false, content: null, sitemapUrls: [], isAllowed: () => true };
    }
  }

  _saveAudit(siteId, result) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO page_audits (
        site_id, url, title, meta_description,
        h1_count, h2_count, h3_count, word_count,
        image_count, images_without_alt, internal_links, external_links, broken_links,
        has_canonical, has_robots_meta, has_og_tags, has_schema_markup,
        load_time_ms, status_code, score, issues
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      siteId, result.url, result.title, result.meta_description,
      result.h1_count, result.h2_count, result.h3_count, result.word_count,
      result.image_count, result.images_without_alt, result.internal_links,
      result.external_links, result.broken_links,
      result.has_canonical, result.has_robots_meta, result.has_og_tags, result.has_schema_markup,
      result.load_time_ms, result.status_code, result.score,
      JSON.stringify(result.issues)
    );
  }

  _normalizeUrl(url) {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.hostname}${u.pathname}`.replace(/\/$/, '');
    } catch {
      return url;
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new SEOAnalyzer();
