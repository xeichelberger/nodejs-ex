const { getDb } = require('../database');

/**
 * SERP (Search Engine Results Page) position tracker
 *
 * Tracks keyword rankings over time using data from Google Search Console.
 * Provides trend analysis, alerts for ranking changes, and competitor insights.
 */
class SERPTracker {
  /**
   * Add keywords to track for a site
   */
  addKeywords(siteId, keywords) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO keywords (site_id, keyword)
      VALUES (?, ?)
    `);

    const insert = db.transaction((kws) => {
      for (const kw of kws) {
        stmt.run(siteId, kw);
      }
    });

    insert(keywords);
    return { added: keywords.length };
  }

  /**
   * Update keyword positions from GSC data
   */
  updatePositions(siteId) {
    const db = getDb();

    // Get latest GSC data for tracked keywords
    const keywords = db.prepare('SELECT * FROM keywords WHERE site_id = ?').all(siteId);

    const updateStmt = db.prepare(`
      UPDATE keywords SET previous_position = current_position, current_position = ?, url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const historyStmt = db.prepare(`
      INSERT INTO keyword_history (keyword_id, position, url)
      VALUES (?, ?, ?)
    `);

    const update = db.transaction(() => {
      for (const kw of keywords) {
        // Find latest GSC data for this keyword
        const gscRow = db.prepare(`
          SELECT position, page FROM gsc_data
          WHERE site_id = ? AND query = ?
          ORDER BY date DESC LIMIT 1
        `).get(siteId, kw.keyword);

        if (gscRow) {
          updateStmt.run(Math.round(gscRow.position), gscRow.page, kw.id);
          historyStmt.run(kw.id, Math.round(gscRow.position), gscRow.page);
        }
      }
    });

    update();
    return { updated: keywords.length };
  }

  /**
   * Get current keyword rankings with change indicators
   */
  getRankings(siteId, { sortBy = 'position', limit = 100 } = {}) {
    const db = getDb();

    const orderCol = sortBy === 'change' ? 'change' : 'k.current_position';

    const keywords = db.prepare(`
      SELECT
        k.*,
        CASE
          WHEN k.previous_position IS NOT NULL AND k.current_position IS NOT NULL
          THEN k.previous_position - k.current_position
          ELSE 0
        END as change
      FROM keywords k
      WHERE k.site_id = ?
      ORDER BY ${orderCol === 'change' ? 'change DESC' : 'k.current_position ASC'}
      LIMIT ?
    `).all(siteId, limit);

    return keywords.map(kw => ({
      keyword: kw.keyword,
      position: kw.current_position,
      previous_position: kw.previous_position,
      change: kw.current_position && kw.previous_position
        ? kw.previous_position - kw.current_position
        : 0,
      url: kw.url,
      trend: this._getTrend(kw),
      updated_at: kw.updated_at,
    }));
  }

  /**
   * Get ranking history for a specific keyword
   */
  getKeywordHistory(siteId, keyword) {
    const db = getDb();

    const kw = db.prepare('SELECT id FROM keywords WHERE site_id = ? AND keyword = ?')
      .get(siteId, keyword);

    if (!kw) return { keyword, history: [] };

    const history = db.prepare(`
      SELECT position, url, recorded_at
      FROM keyword_history
      WHERE keyword_id = ?
      ORDER BY recorded_at DESC
      LIMIT 90
    `).all(kw.id);

    return {
      keyword,
      history: history.reverse(), // chronological order
    };
  }

  /**
   * Get ranking alerts (significant position changes)
   */
  getAlerts(siteId, threshold = 5) {
    const db = getDb();

    const keywords = db.prepare(`
      SELECT *,
        CASE
          WHEN previous_position IS NOT NULL AND current_position IS NOT NULL
          THEN previous_position - current_position
          ELSE 0
        END as change
      FROM keywords
      WHERE site_id = ?
        AND previous_position IS NOT NULL
        AND current_position IS NOT NULL
        AND ABS(previous_position - current_position) >= ?
    `).all(siteId, threshold);

    return keywords.map(kw => {
      const change = kw.previous_position - kw.current_position;
      return {
        keyword: kw.keyword,
        previous_position: kw.previous_position,
        current_position: kw.current_position,
        change,
        type: change > 0 ? 'improved' : 'dropped',
        severity: Math.abs(change) >= 10 ? 'high' : 'medium',
        url: kw.url,
      };
    });
  }

  /**
   * Get ranking distribution summary
   */
  getDistribution(siteId) {
    const db = getDb();

    const keywords = db.prepare('SELECT current_position FROM keywords WHERE site_id = ? AND current_position IS NOT NULL')
      .all(siteId);

    const distribution = {
      top_3: 0,
      top_10: 0,
      page_1: 0,     // positions 1-10
      page_2: 0,     // positions 11-20
      page_3_plus: 0, // positions 21+
      not_ranking: 0,
      total: keywords.length,
    };

    for (const kw of keywords) {
      const pos = kw.current_position;
      if (pos <= 3) distribution.top_3++;
      if (pos <= 10) {
        distribution.top_10++;
        distribution.page_1++;
      } else if (pos <= 20) {
        distribution.page_2++;
      } else {
        distribution.page_3_plus++;
      }
    }

    return distribution;
  }

  /**
   * Find keywords with opportunities (close to page 1)
   */
  getOpportunities(siteId) {
    const db = getDb();

    // Keywords on positions 11-20 that could be pushed to page 1
    const strikingDistance = db.prepare(`
      SELECT * FROM keywords
      WHERE site_id = ? AND current_position BETWEEN 8 AND 20
      ORDER BY current_position ASC
    `).all(siteId);

    // Keywords that recently improved (momentum)
    const improving = db.prepare(`
      SELECT *,
        previous_position - current_position as change
      FROM keywords
      WHERE site_id = ?
        AND previous_position IS NOT NULL
        AND current_position < previous_position
      ORDER BY (previous_position - current_position) DESC
      LIMIT 20
    `).all(siteId);

    return {
      striking_distance: strikingDistance.map(kw => ({
        keyword: kw.keyword,
        position: kw.current_position,
        url: kw.url,
        strategy: kw.current_position <= 13
          ? 'Optimize existing page content and build internal links'
          : 'Consider creating dedicated content or improving page authority',
      })),
      improving_keywords: improving.map(kw => ({
        keyword: kw.keyword,
        position: kw.current_position,
        previous: kw.previous_position,
        improvement: kw.previous_position - kw.current_position,
        url: kw.url,
      })),
    };
  }

  _getTrend(kw) {
    if (!kw.current_position || !kw.previous_position) return 'new';
    const change = kw.previous_position - kw.current_position;
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'stable';
  }
}

module.exports = new SERPTracker();
