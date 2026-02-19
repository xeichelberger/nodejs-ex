const { getDb } = require('../database');
const gsc = require('./google-search-console');

/**
 * Content Performance Loop
 *
 * Tracks published content from the pipeline, checks GSC for ranking
 * data, and surfaces whether articles are performing, stalled, or
 * need attention. Closes the feedback loop after publish.
 */
class ContentPerformance {
  /**
   * Check performance for ALL published pipeline content for a site.
   * Called by the cron job and by the API on demand.
   */
  async checkAll(siteId) {
    const db = getDb();

    const runs = db.prepare(`
      SELECT * FROM pipeline_runs
      WHERE site_id = ? AND status = 'completed' AND article_url IS NOT NULL
      ORDER BY finished_at DESC
    `).all(siteId);

    if (runs.length === 0) return { checked: 0, results: [] };

    const results = [];
    for (const run of runs) {
      const snapshot = await this._checkOne(run, siteId);
      results.push(snapshot);
    }

    return { checked: results.length, results };
  }

  /**
   * Check performance for a single pipeline run.
   */
  async checkRun(pipelineRunId) {
    const db = getDb();
    const run = db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(pipelineRunId);
    if (!run) throw new Error(`Pipeline run ${pipelineRunId} not found`);
    if (!run.article_url) throw new Error('This pipeline run has no published article');

    return this._checkOne(run, run.site_id);
  }

  /**
   * Get a performance overview across all published content for a site.
   * Groups articles by status for a quick dashboard view.
   */
  getOverview(siteId) {
    const db = getDb();

    // Get the latest snapshot for each pipeline run
    const snapshots = db.prepare(`
      SELECT cp.*,
        pr.keyword, pr.topic, pr.article_url, pr.finished_at as published_at
      FROM content_performance cp
      JOIN pipeline_runs pr ON cp.pipeline_run_id = pr.id
      WHERE cp.site_id = ?
        AND cp.id IN (
          SELECT MAX(id) FROM content_performance WHERE site_id = ? GROUP BY pipeline_run_id
        )
      ORDER BY cp.checked_at DESC
    `).all(siteId, siteId);

    const overview = {
      total_articles: snapshots.length,
      top_3: [],
      page_1: [],
      ranking: [],
      indexing: [],
      not_indexed: [],
      stalled: [],
      declining: [],
    };

    for (const snap of snapshots) {
      const item = {
        pipeline_run_id: snap.pipeline_run_id,
        keyword: snap.keyword,
        article_url: snap.article_url,
        position: snap.position,
        previous_position: snap.previous_position,
        clicks: snap.clicks,
        impressions: snap.impressions,
        ctr: snap.ctr,
        days_since_publish: snap.days_since_publish,
        status: snap.status,
        checked_at: snap.checked_at,
      };

      switch (snap.status) {
        case 'top_3': overview.top_3.push(item); break;
        case 'page_1': overview.page_1.push(item); break;
        case 'ranking': overview.ranking.push(item); break;
        case 'indexing': overview.indexing.push(item); break;
        case 'not_indexed': overview.not_indexed.push(item); break;
        case 'stalled': overview.stalled.push(item); break;
        case 'declining': overview.declining.push(item); break;
        default: overview.ranking.push(item);
      }
    }

    // Summary stats
    overview.summary = {
      performing: overview.top_3.length + overview.page_1.length,
      climbing: overview.ranking.length,
      waiting: overview.indexing.length + overview.not_indexed.length,
      needs_attention: overview.stalled.length + overview.declining.length,
    };

    return overview;
  }

  /**
   * Get articles that need attention: stalled, declining, or not indexed
   * after a reasonable time period.
   */
  getNeedingAttention(siteId) {
    const db = getDb();

    const snapshots = db.prepare(`
      SELECT cp.*,
        pr.keyword, pr.topic, pr.article_url, pr.finished_at as published_at
      FROM content_performance cp
      JOIN pipeline_runs pr ON cp.pipeline_run_id = pr.id
      WHERE cp.site_id = ?
        AND cp.status IN ('stalled', 'declining', 'not_indexed')
        AND cp.days_since_publish > 7
        AND cp.id IN (
          SELECT MAX(id) FROM content_performance WHERE site_id = ? GROUP BY pipeline_run_id
        )
      ORDER BY cp.days_since_publish DESC
    `).all(siteId, siteId);

    return snapshots.map(snap => ({
      pipeline_run_id: snap.pipeline_run_id,
      keyword: snap.keyword,
      article_url: snap.article_url,
      position: snap.position,
      days_since_publish: snap.days_since_publish,
      status: snap.status,
      recommendation: this._getRecommendation(snap),
    }));
  }

