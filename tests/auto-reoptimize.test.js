const { expect } = require('chai');
const sinon = require('sinon');

describe('Auto-Reoptimize', () => {
  let reopt, gsc, shopify, contentGenerator, db;

  before(() => {
    process.env.DB_PATH = ':memory:';

    // Clear cached modules
    delete require.cache[require.resolve('../database')];
    delete require.cache[require.resolve('../services/auto-reoptimize')];
    delete require.cache[require.resolve('../services/google-search-console')];
    delete require.cache[require.resolve('../services/shopify')];
    delete require.cache[require.resolve('../services/content-generator')];
    delete require.cache[require.resolve('../services/content-performance')];

    db = require('../database').getDb();
    reopt = require('../services/auto-reoptimize');
    gsc = require('../services/google-search-console');
    shopify = require('../services/shopify');
    contentGenerator = require('../services/content-generator');
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    require('../database').close();
  });

  // ==================== Test data setup ====================

  let siteId;
  let stalledRunId, decliningRunId, strikingRunId, topRunId;

  before(() => {
    // Create test site
    const siteResult = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://reopt-test.com', 'Reopt Test');
    siteId = siteResult.lastInsertRowid;

    // Create pipeline runs for different statuses
    const createRun = (keyword, url, daysAgo) => {
      return db.prepare(`
        INSERT INTO pipeline_runs (site_id, keyword, topic, article_url, blog_id, article_id, status, started_at, finished_at)
        VALUES (?, ?, ?, ?, 1, 100, 'completed', datetime('now', '-${daysAgo} days'), datetime('now', '-${daysAgo} days'))
      `).run(siteId, keyword, `Topic for ${keyword}`, url);
    };

    stalledRunId = createRun('stalled seo keyword', 'https://reopt-test.com/blogs/news/stalled-article', 45).lastInsertRowid;
    decliningRunId = createRun('declining keyword', 'https://reopt-test.com/blogs/news/declining-article', 30).lastInsertRowid;
    strikingRunId = createRun('striking distance kw', 'https://reopt-test.com/blogs/news/striking-article', 20).lastInsertRowid;
    topRunId = createRun('top keyword', 'https://reopt-test.com/blogs/news/top-article', 60).lastInsertRowid;

    // Create performance snapshots for each
    const createSnap = (runId, keyword, url, position, prevPosition, days, status) => {
      db.prepare(`
        INSERT INTO content_performance (site_id, pipeline_run_id, keyword, article_url, position, previous_position, clicks, impressions, ctr, days_since_publish, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(siteId, runId, keyword, url, position, prevPosition, 10, 200, 0.05, days, status);
    };

    createSnap(stalledRunId, 'stalled seo keyword', 'https://reopt-test.com/blogs/news/stalled-article', 35, 33, 45, 'stalled');
    createSnap(decliningRunId, 'declining keyword', 'https://reopt-test.com/blogs/news/declining-article', 25, 12, 30, 'declining');
    createSnap(strikingRunId, 'striking distance kw', 'https://reopt-test.com/blogs/news/striking-article', 14, 16, 20, 'ranking');
    createSnap(topRunId, 'top keyword', 'https://reopt-test.com/blogs/news/top-article', 2, 3, 60, 'top_3');
  });

  // ==================== _pickStrategy ====================

  describe('_pickStrategy', () => {
    it('should pick resubmit_for_indexing for not_indexed articles', () => {
      const strategy = reopt._pickStrategy({ status: 'not_indexed', days_since_publish: 15 });
      expect(strategy.name).to.equal('resubmit_for_indexing');
      expect(strategy.steps).to.include('resubmit_gsc');
    });

    it('should pick resubmit_and_retarget for stalled with no impressions', () => {
      const strategy = reopt._pickStrategy({ status: 'stalled', impressions: 0, days_since_publish: 30 });
      expect(strategy.name).to.equal('resubmit_and_retarget');
      expect(strategy.steps).to.include('resubmit_gsc');
      expect(strategy.steps).to.include('regenerate_meta');
    });

    it('should pick boost_stalled_article for stalled with impressions', () => {
      const strategy = reopt._pickStrategy({ status: 'stalled', impressions: 100, position: 30, days_since_publish: 45 });
      expect(strategy.name).to.equal('boost_stalled_article');
      expect(strategy.steps).to.include('add_internal_links');
      expect(strategy.steps).to.include('regenerate_meta');
      expect(strategy.steps).to.include('resubmit_gsc');
    });

    it('should pick recover_declining_article for declining', () => {
      const strategy = reopt._pickStrategy({ status: 'declining', previous_position: 8, position: 20 });
      expect(strategy.name).to.equal('recover_declining_article');
    });

    it('should pick push_to_page_1 for striking distance articles', () => {
      const strategy = reopt._pickStrategy({ status: 'ranking', position: 14 });
      expect(strategy.name).to.equal('push_to_page_1');
      expect(strategy.steps).to.deep.equal(['add_internal_links']);
    });

    it('should return null for top_3 articles', () => {
      expect(reopt._pickStrategy({ status: 'top_3' })).to.be.null;
    });

    it('should return null for page_1 articles', () => {
      expect(reopt._pickStrategy({ status: 'page_1' })).to.be.null;
    });

    it('should return null for indexing articles', () => {
      expect(reopt._pickStrategy({ status: 'indexing' })).to.be.null;
    });

    it('should return null for ranking articles outside striking distance', () => {
      expect(reopt._pickStrategy({ status: 'ranking', position: 25 })).to.be.null;
    });
  });

  // ==================== _stepResubmitGSC ====================

  describe('_stepResubmitGSC', () => {
    it('should submit URL to GSC when configured', async () => {
      sinon.stub(gsc, 'isConfigured').returns(true);
      sinon.stub(gsc, 'submitUrlForIndexing').resolves({ submitted: true });

      const result = await reopt._stepResubmitGSC({ article_url: 'https://example.com/test' });
      expect(result.success).to.be.true;
      expect(result.url).to.equal('https://example.com/test');
    });

    it('should skip when GSC not configured', async () => {
      sinon.stub(gsc, 'isConfigured').returns(false);

      const result = await reopt._stepResubmitGSC({ article_url: 'https://example.com/test' });
      expect(result.skipped).to.be.true;
    });

    it('should skip when no article URL', async () => {
      sinon.stub(gsc, 'isConfigured').returns(true);

      const result = await reopt._stepResubmitGSC({});
      expect(result.skipped).to.be.true;
    });
  });

  // ==================== _stepAddInternalLinks ====================

  describe('_stepAddInternalLinks', () => {
    it('should skip when Shopify not configured', async () => {
      sinon.stub(shopify, 'isConfigured').returns(false);

      const result = await reopt._stepAddInternalLinks({ blog_id: 1, article_url: 'https://test.com' }, siteId);
      expect(result.skipped).to.be.true;
    });

    it('should skip when missing blog_id', async () => {
      sinon.stub(shopify, 'isConfigured').returns(true);

      const result = await reopt._stepAddInternalLinks({ article_url: 'https://test.com' }, siteId);
      expect(result.skipped).to.be.true;
    });

    it('should add links to related articles', async () => {
      sinon.stub(shopify, 'isConfigured').returns(true);
      sinon.stub(shopify, 'getArticles').resolves([
        { id: 200, title: 'SEO Tips for Beginners', tags: 'seo, keyword', body_html: '<h2>Tips</h2><p>Content here</p><h2>Conclusion</h2>' },
        { id: 201, title: 'Unrelated Article', tags: 'cooking', body_html: '<p>Something else</p>' },
      ]);
      sinon.stub(shopify, 'updateArticle').resolves({});

      const result = await reopt._stepAddInternalLinks({
        blog_id: 1,
        article_id: 100,
        article_url: 'https://reopt-test.com/blogs/news/stalled-article',
        keyword: 'stalled seo keyword',
      }, siteId);

      expect(result.success).to.be.true;
      expect(result.links_added).to.equal(1);
      expect(shopify.updateArticle.calledOnce).to.be.true;
    });
  });

  // ==================== _stepRegenerateMeta ====================

  describe('_stepRegenerateMeta', () => {
    it('should skip when Anthropic not configured', async () => {
      sinon.stub(contentGenerator, 'isConfigured').returns(false);

      const result = await reopt._stepRegenerateMeta({ blog_id: 1, article_id: 100 }, siteId);
      expect(result.skipped).to.be.true;
    });

    it('should skip when missing article_id', async () => {
      sinon.stub(contentGenerator, 'isConfigured').returns(true);
      sinon.stub(shopify, 'isConfigured').returns(true);

      const result = await reopt._stepRegenerateMeta({ blog_id: 1 }, siteId);
      expect(result.skipped).to.be.true;
    });

    it('should regenerate and update meta description', async () => {
      sinon.stub(contentGenerator, 'isConfigured').returns(true);
      sinon.stub(shopify, 'isConfigured').returns(true);
      sinon.stub(shopify, 'getArticles').resolves([
        { id: 100, title: 'Test Article', body_html: '<p>Content</p>', meta_description: 'Old meta' },
      ]);
      sinon.stub(contentGenerator, 'generateMetaDescription').resolves([
        'New optimized meta description for better CTR',
      ]);
      sinon.stub(shopify, 'updateArticle').resolves({});

      const result = await reopt._stepRegenerateMeta({
        blog_id: 1,
        article_id: 100,
        keyword: 'test keyword',
      }, siteId);

      expect(result.success).to.be.true;
      expect(result.old_meta).to.equal('Old meta');
      expect(result.new_meta).to.equal('New optimized meta description for better CTR');
      expect(shopify.updateArticle.calledOnce).to.be.true;
    });
  });

  // ==================== sweep ====================

  describe('sweep', () => {
    it('should skip top_3 and page_1 articles', async () => {
      // Stub all external services as not configured so steps are skipped
      sinon.stub(gsc, 'isConfigured').returns(false);
      sinon.stub(shopify, 'isConfigured').returns(false);
      sinon.stub(contentGenerator, 'isConfigured').returns(false);

      const result = await reopt.sweep(siteId);

      // top_3 should be skipped, stalled/declining/striking should get actions
      expect(result.actions_taken).to.be.at.least(2);

      // Top keyword should not appear in actions
      const topAction = result.actions.find(a => a.keyword === 'top keyword');
      expect(topAction).to.be.undefined;
    });

    it('should not re-act on articles actioned within 7 days', async () => {
      sinon.stub(gsc, 'isConfigured').returns(false);
      sinon.stub(shopify, 'isConfigured').returns(false);
      sinon.stub(contentGenerator, 'isConfigured').returns(false);

      // First sweep already happened above, second should skip those
      const result = await reopt.sweep(siteId);
      expect(result.actions_taken).to.equal(0);
    });

    it('should return empty for site with no performance data', async () => {
      const result = await reopt.sweep(99999);
      expect(result.actions_taken).to.equal(0);
    });
  });

  // ==================== reoptimizeOne ====================

  describe('reoptimizeOne', () => {
    it('should throw for non-existent run', async () => {
      try {
        await reopt.reoptimizeOne(99999);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('not found');
      }
    });
  });

  // ==================== getActions ====================

  describe('getActions', () => {
    it('should return actions for a site', () => {
      const actions = reopt.getActions(siteId);
      expect(actions).to.be.an('array');
      expect(actions.length).to.be.at.least(2);
    });

    it('should filter by pipeline run ID', () => {
      const actions = reopt.getActions(siteId, { pipelineRunId: stalledRunId });
      expect(actions).to.be.an('array');
      const allMatch = actions.every(a => a.pipeline_run_id === stalledRunId);
      expect(allMatch).to.be.true;
    });

    it('should return empty for unknown site', () => {
      const actions = reopt.getActions(99999);
      expect(actions).to.have.length(0);
    });
  });

  // ==================== _logAction ====================

  describe('_logAction', () => {
    it('should insert an action record', () => {
      const snap = { pipeline_run_id: stalledRunId, keyword: 'test', article_url: 'https://test.com', status: 'stalled' };
      const strategy = { name: 'test_strategy', reason: 'testing' };
      const id = reopt._logAction(siteId, snap, strategy, [{ step: 'test', success: true }], true);
      expect(id).to.be.a('number');

      const row = db.prepare('SELECT * FROM reoptimization_actions WHERE id = ?').get(id);
      expect(row.strategy).to.equal('test_strategy');
      expect(row.success).to.equal(1);
    });
  });

  // ==================== Database schema ====================

  describe('reoptimization_actions table', () => {
    it('should exist in the database', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables.map(t => t.name)).to.include('reoptimization_actions');
    });

    it('should have the expected columns', () => {
      const columns = db.prepare('PRAGMA table_info(reoptimization_actions)').all();
      const colNames = columns.map(c => c.name);
      expect(colNames).to.include('pipeline_run_id');
      expect(colNames).to.include('trigger_status');
      expect(colNames).to.include('strategy');
      expect(colNames).to.include('steps');
      expect(colNames).to.include('success');
    });
  });
});
