const cheerio = require('cheerio');
const { getDb } = require('../database');
const contentGenerator = require('./content-generator');
const shopify = require('./shopify');
const gsc = require('./google-search-console');
const brandVoiceService = require('./brand-voice');
const config = require('../config');

class PublishPipeline {
  /**
   * Full pipeline: generate -> publish -> interlink -> submit to Google.
   *
   * Returns a step-by-step audit trail so the caller knows exactly what
   * happened (and what was skipped if an integration isn't configured).
   */
  async run({
    // Content generation params
    keyword,
    topic,
    siteId,
    blogId,
    wordCount = 1500,
    tone,
    additionalContext = '',

    // Options
    publish = true,           // actually push to Shopify (false = dry run)
    interlink = true,         // add links from existing pages to the new article
    submitToGoogle = true,    // ping GSC indexing API
    trackKeyword = true,      // add keyword to SERP tracker
    imageUrl,                 // optional hero image
  }) {
    const steps = [];
    const startedAt = new Date().toISOString();

    // ------------------------------------------------------------------
    // 0. Validate prerequisites
    // ------------------------------------------------------------------
    if (!keyword || !topic) {
      throw new Error('keyword and topic are required');
    }
    if (publish && !shopify.isConfigured()) {
      throw new Error('Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and either SHOPIFY_ACCESS_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET.');
    }
    if (!contentGenerator.isConfigured()) {
      throw new Error('Anthropic API not configured. Set ANTHROPIC_API_KEY.');
    }

    // Resolve blog — if none provided, pick the first Shopify blog
    let resolvedBlogId = blogId;
    if (publish && !resolvedBlogId) {
      const blogs = await shopify.getBlogs();
      if (!blogs || blogs.length === 0) {
        throw new Error('No Shopify blogs found. Create a blog in Shopify admin first.');
      }
      resolvedBlogId = blogs[0].id;
      steps.push({ step: 'resolve_blog', blog_id: resolvedBlogId, blog_title: blogs[0].title });
    }

    // ------------------------------------------------------------------
    // 1. Generate content
    // ------------------------------------------------------------------
    const generated = await contentGenerator.generateBlogPost({
      keyword,
      topic,
      tone,
      wordCount,
      additionalContext,
      siteId,
    });

    steps.push({
      step: 'generate',
      title: generated.title,
      slug: generated.slug,
      keyword_count: generated.target_keywords ? generated.target_keywords.length : 0,
    });

    // ------------------------------------------------------------------
    // 2. Resolve [INTERNAL LINK] placeholders with real URLs
    // ------------------------------------------------------------------
    let resolvedHtml = generated.body_html || '';
    const resolvedLinks = [];

    if (publish && resolvedHtml.includes('[INTERNAL LINK')) {
      const resolved = await this._resolveInternalLinks(resolvedHtml, siteId);
      resolvedHtml = resolved.html;
      resolvedLinks.push(...resolved.links);

      steps.push({
        step: 'resolve_links',
        placeholders_found: resolved.totalPlaceholders,
        placeholders_resolved: resolved.links.length,
        links: resolved.links,
      });
    }

    // ------------------------------------------------------------------
    // 3. Publish to Shopify
    // ------------------------------------------------------------------
    let article = null;
    let articleUrl = null;

    if (publish) {
      article = await shopify.createArticle(resolvedBlogId, {
        title: generated.title,
        body_html: resolvedHtml,
        tags: Array.isArray(generated.tags) ? generated.tags.join(', ') : (generated.tags || ''),
        meta_description: generated.meta_description,
        image_url: imageUrl,
      });

      // Build the public URL
      const domain = config.shopify.storeDomain.replace(/\/$/, '');
      articleUrl = `https://${domain}/blogs/${article.blog_id || resolvedBlogId}/articles/${article.handle || generated.slug}`;

      // Try to get the actual URL from Shopify response if available
      if (article.url) {
        articleUrl = article.url.startsWith('http') ? article.url : `https://${domain}${article.url}`;
      }

      steps.push({
        step: 'publish',
        shopify_article_id: article.id,
        handle: article.handle,
        url: articleUrl,
        published: article.published_at ? true : false,
      });
    }

    // ------------------------------------------------------------------
    // 4. Add internal links FROM existing articles TO the new article
    // ------------------------------------------------------------------
    const interlinkResults = [];

    if (publish && interlink && article) {
      const results = await this._addInboundLinks({
        blogId: resolvedBlogId,
        newArticle: article,
        newArticleUrl: articleUrl,
        keyword,
        tags: generated.tags,
        targetKeywords: generated.target_keywords,
        maxLinks: 3,
      });

      interlinkResults.push(...results);

      steps.push({
        step: 'interlink',
        existing_pages_updated: results.length,
        links_added: results,
      });
    }

    // ------------------------------------------------------------------
    // 5. Submit URL to Google for indexing
    // ------------------------------------------------------------------
    let indexingResult = null;

    if (publish && submitToGoogle && articleUrl && gsc.isConfigured()) {
      indexingResult = await gsc.submitUrlForIndexing(articleUrl);

      steps.push({
        step: 'submit_google',
        url: articleUrl,
        submitted: indexingResult.submitted,
        error: indexingResult.error || null,
      });
    } else if (submitToGoogle && !gsc.isConfigured()) {
      steps.push({ step: 'submit_google', skipped: true, reason: 'GSC not configured' });
    }

    // ------------------------------------------------------------------
    // 6. Track the target keyword
    // ------------------------------------------------------------------
    if (publish && trackKeyword && siteId) {
      this._trackKeyword(siteId, keyword, articleUrl);
      steps.push({ step: 'track_keyword', keyword, url: articleUrl });
    }

    // ------------------------------------------------------------------
    // 7. Save to content table + update status to published
    // ------------------------------------------------------------------
    let contentId = null;

    if (siteId) {
      contentId = contentGenerator.saveContent(siteId, 'blog_post', generated, {
        targetUrl: articleUrl,
        targetKeyword: keyword,
        title: generated.title,
      });

      if (publish) {
        const db = getDb();
        db.prepare(`
          UPDATE content
          SET status = 'published', published_to = 'shopify_blog', target_url = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(articleUrl, contentId);
      }

      steps.push({ step: 'save_content', content_id: contentId, status: publish ? 'published' : 'draft' });
    }

    // ------------------------------------------------------------------
    // 8. Log the pipeline run
    // ------------------------------------------------------------------
    const finishedAt = new Date().toISOString();
    const runId = this._logRun(siteId, {
      keyword,
      topic,
      blogId: resolvedBlogId,
      contentId,
      articleId: article ? article.id : null,
      articleUrl,
      steps,
      startedAt,
      finishedAt,
    });

    return {
      pipeline_run_id: runId,
      content_id: contentId,
      article: article ? {
        id: article.id,
        title: article.title,
        handle: article.handle,
        url: articleUrl,
      } : null,
      generated: {
        title: generated.title,
        meta_description: generated.meta_description,
        slug: generated.slug,
        target_keywords: generated.target_keywords,
      },
      interlinks_added: interlinkResults.length,
      google_submitted: indexingResult ? indexingResult.submitted : false,
      steps,
    };
  }

  /**
   * Re-run parts of the pipeline for a previously saved content record.
   * Useful when content was generated but not yet published, or when
   * you want to re-interlink after more pages exist.
   */
  async publishExisting({ contentId, blogId, interlink = true, submitToGoogle = true }) {
    const db = getDb();
    const record = db.prepare('SELECT * FROM content WHERE id = ?').get(contentId);
    if (!record) throw new Error(`Content record ${contentId} not found`);

    const body = typeof record.body === 'string' ? JSON.parse(record.body) : record.body;

    const steps = [];

    // Resolve blog
    let resolvedBlogId = blogId;
    if (!resolvedBlogId) {
      const blogs = await shopify.getBlogs();
      if (!blogs || blogs.length === 0) throw new Error('No Shopify blogs found.');
      resolvedBlogId = blogs[0].id;
    }

    // Publish
    const article = await shopify.createArticle(resolvedBlogId, {
      title: body.title || record.title,
      body_html: body.body_html || record.body,
      tags: Array.isArray(body.tags) ? body.tags.join(', ') : (body.tags || ''),
      meta_description: body.meta_description,
    });

    const domain = config.shopify.storeDomain.replace(/\/$/, '');
    let articleUrl = `https://${domain}/blogs/${resolvedBlogId}/articles/${article.handle}`;
    if (article.url) {
      articleUrl = article.url.startsWith('http') ? article.url : `https://${domain}${article.url}`;
    }

    steps.push({ step: 'publish', shopify_article_id: article.id, url: articleUrl });

    // Update DB
    db.prepare(`
      UPDATE content
      SET status = 'published', published_to = 'shopify_blog', target_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(articleUrl, contentId);

    // Interlink
    if (interlink) {
      const results = await this._addInboundLinks({
        blogId: resolvedBlogId,
        newArticle: article,
        newArticleUrl: articleUrl,
        keyword: record.target_keyword,
        targetKeywords: body.target_keywords,
        maxLinks: 3,
      });
      steps.push({ step: 'interlink', existing_pages_updated: results.length, links_added: results });
    }

    // Submit to Google
    if (submitToGoogle && gsc.isConfigured()) {
      const result = await gsc.submitUrlForIndexing(articleUrl);
      steps.push({ step: 'submit_google', submitted: result.submitted });
    }

    return { content_id: contentId, article_id: article.id, url: articleUrl, steps };
  }

  // ====================================================================
  // Internal link resolution — replaces [INTERNAL LINK: ...] markers
  // ====================================================================

  async _resolveInternalLinks(html, siteId) {
    const placeholder = /\[INTERNAL LINK:\s*(.+?)\s*->\s*(.+?)\s*\]/g;
    const matches = [...html.matchAll(placeholder)];

    if (matches.length === 0) {
      return { html, links: [], totalPlaceholders: 0 };
    }

    // Gather existing URLs from Shopify and page_audits
    const existingPages = await this._getExistingPages(siteId);
    const links = [];

    let resolved = html;
    for (const match of matches) {
      const [fullMatch, anchorText, pageType] = match;
      const target = this._findBestMatch(pageType, existingPages);

      if (target) {
        resolved = resolved.replace(fullMatch, `<a href="${target.url}">${anchorText}</a>`);
        links.push({ anchor: anchorText, url: target.url, matched_from: target.source });
      } else {
        // Leave anchor text but remove the marker brackets
        resolved = resolved.replace(fullMatch, anchorText);
      }
    }

    return { html: resolved, links, totalPlaceholders: matches.length };
  }

  async _getExistingPages(siteId) {
    const pages = [];

    // From Shopify products
    try {
      const products = await shopify.getProducts(50);
      for (const p of products) {
        pages.push({
          url: `/products/${p.handle}`,
          title: p.title,
          type: 'product',
          keywords: (p.title + ' ' + (p.tags || '')).toLowerCase(),
          source: 'shopify_product',
        });
      }
    } catch { /* Shopify may not be configured */ }

    // From Shopify pages
    try {
      const shopifyPages = await shopify.getPages(50);
      for (const p of shopifyPages) {
        pages.push({
          url: `/pages/${p.handle}`,
          title: p.title,
          type: 'page',
          keywords: p.title.toLowerCase(),
          source: 'shopify_page',
        });
      }
    } catch { /* skip */ }

    // From Shopify blog articles
    try {
      const blogs = await shopify.getBlogs();
      for (const blog of blogs) {
        const articles = await shopify.getArticles(blog.id, 50);
        for (const a of articles) {
          pages.push({
            url: `/blogs/${blog.handle}/articles/${a.handle}`,
            title: a.title,
            type: 'blog_post',
            keywords: (a.title + ' ' + (a.tags || '')).toLowerCase(),
            source: 'shopify_article',
          });
        }
      }
    } catch { /* skip */ }

    // From page_audits DB (catches anything Shopify didn't surface)
    if (siteId) {
      const db = getDb();
      const audits = db.prepare(`
        SELECT url, title, meta_description FROM page_audits
        WHERE site_id = ? ORDER BY created_at DESC LIMIT 100
      `).all(siteId);

      for (const a of audits) {
        const already = pages.some(p => a.url.includes(p.url) || p.url.includes(a.url));
        if (!already) {
          pages.push({
            url: a.url,
            title: a.title || '',
            type: this._guessPageType(a.url),
            keywords: ((a.title || '') + ' ' + (a.meta_description || '')).toLowerCase(),
            source: 'page_audit',
          });
        }
      }
    }

    return pages;
  }

  _findBestMatch(pageType, existingPages) {
    const typeNorm = pageType.toLowerCase().trim();

    // Direct type mapping
    const typeMap = {
      'product page': 'product',
      'product': 'product',
      'collection page': 'collection',
      'collection': 'collection',
      'blog post': 'blog_post',
      'blog': 'blog_post',
      'article': 'blog_post',
      'guide': 'blog_post',
      'page': 'page',
      'landing page': 'page',
      'homepage': 'homepage',
      'about page': 'page',
      'faq': 'page',
    };

    const targetType = typeMap[typeNorm];

    // Try exact type match first
    if (targetType) {
      const typeMatches = existingPages.filter(p => p.type === targetType);
      if (typeMatches.length > 0) return typeMatches[0];
    }

    // Try keyword match against the page type description
    const typeWords = typeNorm.split(/\s+/);
    let bestScore = 0;
    let bestPage = null;

    for (const page of existingPages) {
      let score = 0;
      for (const word of typeWords) {
        if (word.length > 2 && page.keywords.includes(word)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestPage = page;
      }
    }

    return bestPage;
  }

  _guessPageType(url) {
    if (url.includes('/products/')) return 'product';
    if (url.includes('/collections/')) return 'collection';
    if (url.includes('/blogs/') || url.includes('/articles/')) return 'blog_post';
    if (url.includes('/pages/')) return 'page';
    return 'page';
  }

  // ====================================================================
  // Inbound interlinking — add links FROM existing articles TO the new one
  // ====================================================================

  async _addInboundLinks({ blogId, newArticle, newArticleUrl, keyword, tags, targetKeywords, maxLinks = 3 }) {
    const results = [];

    try {
      const articles = await shopify.getArticles(blogId, 50);

      // Don't link from the article to itself
      const candidates = articles.filter(a => a.id !== newArticle.id);
      if (candidates.length === 0) return results;

      // Score each existing article by keyword overlap
      const newKeywords = this._buildKeywordSet(keyword, tags, targetKeywords);
      const scored = candidates.map(a => {
        const existingKeywords = this._buildKeywordSet(
          a.title,
          a.tags,
          [] // no target_keywords for existing articles
        );
        const overlap = [...newKeywords].filter(k => existingKeywords.has(k)).length;
        return { article: a, score: overlap };
      });

      // Pick top candidates with at least some overlap
      const topCandidates = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxLinks);

      for (const candidate of topCandidates) {
        const updated = this._insertLinkIntoHtml(
          candidate.article.body_html || '',
          newArticleUrl,
          newArticle.title,
          keyword
        );

        if (updated.changed) {
          await shopify.updateArticle(blogId, candidate.article.id, {
            body_html: updated.html,
          });

          results.push({
            source_article_id: candidate.article.id,
            source_title: candidate.article.title,
            anchor_text: updated.anchorText,
            link_url: newArticleUrl,
          });
        }
      }
    } catch (err) {
      // Don't fail the pipeline if interlinking fails
      results.push({ error: err.message });
    }

    return results;
  }

  _buildKeywordSet(text, tags, targetKeywords) {
    const words = new Set();
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'this', 'that', 'it', 'not', 'no', 'all', 'your', 'you', 'how', 'what',
      'why', 'when', 'where', 'which', 'who', 'can', 'will', 'do', 'does',
    ]);

    const addWords = (str) => {
      if (!str) return;
      const normalized = typeof str === 'string' ? str : String(str);
      normalized
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopWords.has(w))
        .forEach(w => words.add(w));
    };

    addWords(text);

    if (Array.isArray(tags)) {
      tags.forEach(t => addWords(t));
    } else if (typeof tags === 'string') {
      addWords(tags);
    }

    if (Array.isArray(targetKeywords)) {
      targetKeywords.forEach(k => addWords(k));
    }

    return words;
  }

  /**
   * Insert a link to the new article into an existing article's HTML.
   * Strategy: find the last <p> before the final closing tag and append
   * a contextual sentence. Keeps it clean and non-disruptive.
   */
  _insertLinkIntoHtml(html, linkUrl, linkTitle, keyword) {
    if (!html || html.trim().length === 0) {
      return { html, changed: false, anchorText: '' };
    }

    const $ = cheerio.load(html, { decodeEntities: false });

    // Use the keyword as anchor text (more natural than the full title)
    const anchorText = keyword || linkTitle;

    // Build a short contextual sentence
    const sentence = `<p>Related: <a href="${linkUrl}">${anchorText}</a></p>`;

    // Find the best insertion point: before the last heading or at the end
    const lastH2 = $('h2').last();
    if (lastH2.length > 0) {
      // Insert before the last H2 (usually a conclusion or CTA)
      lastH2.before(sentence);
    } else {
      // Append at the end
      $.root().append(sentence);
    }

    return { html: $.html(), changed: true, anchorText };
  }

  // ====================================================================
  // Keyword tracking
  // ====================================================================

  _trackKeyword(siteId, keyword, url) {
    const db = getDb();

    const existing = db.prepare(
      'SELECT id FROM keywords WHERE site_id = ? AND keyword = ?'
    ).get(siteId, keyword);

    if (!existing) {
      db.prepare(`
        INSERT INTO keywords (site_id, keyword, url) VALUES (?, ?, ?)
      `).run(siteId, keyword, url);
    }
  }

  // ====================================================================
  // Pipeline run logging
  // ====================================================================

  _logRun(siteId, data) {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO pipeline_runs (site_id, keyword, topic, blog_id, content_id, article_id, article_url, steps, status, started_at, finished_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)
    `);

    const result = stmt.run(
      siteId || null,
      data.keyword,
      data.topic,
      data.blogId || null,
      data.contentId || null,
      data.articleId || null,
      data.articleUrl || null,
      JSON.stringify(data.steps),
      data.startedAt,
      data.finishedAt
    );

    return result.lastInsertRowid;
  }
}

module.exports = new PublishPipeline();