  /**
   * Get position history for a specific published article.
   * Shows how the keyword ranking changed over time since publish.
   */
  getHistory(pipelineRunId) {
    const db = getDb();

    const snapshots = db.prepare(`
      SELECT cp.*, pr.keyword, pr.article_url
      FROM content_performance cp
      JOIN pipeline_runs pr ON cp.pipeline_run_id = pr.id
      WHERE cp.pipeline_run_id = ?
      ORDER BY cp.checked_at ASC
    `).all(pipelineRunId);

    if (snapshots.length === 0) return { pipeline_run_id: pipelineRunId, history: [] };

    const first = snapshots[0];

    return {
      pipeline_run_id: pipelineRunId,
      keyword: first.keyword,
      article_url: first.article_url,
      history: snapshots.map(s => ({
        position: s.position,
        clicks: s.clicks,
        impressions: s.impressions,
        ctr: s.ctr,
        status: s.status,
        days_since_publish: s.days_since_publish,
        checked_at: s.checked_at,
      })),
    };
  }

  // ====================================================================
  // Internal: check a single pipeline run and save a snapshot
  // ====================================================================

  async _checkOne(run, siteId) {
    const db = getDb();

    const publishedAt = run.finished_at || run.started_at;
    const daysSincePublish = Math.floor(
      (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    let position = null;
    let clicks = 0;
    let impressions = 0;
    let ctr = 0;

    // Try GSC data first (most accurate)
    if (gsc.isConfigured() && run.keyword) {
      const gscData = await this._getGSCDataForKeyword(run.keyword, run.article_url);
      if (gscData) {
        position = gscData.position;
        clicks = gscData.clicks;
        impressions = gscData.impressions;
        ctr = gscData.ctr;
      }
    }

    // Fall back to local gsc_data table if live GSC call didn't return data
    if (position === null && siteId && run.keyword) {
      const localData = db.prepare(`
        SELECT position, clicks, impressions, ctr FROM gsc_data
        WHERE site_id = ? AND query = ?
        ORDER BY date DESC LIMIT 1
      `).get(siteId, run.keyword);

      if (localData) {
        position = Math.round(localData.position);
        clicks = localData.clicks;
        impressions = localData.impressions;
        ctr = localData.ctr;
      }
    }

    // Also try matching on article URL in gsc_data
    if (position === null && siteId && run.article_url) {
      const urlData = db.prepare(`
        SELECT position, SUM(clicks) as clicks, SUM(impressions) as impressions, AVG(ctr) as ctr
        FROM gsc_data
        WHERE site_id = ? AND page LIKE ?
        ORDER BY date DESC LIMIT 1
      `).get(siteId, `%${this._extractPath(run.article_url)}%`);

      if (urlData && urlData.position) {
        position = Math.round(urlData.position);
        clicks = urlData.clicks || 0;
        impressions = urlData.impressions || 0;
        ctr = urlData.ctr || 0;
      }
    }

    // Get previous snapshot for comparison
    const prevSnapshot = db.prepare(`
      SELECT position FROM content_performance
      WHERE pipeline_run_id = ?
      ORDER BY checked_at DESC LIMIT 1
    `).get(run.id);

    const previousPosition = prevSnapshot ? prevSnapshot.position : null;

    // Determine status
    const status = this._determineStatus(position, previousPosition, daysSincePublish, impressions);

    // Save snapshot
    const stmt = db.prepare(`
      INSERT INTO content_performance
        (site_id, pipeline_run_id, content_id, keyword, article_url,
         position, previous_position, clicks, impressions, ctr,
         days_since_publish, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      siteId, run.id, run.content_id, run.keyword, run.article_url,
      position, previousPosition, clicks, impressions, ctr,
      daysSincePublish, status
    );

    const snapshot = {
      id: result.lastInsertRowid,
      pipeline_run_id: run.id,
      keyword: run.keyword,
      article_url: run.article_url,
      position,
      previous_position: previousPosition,
      position_change: previousPosition && position ? previousPosition - position : null,
      clicks,
      impressions,
      ctr,
      days_since_publish: daysSincePublish,
      status,
      recommendation: this._getRecommendation({ position, previousPosition, daysSincePublish, impressions, status }),
    };

    return snapshot;
  }

  /**
   * Get GSC data for a keyword (live query).
   */
  async _getGSCDataForKeyword(keyword, articleUrl) {
    try {
      const data = await gsc.getSearchAnalytics({
        dimensions: ['query', 'page'],
        rowLimit: 100,
      });

      // Find exact keyword match
      const keywordLower = keyword.toLowerCase();
      const match = data.find(row =>
        row.query && row.query.toLowerCase() === keywordLower
      );

      if (match) {
        return {
          position: Math.round(match.position),
          clicks: match.clicks,
          impressions: match.impressions,
          ctr: match.ctr,
        };
      }

      // Try partial match on the article URL
      if (articleUrl) {
        const urlPath = this._extractPath(articleUrl);
        const urlMatch = data.find(row =>
          row.page && row.page.includes(urlPath) &&
          row.query && row.query.toLowerCase().includes(keywordLower.split(' ')[0])
        );
        if (urlMatch) {
          return {
            position: Math.round(urlMatch.position),
            clicks: urlMatch.clicks,
            impressions: urlMatch.impressions,
            ctr: urlMatch.ctr,
          };
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Determine the performance status of an article.
   */
  _determineStatus(position, previousPosition, daysSincePublish, impressions) {
    // Not showing up at all
    if (position === null) {
      if (daysSincePublish <= 7) return 'indexing';     // Still new, give it time
      if (daysSincePublish <= 21) return 'not_indexed';  // Should be indexed by now
      return 'stalled';                                   // Something is wrong
    }

    // Check for decline
    if (previousPosition !== null && position > previousPosition) {
      const drop = position - previousPosition;
      if (drop >= 10) return 'declining';
    }

    // Position-based status
    if (position <= 3) return 'top_3';
    if (position <= 10) return 'page_1';
    if (position <= 20) return 'ranking';

    // Ranked but beyond page 2
    if (daysSincePublish > 30 && position > 20) return 'stalled';

    return 'ranking';
  }

  /**
   * Generate a recommendation based on the article's current status.
   */
  _getRecommendation(snap) {
    const { position, daysSincePublish, impressions, status } = snap;

    switch (status) {
      case 'top_3':
        return 'Performing well. Monitor for position defense. Consider updating content quarterly to maintain freshness.';

      case 'page_1':
        return 'On page 1. To push into top 3: add more internal links, update with fresh data, and build topical authority with supporting content.';

      case 'ranking':
        if (position <= 20) {
          return 'Striking distance of page 1. Add 2-3 internal links from high-authority pages, expand the content by 300-500 words on subtopics, and ensure schema markup is present.';
        }
        return 'Indexed and ranking but needs a boost. Review if the content fully matches search intent, add FAQ sections, and build internal links.';

      case 'indexing':
        return 'Recently published. Google typically indexes new content within 3-7 days. No action needed yet.';

      case 'not_indexed':
        if (daysSincePublish > 14) {
          return 'Not indexed after 2+ weeks. Re-submit URL to Google Search Console, check robots.txt isn\'t blocking it, and verify the page is in the sitemap.';
        }
        return 'Not showing up yet. Give it a few more days. If no movement after 2 weeks, re-submit to GSC.';

      case 'stalled':
        if (impressions === 0 || impressions === null) {
          return 'No impressions detected. The page may not be indexed or is targeting a keyword with no search volume. Verify indexing status and consider retargeting to a keyword with confirmed search demand.';
        }
        return 'Ranking has stalled beyond page 2. Consider: rewriting the introduction for better search intent match, adding more comprehensive coverage, building internal links from 3-5 related pages, or targeting a less competitive long-tail variation.';

      case 'declining':
        return 'Position is dropping. Investigate: has a competitor published better content? Is the page loading slowly? Update the article with fresh information, add new sections, and reinforce internal links.';

      default:
        return 'Continue monitoring.';
    }
  }

  _extractPath(url) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }
}

module.exports = new ContentPerformance();
