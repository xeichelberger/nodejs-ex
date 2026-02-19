const { expect } = require('chai');

describe('Database', () => {
  let db;

  before(() => {
    // Use in-memory database for tests
    process.env.DB_PATH = ':memory:';
    // Clear cached module
    delete require.cache[require.resolve('../database')];
    db = require('../database').getDb();
  });

  after(() => {
    require('../database').close();
  });

  it('should create all required tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
    const tableNames = tables.map(t => t.name);

    expect(tableNames).to.include('sites');
    expect(tableNames).to.include('page_audits');
    expect(tableNames).to.include('keywords');
    expect(tableNames).to.include('keyword_history');
    expect(tableNames).to.include('content');
    expect(tableNames).to.include('link_suggestions');
    expect(tableNames).to.include('gsc_data');
    expect(tableNames).to.include('geo_optimizations');
    expect(tableNames).to.include('job_runs');
    expect(tableNames).to.include('pipeline_runs');
    expect(tableNames).to.include('content_performance');
  });

  it('should insert and retrieve a site', () => {
    const stmt = db.prepare('INSERT INTO sites (url, name, platform) VALUES (?, ?, ?)');
    const result = stmt.run('https://test.com', 'Test Site', 'shopify');

    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(result.lastInsertRowid);
    expect(site).to.not.be.null;
    expect(site.url).to.equal('https://test.com');
    expect(site.name).to.equal('Test Site');
    expect(site.platform).to.equal('shopify');
  });

  it('should enforce unique site URLs', () => {
    const stmt = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)');
    stmt.run('https://unique-test.com', 'Site 1');

    expect(() => {
      stmt.run('https://unique-test.com', 'Site 2');
    }).to.throw(/UNIQUE/);
  });

  it('should insert and retrieve page audits', () => {
    const siteStmt = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)');
    const siteResult = siteStmt.run('https://audit-test.com', 'Audit Test');

    const auditStmt = db.prepare(`
      INSERT INTO page_audits (site_id, url, title, score, issues)
      VALUES (?, ?, ?, ?, ?)
    `);
    auditStmt.run(siteResult.lastInsertRowid, 'https://audit-test.com/', 'Home Page', 85, '[]');

    const audits = db.prepare('SELECT * FROM page_audits WHERE site_id = ?')
      .all(siteResult.lastInsertRowid);

    expect(audits).to.have.length(1);
    expect(audits[0].title).to.equal('Home Page');
    expect(audits[0].score).to.equal(85);
  });

  it('should insert and retrieve keywords', () => {
    const site = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://kw-test.com', 'KW Test');

    const kwStmt = db.prepare('INSERT INTO keywords (site_id, keyword) VALUES (?, ?)');
    kwStmt.run(site.lastInsertRowid, 'test keyword');

    const kws = db.prepare('SELECT * FROM keywords WHERE site_id = ?').all(site.lastInsertRowid);
    expect(kws).to.have.length(1);
    expect(kws[0].keyword).to.equal('test keyword');
  });

  it('should insert and retrieve content', () => {
    const site = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://content-test.com', 'Content Test');

    const contentStmt = db.prepare(`
      INSERT INTO content (site_id, type, title, body, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    contentStmt.run(site.lastInsertRowid, 'blog_post', 'Test Post', '<p>Content</p>', 'draft');

    const content = db.prepare('SELECT * FROM content WHERE site_id = ?').all(site.lastInsertRowid);
    expect(content).to.have.length(1);
    expect(content[0].type).to.equal('blog_post');
    expect(content[0].status).to.equal('draft');
  });
});
