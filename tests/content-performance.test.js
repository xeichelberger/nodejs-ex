const { expect } = require('chai');
const sinon = require('sinon');

describe('Content Performance', () => {
  let performance, gsc, db;

  before(() => {
    process.env.DB_PATH = ':memory:';

    // Clear cached modules
    delete require.cache[require.resolve('../database')];
    delete require.cache[require.resolve('../services/content-performance')];
    delete require.cache[require.resolve('../services/google-search-console')];

    db = require('../database').getDb();
    performance = require('../services/content-performance');
    gsc = require('../services/google-search-console');
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    require('../database').close();
  });

  // ==================== Helpers ====================

  let siteId;
  let pipelineRunId;

  before(() => {
    // Create test site
    const siteResult = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://perf-test.com', 'Perf Test');
    siteId = siteResult.lastInsertRowid;

    // Create a completed pipeline run with published article
    const runResult = db.prepare(`
      INSERT INTO pipeline_runs (site_id, keyword, topic, article_url, status, started_at, finished_at)
      VALUES (?, ?, ?, ?, 'completed', datetime('now', '-14 days'), datetime('now', '-14 days'))
    `).run(siteId, 'organic baby clothes', 'Best organic baby clothes for newborns', 'https://perf-test.com/blogs/news/organic-baby-clothes');
    pipelineRunId = runResult.lastInsertRowid;
  });

  // ==================== _determineStatus ====================

  describe('_determineStatus', () => {
    it('should return indexing for new articles with no data', () => {
      expect(performance._determineStatus(null, null, 3, 0)).to.equal('indexing');
    });

    it('should return not_indexed after 7 days with no data', () => {
      expect(performance._determineStatus(null, null, 10, 0)).to.equal('not_indexed');
    });

    it('should return stalled after 21 days with no data', () => {
      expect(performance._determineStatus(null, null, 25, 0)).to.equal('stalled');
    });

    it('should return top_3 for positions 1-3', () => {
      expect(performance._determineStatus(1, null, 30, 100)).to.equal('top_3');
      expect(performance._determineStatus(3, null, 30, 100)).to.equal('top_3');
    });

    it('should return page_1 for positions 4-10', () => {
      expect(performance._determineStatus(4, null, 30, 100)).to.equal('page_1');
      expect(performance._determineStatus(10, null, 30, 100)).to.equal('page_1');
    });

    it('should return ranking for positions 11-20', () => {
      expect(performance._determineStatus(15, null, 10, 100)).to.equal('ranking');
    });

    it('should return declining when position drops 10+', () => {
      expect(performance._determineStatus(20, 8, 30, 100)).to.equal('declining');
    });

    it('should return stalled when stuck beyond page 2 for 30+ days', () => {
      expect(performance._determineStatus(25, null, 35, 100)).to.equal('stalled');
    });
  });

  // ==================== _getRecommendation ====================

  describe('_getRecommendation', () => {
    it('should return maintenance advice for top_3', () => {
      const rec = performance._getRecommendation({ status: 'top_3' });
      expect(rec).to.include('Performing well');
    });

    it('should return push advice for page_1', () => {
      const rec = performance._getRecommendation({ status: 'page_1' });
      expect(rec).to.include('top 3');
    });

    it('should return patience advice for indexing', () => {
      const rec = performance._getRecommendation({ status: 'indexing' });
      expect(rec).to.include('No action needed');
    });

    it('should return resubmit advice for not_indexed after 2 weeks', () => {
      const rec = performance._getRecommendation({ status: 'not_indexed', daysSincePublish: 15 });
      expect(rec).to.include('Re-submit');
    });

    it('should return investigation advice for declining', () => {
      const rec = performance._getRecommendation({ status: 'declining' });
      expect(rec).to.include('dropping');
    });

    it('should mention striking distance for ranking articles near page 1', () => {
      const rec = performance._getRecommendation({ status: 'ranking', position: 12 });
      expect(rec).to.include('Striking distance');
    });

    it('should mention search volume for stalled with no impressions', () => {
      const rec = performance._getRecommendation({ status: 'stalled', impressions: 0 });
      expect(rec).to.include('no search volume');
    });
  });

  // ==================== _extractPath ====================

  describe('_extractPath', () => {
    it('should extract pathname from full URL', () => {
      expect(performance._extractPath('https://example.com/blogs/news/test')).to.equal('/blogs/news/test');
    });

    it('should return input for non-URL strings', () => {
      expect(performance._extractPath('/blogs/news/test')).to.equal('/blogs/news/test');
    });
  });

  // ==================== checkAll / checkRun ====================

  describe('checkAll', () => {
    it('should return empty for site with no pipeline runs', async () => {
      const result = await performance.checkAll(99999);
      expect(result.checked).to.equal(0);
      expect(result.results).to.have.length(0);
    });

    it('should check published pipeline content and save snapshots', async () => {
      // Stub GSC as not configured so it falls through to local data
      sinon.stub(gsc, 'isConfigured').returns(false);

      // Add some local GSC data for the keyword
      db.prepare(`
        INSERT INTO gsc_data (site_id, query, page, clicks, impressions, ctr, position, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(siteId, 'organic baby clothes', 'https://perf-test.com/blogs/news/organic-baby-clothes', 25, 500, 0.05, 8, '2026-02-18');

      const result = await performance.checkAll(siteId);
      expect(result.checked).to.equal(1);
      expect(result.results).to.have.length(1);

      const snap = result.results[0];
      expect(snap.keyword).to.equal('organic baby clothes');
      expect(snap.position).to.equal(8);
      expect(snap.clicks).to.equal(25);
      expect(snap.impressions).to.equal(500);
      expect(snap.status).to.equal('page_1');
      expect(snap.recommendation).to.be.a('string');
      expect(snap.days_since_publish).to.be.at.least(13);
    });
  });

  describe('checkRun', () => {
    it('should throw for non-existent run', async () => {
      try {
        await performance.checkRun(99999);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('not found');
      }
    });

    it('should check a single pipeline run', async () => {
      sinon.stub(gsc, 'isConfigured').returns(false);

      const snap = await performance.checkRun(pipelineRunId);
      expect(snap.pipeline_run_id).to.equal(pipelineRunId);
      expect(snap.keyword).to.equal('organic baby clothes');
    });
  });

  // ==================== getOverview ====================

  describe('getOverview', () => {
    it('should group articles by status', () => {
      const overview = performance.getOverview(siteId);

      expect(overview.total_articles).to.be.at.least(1);
      expect(overview).to.have.property('top_3');
      expect(overview).to.have.property('page_1');
      expect(overview).to.have.property('ranking');
      expect(overview).to.have.property('stalled');
      expect(overview).to.have.property('declining');
      expect(overview).to.have.property('summary');
      expect(overview.summary).to.have.property('performing');
      expect(overview.summary).to.have.property('needs_attention');
    });

    it('should return empty overview for unknown site', () => {
      const overview = performance.getOverview(99999);
      expect(overview.total_articles).to.equal(0);
    });
  });

  // ==================== getHistory ====================

  describe('getHistory', () => {
    it('should return position history for a pipeline run', () => {
      const history = performance.getHistory(pipelineRunId);
      expect(history.pipeline_run_id).to.equal(pipelineRunId);
      expect(history.keyword).to.equal('organic baby clothes');
      expect(history.history).to.be.an('array');
      // We've done at least 2 checks above (checkAll + checkRun)
      expect(history.history.length).to.be.at.least(2);
    });

    it('should return empty history for unknown run', () => {
      const history = performance.getHistory(99999);
      expect(history.history).to.have.length(0);
    });
  });

  // ==================== getNeedingAttention ====================

  describe('getNeedingAttention', () => {
    it('should return articles with stalled/declining/not_indexed status', () => {
      // Create a stalled article
      const stalledRun = db.prepare(`
        INSERT INTO pipeline_runs (site_id, keyword, topic, article_url, status, started_at, finished_at)
        VALUES (?, ?, ?, ?, 'completed', datetime('now', '-45 days'), datetime('now', '-45 days'))
      `).run(siteId, 'stalled keyword', 'Stalled topic', 'https://perf-test.com/blogs/news/stalled');

      db.prepare(`
        INSERT INTO content_performance
          (site_id, pipeline_run_id, keyword, article_url, position, days_since_publish, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(siteId, stalledRun.lastInsertRowid, 'stalled keyword', 'https://perf-test.com/blogs/news/stalled', null, 45, 'stalled');

      const items = performance.getNeedingAttention(siteId);
      expect(items).to.be.an('array');

      const stalledItem = items.find(i => i.keyword === 'stalled keyword');
      expect(stalledItem).to.not.be.undefined;
      expect(stalledItem.status).to.equal('stalled');
      expect(stalledItem.recommendation).to.be.a('string');
    });
  });

  // ==================== Database schema ====================

  describe('content_performance table', () => {
    it('should exist in the database', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables.map(t => t.name)).to.include('content_performance');
    });

    it('should have the expected columns', () => {
      const columns = db.prepare('PRAGMA table_info(content_performance)').all();
      const colNames = columns.map(c => c.name);
      expect(colNames).to.include('pipeline_run_id');
      expect(colNames).to.include('position');
      expect(colNames).to.include('clicks');
      expect(colNames).to.include('impressions');
      expect(colNames).to.include('days_since_publish');
      expect(colNames).to.include('status');
    });
  });
});
