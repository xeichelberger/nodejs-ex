const { google } = require('googleapis');
const config = require('../config');
const { getDb } = require('../database');

class GoogleSearchConsole {
  constructor() {
    this.auth = null;
    this.webmasters = null;
    this._init();
  }

  _init() {
    if (config.google.serviceAccountEmail && config.google.privateKey) {
      this.auth = new google.auth.JWT(
        config.google.serviceAccountEmail,
        null,
        config.google.privateKey,
        ['https://www.googleapis.com/auth/webmasters.readonly']
      );
      this.webmasters = google.webmasters({ version: 'v3', auth: this.auth });
    }
  }

  isConfigured() {
    return !!(this.auth && this.webmasters);
  }

  /**
   * Get search analytics data (queries, clicks, impressions, CTR, position)
   */
  async getSearchAnalytics({
    siteUrl = config.google.siteUrl,
    startDate,
    endDate,
    dimensions = ['query', 'page'],
    rowLimit = 1000,
    startRow = 0,
  } = {}) {
    this._ensureConfigured();

    if (!startDate) {
      const d = new Date();
      d.setDate(d.getDate() - 28);
      startDate = d.toISOString().split('T')[0];
    }
    if (!endDate) {
      const d = new Date();
      d.setDate(d.getDate() - 3); // GSC data has ~3 day delay
      endDate = d.toISOString().split('T')[0];
    }

    const response = await this.webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit,
        startRow,
      },
    });

    return (response.data.rows || []).map(row => {
      const result = {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      };

      dimensions.forEach((dim, i) => {
        result[dim] = row.keys[i];
      });

      return result;
    });
  }

  /**
   * Get top performing queries
   */
  async getTopQueries(options = {}) {
    return this.getSearchAnalytics({
      ...options,
      dimensions: ['query'],
    });
  }

  /**
   * Get top pages by clicks
   */
  async getTopPages(options = {}) {
    return this.getSearchAnalytics({
      ...options,
      dimensions: ['page'],
    });
  }

  /**
   * Get queries for a specific page
   */
  async getQueriesForPage(pageUrl, options = {}) {
    this._ensureConfigured();

    const siteUrl = options.siteUrl || config.google.siteUrl;
    const startDate = options.startDate || this._daysAgo(28);
    const endDate = options.endDate || this._daysAgo(3);

    const response = await this.webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{
            dimension: 'page',
            expression: pageUrl,
          }],
        }],
        rowLimit: 100,
      },
    });

    return (response.data.rows || []).map(row => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));
  }

  /**
   * Find pages with high impressions but low CTR (optimization opportunities)
   */
  async findLowCTRPages(options = {}) {
    const data = await this.getSearchAnalytics({
      ...options,
      dimensions: ['query', 'page'],
      rowLimit: 2000,
    });

    // Pages with high impressions (>100) but low CTR (<3%)
    return data
      .filter(row => row.impressions > 100 && row.ctr < 0.03)
      .sort((a, b) => b.impressions - a.impressions);
  }

  /**
   * Find keywords where site ranks on page 2 (position 11-20) -- easy wins
   */
  async findStrikingDistanceKeywords(options = {}) {
    const data = await this.getTopQueries(options);

    return data
      .filter(row => row.position >= 8 && row.position <= 20 && row.impressions > 50)
      .sort((a, b) => a.position - b.position);
  }

  /**
   * Sync GSC data to local database
   */
  async syncToDatabase(siteId, options = {}) {
    const data = await this.getSearchAnalytics(options);
    const db = getDb();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO gsc_data (site_id, query, page, clicks, impressions, ctr, position, date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    const insert = db.transaction((rows) => {
      for (const row of rows) {
        stmt.run(siteId, row.query, row.page, row.clicks, row.impressions, row.ctr, row.position, today);
      }
    });

    insert(data);
    return { synced: data.length };
  }

  /**
   * Get URL inspection data (index status)
   */
  async getIndexStatus(pageUrl) {
    this._ensureConfigured();

    try {
      const searchConsole = google.searchconsole({ version: 'v1', auth: this.auth });
      const response = await searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: pageUrl,
          siteUrl: config.google.siteUrl,
        },
      });
      return response.data;
    } catch (err) {
      return { error: err.message };
    }
  }

  /**
   * Get list of sitemaps submitted
   */
  async getSitemaps(siteUrl = config.google.siteUrl) {
    this._ensureConfigured();
    const response = await this.webmasters.sitemaps.list({ siteUrl });
    return response.data.sitemap || [];
  }

  _ensureConfigured() {
    if (!this.isConfigured()) {
      throw new Error('Google Search Console not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.');
    }
  }

  _daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
}

module.exports = new GoogleSearchConsole();
