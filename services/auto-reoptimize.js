const { getDb } = require('../database');
const contentGenerator = require('./content-generator');
const shopify = require('./shopify');
const gsc = require('./google-search-console');
const contentPerformance = require('./content-performance');

/**
 * Auto-Reoptimize Engine
 *
 * When the performance loop flags an article as stalled, declining, or
 * not-indexed, this service automatically takes corrective action:
 *
 *   not_indexed   → resubmit to GSC indexing API
 *   stalled       → add internal links + regenerate meta description
 *   declining     → add internal links + refresh content signals + resubmit
 *   ranking (11-20) → add internal links to push toward page 1
 *
 * Every action is logged to the reoptimization_actions table so
 * you have a full audit trail of what the bot did and why.
 */
class AutoReoptimize {
  /**
   * Run the full auto-reoptimize sweep for a site.
   * Called by cron or on demand via the API.
   */
  async sweep(siteId) {
    const db = getDb();
    const actions = [];

    // Get latest performance snapshot for each article
    const snapshots = db.prepare(`
      SELECT cp.*,
        pr.keyword, pr.topic, pr.article_url, pr.blog_id, pr.article_id,
        pr.content_id, pr.finished_at as published_at
      FROM content_performance cp
      JOIN pipeline_runs pr ON cp.pipeline_run_id = pr.id
      WHERE cp.site_id = ?
        AND cp.id IN (
          SELECT MAX(id) FROM content_performance WHERE site_id = ? GROUP BY pipeline_run_id
        )
    `).all(siteId, siteId);

    for (const snap of snapshots) {
      // Skip articles that don't need intervention
      if (['top_3', 'page_1', 'indexing'].includes(snap.status)) continue;

      // Skip if we already took action in the last 7 days for this article
      const recentAction = db.prepare(`
        SELECT id FROM reoptimization_actions
        WHERE pipeline_run_id = ?
          AND created_at > datetime('now', '-7 days')
      `).get(snap.pipeline_run_id);

      if (recentAction) continue;

      const result = await this._reoptimize(snap, siteId);
      if (result) actions.push(result);
    }

    return { site_id: siteId, actions_taken: actions.length, actions };
  }

  /**
   * Reoptimize a single article by pipeline run ID.
   */
  async reoptimizeOne(pipelineRunId) {
    const db = getDb();

    const run = db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(pipelineRunId);
    if (!run) throw new Error(`Pipeline run ${pipelineRunId} not found`);

    // Get latest performance snapshot
    const snap = db.prepare(`
      SELECT * FROM content_performance
      WHERE pipeline_run_id = ?
      ORDER BY checked_at DESC LIMIT 1
    `).get(pipelineRunId);

    if (!snap) {
      // No performance data yet — run a check first
      await contentPerformance.checkRun(pipelineRunId);
      const freshSnap = db.prepare(`
        SELECT * FROM content_performance
        WHERE pipeline_run_id = ?
        ORDER BY checked_at DESC LIMIT 1
      `).get(pipelineRunId);

      if (!freshSnap) throw new Error('Could not generate performance snapshot');

      return this._reoptimize({
        ...freshSnap,
        keyword: run.keyword,
        topic: run.topic,
        article_url: run.article_url,
        blog_id: run.blog_id,
        article_id: run.article_id,
        content_id: run.content_id,
      }, run.site_id);
    }

    return this._reoptimize({
      ...snap,
      keyword: run.keyword,
      topic: run.topic,
      article_url: run.article_url,
      blog_id: run.blog_id,
      article_id: run.article_id,
      content_id: run.content_id,
    }, run.site_id);
  }

