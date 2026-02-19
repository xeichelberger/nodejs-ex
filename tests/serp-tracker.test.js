const { expect } = require('chai');

describe('SERP Tracker', () => {
  let serpTracker;
  let db;
  let siteId;

  before(() => {
    process.env.DB_PATH = ':memory:';
    delete require.cache[require.resolve('../database')];
    delete require.cache[require.resolve('../services/serp-tracker')];

    db = require('../database').getDb();
    serpTracker = require('../services/serp-tracker');

    // Create a test site
    const result = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://serp-test.com', 'SERP Test');
    siteId = result.lastInsertRowid;
  });

  after(() => {
    require('../database').close();
  });

  it('should add keywords to track', () => {
    const result = serpTracker.addKeywords(siteId, ['seo tools', 'ecommerce seo', 'shopify seo']);
    expect(result).to.have.property('added', 3);

    const kws = db.prepare('SELECT * FROM keywords WHERE site_id = ?').all(siteId);
    expect(kws).to.have.length(3);
  });

  it('should not duplicate keywords', () => {
    serpTracker.addKeywords(siteId, ['seo tools', 'new keyword']);

    const kws = db.prepare('SELECT * FROM keywords WHERE site_id = ?').all(siteId);
    expect(kws).to.have.length(4); // 3 original + 1 new
  });

  it('should get rankings', () => {
    const rankings = serpTracker.getRankings(siteId);
    expect(rankings).to.be.an('array');
    expect(rankings).to.have.length(4);
    expect(rankings[0]).to.have.property('keyword');
    expect(rankings[0]).to.have.property('trend');
  });

  it('should get ranking distribution', () => {
    // Set positions on some keywords so distribution can count them
    const kws = db.prepare('SELECT * FROM keywords WHERE site_id = ?').all(siteId);
    db.prepare('UPDATE keywords SET current_position = 3 WHERE id = ?').run(kws[0].id);
    db.prepare('UPDATE keywords SET current_position = 12 WHERE id = ?').run(kws[1].id);

    const dist = serpTracker.getDistribution(siteId);
    expect(dist).to.have.property('total', 2); // only 2 have positions
    expect(dist).to.have.property('top_3');
    expect(dist).to.have.property('top_10');
    expect(dist).to.have.property('page_1');
    expect(dist).to.have.property('page_2');
  });

  it('should get opportunities', () => {
    const opps = serpTracker.getOpportunities(siteId);
    expect(opps).to.have.property('striking_distance').that.is.an('array');
    expect(opps).to.have.property('improving_keywords').that.is.an('array');
  });

  it('should get alerts with threshold', () => {
    // Manually set some positions to create alerts
    const kws = db.prepare('SELECT * FROM keywords WHERE site_id = ?').all(siteId);
    if (kws.length > 0) {
      db.prepare('UPDATE keywords SET current_position = 5, previous_position = 15 WHERE id = ?')
        .run(kws[0].id);
    }

    const alerts = serpTracker.getAlerts(siteId, 5);
    expect(alerts).to.be.an('array');
    expect(alerts.length).to.be.greaterThan(0);
    expect(alerts[0]).to.have.property('type', 'improved');
    expect(alerts[0]).to.have.property('change', 10);
  });
});
