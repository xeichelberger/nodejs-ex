const { expect } = require('chai');
const sinon = require('sinon');

describe('Publish Pipeline', () => {
  let pipeline, contentGenerator, shopify, gsc, db;

  before(() => {
    process.env.DB_PATH = ':memory:';
    process.env.SHOPIFY_STORE_DOMAIN = 'test-store.myshopify.com';
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token';

    // Clear cached modules so DB reinitializes
    delete require.cache[require.resolve('../database')];
    delete require.cache[require.resolve('../services/publish-pipeline')];
    delete require.cache[require.resolve('../services/content-generator')];
    delete require.cache[require.resolve('../services/shopify')];
    delete require.cache[require.resolve('../services/google-search-console')];

    db = require('../database').getDb();
    pipeline = require('../services/publish-pipeline');
    contentGenerator = require('../services/content-generator');
    shopify = require('../services/shopify');
    gsc = require('../services/google-search-console');
  });

  afterEach(() => {
    sinon.restore();
  });

  after(() => {
    require('../database').close();
  });

  // ==================== Unit tests for internal helpers ====================

  describe('_buildKeywordSet', () => {
    it('should extract meaningful keywords from text', () => {
      const words = pipeline._buildKeywordSet('Best Baby Clothes for Winter', null, null);
      expect(words).to.be.a('Set');
      expect(words.has('baby')).to.be.true;
      expect(words.has('clothes')).to.be.true;
      expect(words.has('winter')).to.be.true;
      expect(words.has('best')).to.be.true;
      // Stop words should be filtered
      expect(words.has('for')).to.be.false;
    });

    it('should include tags and target keywords', () => {
      const words = pipeline._buildKeywordSet(
        'Baby Clothes',
        ['organic', 'cotton'],
        ['baby clothing', 'newborn outfits']
      );
      expect(words.has('organic')).to.be.true;
      expect(words.has('cotton')).to.be.true;
      expect(words.has('newborn')).to.be.true;
      expect(words.has('outfits')).to.be.true;
    });

    it('should handle string tags (comma-separated from Shopify)', () => {
      const words = pipeline._buildKeywordSet('Test', 'organic, cotton, baby', []);
      expect(words.has('organic')).to.be.true;
      expect(words.has('cotton')).to.be.true;
    });

    it('should handle null/undefined inputs', () => {
      const words = pipeline._buildKeywordSet(null, null, null);
      expect(words).to.be.a('Set');
      expect(words.size).to.equal(0);
    });
  });

  describe('_insertLinkIntoHtml', () => {
    it('should insert a link before the last H2', () => {
      const html = '<h2>Introduction</h2><p>Some text.</p><h2>Conclusion</h2><p>Final words.</p>';
      const result = pipeline._insertLinkIntoHtml(html, '/blogs/news/new-post', 'New Post', 'baby clothes');

      expect(result.changed).to.be.true;
      expect(result.anchorText).to.equal('baby clothes');
      expect(result.html).to.include('<a href="/blogs/news/new-post">baby clothes</a>');
      // The link should appear before the Conclusion heading
      const linkIndex = result.html.indexOf('baby clothes</a>');
      const conclusionIndex = result.html.lastIndexOf('Conclusion');
      expect(linkIndex).to.be.lessThan(conclusionIndex);
    });

    it('should append at end when no H2 exists', () => {
      const html = '<p>Just a paragraph.</p>';
      const result = pipeline._insertLinkIntoHtml(html, '/blogs/news/test', 'Test', 'keyword');

      expect(result.changed).to.be.true;
      expect(result.html).to.include('<a href="/blogs/news/test">keyword</a>');
    });

    it('should return unchanged for empty HTML', () => {
      const result = pipeline._insertLinkIntoHtml('', '/test', 'Test', 'kw');
      expect(result.changed).to.be.false;
    });

    it('should use keyword as anchor text, falling back to title', () => {
      const result = pipeline._insertLinkIntoHtml('<p>Text</p>', '/test', 'My Title', null);
      expect(result.anchorText).to.equal('My Title');
    });
  });

  describe('_guessPageType', () => {
    it('should detect product URLs', () => {
      expect(pipeline._guessPageType('/products/baby-romper')).to.equal('product');
    });

    it('should detect collection URLs', () => {
      expect(pipeline._guessPageType('/collections/winter-sale')).to.equal('collection');
    });

    it('should detect blog URLs', () => {
      expect(pipeline._guessPageType('/blogs/news/articles/my-post')).to.equal('blog_post');
    });

    it('should default to page', () => {
      expect(pipeline._guessPageType('/about-us')).to.equal('page');
    });
  });

  describe('_resolveInternalLinks', () => {
    it('should replace placeholders with real links', async () => {
      // Stub Shopify calls to return some pages
      sinon.stub(shopify, 'getProducts').resolves([
        { handle: 'organic-romper', title: 'Organic Baby Romper', tags: 'organic, baby' },
      ]);
      sinon.stub(shopify, 'getPages').resolves([
        { handle: 'about', title: 'About Us' },
      ]);
      sinon.stub(shopify, 'getBlogs').resolves([]);

      const html = '<p>Check out our [INTERNAL LINK: organic rompers -> product page] today.</p>';
      const result = await pipeline._resolveInternalLinks(html, null);

      expect(result.totalPlaceholders).to.equal(1);
      expect(result.links).to.have.length(1);
      expect(result.html).to.include('<a href="/products/organic-romper">organic rompers</a>');
      expect(result.html).not.to.include('[INTERNAL LINK');
    });

    it('should remove marker but keep text when no match found', async () => {
      sinon.stub(shopify, 'getProducts').resolves([]);
      sinon.stub(shopify, 'getPages').resolves([]);
      sinon.stub(shopify, 'getBlogs').resolves([]);

      const html = '<p>See our [INTERNAL LINK: winter gear -> collection page] selection.</p>';
      const result = await pipeline._resolveInternalLinks(html, null);

      expect(result.totalPlaceholders).to.equal(1);
      expect(result.links).to.have.length(0);
      expect(result.html).to.include('winter gear');
      expect(result.html).not.to.include('[INTERNAL LINK');
    });

    it('should return unchanged HTML when no placeholders exist', async () => {
      const html = '<p>No links here.</p>';
      const result = await pipeline._resolveInternalLinks(html, null);

      expect(result.totalPlaceholders).to.equal(0);
      expect(result.html).to.equal(html);
    });
  });

  describe('_trackKeyword', () => {
    let siteId;

    before(() => {
      const result = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://pipeline-test.com', 'Pipeline Test');
      siteId = result.lastInsertRowid;
    });

    it('should insert a new keyword', () => {
      pipeline._trackKeyword(siteId, 'baby clothes', '/blogs/news/baby-clothes');
      const kw = db.prepare('SELECT * FROM keywords WHERE site_id = ? AND keyword = ?').get(siteId, 'baby clothes');
      expect(kw).to.not.be.null;
      expect(kw.url).to.equal('/blogs/news/baby-clothes');
    });

    it('should not duplicate an existing keyword', () => {
      pipeline._trackKeyword(siteId, 'baby clothes', '/blogs/news/baby-clothes-2');
      const kws = db.prepare('SELECT * FROM keywords WHERE site_id = ? AND keyword = ?').all(siteId, 'baby clothes');
      expect(kws).to.have.length(1);
    });
  });

  describe('_logRun', () => {
    it('should insert a pipeline run record', () => {
      const runId = pipeline._logRun(null, {
        keyword: 'test keyword',
        topic: 'test topic',
        blogId: null,
        contentId: null,
        articleId: null,
        articleUrl: null,
        steps: [{ step: 'generate', title: 'Test' }],
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
      });

      expect(runId).to.be.a('number');

      const run = db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(runId);
      expect(run).to.not.be.null;
      expect(run.keyword).to.equal('test keyword');
      expect(run.status).to.equal('completed');
    });
  });

  // ==================== Integration: dry-run (no Shopify needed) ====================

  describe('run() dry-run mode', () => {
    it('should generate content without publishing', async () => {
      sinon.stub(contentGenerator, 'isConfigured').returns(true);
      sinon.stub(contentGenerator, 'generateBlogPost').resolves({
        title: 'Test Blog Post',
        meta_description: 'A test post about baby clothes.',
        slug: 'test-blog-post',
        body_html: '<h1>Test</h1><p>Content here.</p>',
        tags: ['baby', 'clothes'],
        target_keywords: ['baby clothes', 'organic baby'],
        internal_link_suggestions: [],
      });
      sinon.stub(contentGenerator, 'saveContent').returns(1);

      const result = await pipeline.run({
        keyword: 'baby clothes',
        topic: 'Best organic baby clothes for newborns',
        publish: false,
        interlink: false,
        submitToGoogle: false,
        trackKeyword: false,
      });

      expect(result.generated.title).to.equal('Test Blog Post');
      expect(result.article).to.be.null;
      expect(result.google_submitted).to.be.false;
      expect(result.steps).to.be.an('array');
      expect(result.steps.some(s => s.step === 'generate')).to.be.true;
      expect(result.steps.some(s => s.step === 'publish')).to.be.false;
    });

    it('should throw when keyword or topic is missing', async () => {
      try {
        await pipeline.run({ keyword: '', topic: '' });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err.message).to.include('keyword and topic are required');
      }
    });
  });

  // ==================== Database schema ====================

  describe('pipeline_runs table', () => {
    it('should exist in the database', () => {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      const tableNames = tables.map(t => t.name);
      expect(tableNames).to.include('pipeline_runs');
    });

    it('should have the expected columns', () => {
      const columns = db.prepare('PRAGMA table_info(pipeline_runs)').all();
      const colNames = columns.map(c => c.name);
      expect(colNames).to.include('site_id');
      expect(colNames).to.include('keyword');
      expect(colNames).to.include('article_url');
      expect(colNames).to.include('steps');
      expect(colNames).to.include('status');
    });
  });
});