  /**
   * Get action history for a site or specific article.
   */
  getActions(siteId, { pipelineRunId, limit = 50 } = {}) {
    const db = getDb();

    if (pipelineRunId) {
      return db.prepare(`
        SELECT * FROM reoptimization_actions
        WHERE pipeline_run_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(pipelineRunId, limit);
    }

    return db.prepare(`
      SELECT * FROM reoptimization_actions
      WHERE site_id = ?
      ORDER BY created_at DESC LIMIT ?
    `).all(siteId, limit);
  }

  // ====================================================================
  // Internal: decide what to do and do it
  // ====================================================================

  async _reoptimize(snap, siteId) {
    const strategy = this._pickStrategy(snap);
    if (!strategy) return null;

    const stepResults = [];
    let success = true;

    for (const step of strategy.steps) {
      try {
        const result = await this._executeStep(step, snap, siteId);
        stepResults.push({ step, ...result });
      } catch (err) {
        stepResults.push({ step, success: false, error: err.message });
        success = false;
      }
    }

    // Log the action
    const actionId = this._logAction(siteId, snap, strategy, stepResults, success);

    return {
      action_id: actionId,
      pipeline_run_id: snap.pipeline_run_id,
      keyword: snap.keyword,
      article_url: snap.article_url,
      trigger: snap.status,
      strategy: strategy.name,
      steps: stepResults,
      success,
    };
  }

  /**
   * Pick the right reoptimization strategy based on article status.
   */
  _pickStrategy(snap) {
    switch (snap.status) {
      case 'not_indexed':
        return {
          name: 'resubmit_for_indexing',
          reason: `Article not indexed after ${snap.days_since_publish} days`,
          steps: ['resubmit_gsc'],
        };

      case 'stalled':
        if (!snap.impressions || snap.impressions === 0) {
          return {
            name: 'resubmit_and_retarget',
            reason: 'No impressions — may not be indexed or keyword has no volume',
            steps: ['resubmit_gsc', 'regenerate_meta'],
          };
        }
        return {
          name: 'boost_stalled_article',
          reason: `Stalled at position ${snap.position || 'unknown'} for ${snap.days_since_publish} days`,
          steps: ['add_internal_links', 'regenerate_meta', 'resubmit_gsc'],
        };

      case 'declining':
        return {
          name: 'recover_declining_article',
          reason: `Position dropped from ${snap.previous_position} to ${snap.position}`,
          steps: ['add_internal_links', 'regenerate_meta', 'resubmit_gsc'],
        };

      case 'ranking':
        // Only intervene for striking distance articles (11-20)
        if (snap.position && snap.position >= 11 && snap.position <= 20) {
          return {
            name: 'push_to_page_1',
            reason: `Striking distance at position ${snap.position}`,
            steps: ['add_internal_links'],
          };
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Execute a single reoptimization step.
   */
  async _executeStep(step, snap, siteId) {
    switch (step) {
      case 'resubmit_gsc':
        return this._stepResubmitGSC(snap);

      case 'add_internal_links':
        return this._stepAddInternalLinks(snap, siteId);

      case 'regenerate_meta':
        return this._stepRegenerateMeta(snap, siteId);

      default:
        return { success: false, error: `Unknown step: ${step}` };
    }
  }

  /**
   * Step: Resubmit URL to Google Search Console for (re-)indexing.
   */
  async _stepResubmitGSC(snap) {
    if (!gsc.isConfigured()) {
      return { success: false, skipped: true, reason: 'GSC not configured' };
    }
    if (!snap.article_url) {
      return { success: false, skipped: true, reason: 'No article URL' };
    }

    const result = await gsc.submitUrlForIndexing(snap.article_url);
    return {
      success: result.submitted || false,
      url: snap.article_url,
      gsc_response: result,
    };
  }

  /**
   * Step: Add internal links from existing high-relevance articles
   * to the underperforming one.
   */
  async _stepAddInternalLinks(snap, siteId) {
    if (!shopify.isConfigured()) {
      return { success: false, skipped: true, reason: 'Shopify not configured' };
    }
    if (!snap.blog_id || !snap.article_url) {
      return { success: false, skipped: true, reason: 'Missing blog_id or article_url' };
    }

    const linksAdded = [];

    try {
      const articles = await shopify.getArticles(snap.blog_id, 50);
      // Don't modify the target article itself
      const candidates = articles.filter(a => a.id !== snap.article_id);

      if (candidates.length === 0) {
        return { success: true, links_added: 0, reason: 'No candidate articles found' };
      }

      // Score by keyword overlap
      const keyword = snap.keyword || '';
      const keywordWords = keyword.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      const scored = candidates.map(a => {
        const text = ((a.title || '') + ' ' + (a.tags || '')).toLowerCase();
        const score = keywordWords.filter(w => text.includes(w)).length;
        return { article: a, score };
      });

      const topCandidates = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      for (const candidate of topCandidates) {
        const html = candidate.article.body_html || '';
        // Don't add duplicate links
        if (html.includes(snap.article_url)) continue;

        const anchorText = snap.keyword || 'this article';
        const linkHtml = `<p>You might also like: <a href="${snap.article_url}">${anchorText}</a></p>`;

        // Insert before last H2 or append
        const cheerio = require('cheerio');
        const $ = cheerio.load(html, { decodeEntities: false });
        const lastH2 = $('h2').last();
        if (lastH2.length > 0) {
          lastH2.before(linkHtml);
        } else {
          $.root().append(linkHtml);
        }

        await shopify.updateArticle(snap.blog_id, candidate.article.id, {
          body_html: $.html(),
        });

        linksAdded.push({
          source_article_id: candidate.article.id,
          source_title: candidate.article.title,
          anchor_text: anchorText,
        });
      }
    } catch (err) {
      return { success: false, error: err.message, links_added: linksAdded.length };
    }

    return { success: true, links_added: linksAdded.length, links: linksAdded };
  }

  /**
   * Step: Regenerate the meta description and update on Shopify.
   * A fresh, keyword-optimized meta description can improve CTR.
   */
  async _stepRegenerateMeta(snap, siteId) {
    if (!contentGenerator.isConfigured()) {
      return { success: false, skipped: true, reason: 'Anthropic API not configured' };
    }
    if (!shopify.isConfigured()) {
      return { success: false, skipped: true, reason: 'Shopify not configured' };
    }
    if (!snap.blog_id || !snap.article_id) {
      return { success: false, skipped: true, reason: 'Missing blog_id or article_id' };
    }

    // Get current article content
    let currentArticle;
    try {
      const articles = await shopify.getArticles(snap.blog_id, 50);
      currentArticle = articles.find(a => a.id === snap.article_id);
    } catch (err) {
      return { success: false, error: `Could not fetch article: ${err.message}` };
    }

    if (!currentArticle) {
      return { success: false, error: 'Article not found on Shopify' };
    }

    // Generate new meta description
    const metaResult = await contentGenerator.generateMetaDescription(
      currentArticle.title,
      currentArticle.body_html || '',
      snap.keyword
    );

    if (!metaResult || !metaResult.length) {
      return { success: false, error: 'Failed to generate meta description' };
    }

    // Pick the first suggestion
    const newMeta = metaResult[0];

    // Update on Shopify
    await shopify.updateArticle(snap.blog_id, snap.article_id, {
      meta_description: newMeta,
    });

    return {
      success: true,
      old_meta: currentArticle.meta_description || '(none)',
      new_meta: newMeta,
    };
  }

  // ====================================================================
  // Logging
  // ====================================================================

  _logAction(siteId, snap, strategy, stepResults, success) {
    const db = getDb();

    const stmt = db.prepare(`
      INSERT INTO reoptimization_actions
        (site_id, pipeline_run_id, keyword, article_url, trigger_status,
         strategy, reason, steps, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      siteId,
      snap.pipeline_run_id,
      snap.keyword,
      snap.article_url,
      snap.status,
      strategy.name,
      strategy.reason,
      JSON.stringify(stepResults),
      success ? 1 : 0
    );

    return result.lastInsertRowid;
  }
}

module.exports = new AutoReoptimize();
