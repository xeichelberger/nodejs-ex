const express = require('express');
const router = express.Router();
const seoAnalyzer = require('../services/seo-analyzer');
const { getDb } = require('../database');

// Analyze a single page
router.post('/page', async (req, res, next) => {
  try {
    const { url, site_id } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await seoAnalyzer.analyzePage(url, site_id);
    res.json({ analysis: result });
  } catch (err) {
    next(err);
  }
});

// Full site audit
router.post('/site', async (req, res, next) => {
  try {
    const { site_id, max_pages } = req.body;

    const db = getDb();
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(site_id);
    if (!site) return res.status(404).json({ error: 'Site not found' });

    const result = await seoAnalyzer.auditSite(site.url, site_id, max_pages);
    res.json({ audit: result });
  } catch (err) {
    next(err);
  }
});

// Parse sitemap
router.post('/sitemap', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const urls = await seoAnalyzer.parseSitemap(url);
    res.json({ urls, count: urls.length });
  } catch (err) {
    next(err);
  }
});

// Check robots.txt
router.post('/robots', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await seoAnalyzer.checkRobotsTxt(url);
    // Remove function from response
    const { isAllowed, ...rest } = result;
    res.json(rest);
  } catch (err) {
    next(err);
  }
});

// Get past audit results for a site
router.get('/audits/:site_id', (req, res) => {
  const db = getDb();
  const audits = db.prepare(`
    SELECT * FROM page_audits
    WHERE site_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(req.params.site_id);

  // Parse issues JSON
  audits.forEach(a => {
    try { a.issues = JSON.parse(a.issues); } catch { a.issues = []; }
  });

  res.json({ audits });
});

// Get audit summary for a site
router.get('/summary/:site_id', (req, res) => {
  const db = getDb();

  const latest = db.prepare(`
    SELECT * FROM page_audits
    WHERE site_id = ?
    ORDER BY created_at DESC
    LIMIT 100
  `).all(req.params.site_id);

  if (latest.length === 0) {
    return res.json({ summary: null, message: 'No audits found. Run a site audit first.' });
  }

  const summary = {
    total_pages: latest.length,
    average_score: Math.round(latest.reduce((s, a) => s + a.score, 0) / latest.length),
    critical_issues: 0,
    warning_issues: 0,
    top_issues: {},
  };

  for (const audit of latest) {
    let issues;
    try { issues = JSON.parse(audit.issues); } catch { issues = []; }
    for (const issue of issues) {
      if (issue.severity === 'critical') summary.critical_issues++;
      if (issue.severity === 'warning') summary.warning_issues++;
      const cat = issue.category || 'other';
      summary.top_issues[cat] = (summary.top_issues[cat] || 0) + 1;
    }
  }

  res.json({ summary });
});

module.exports = router;
