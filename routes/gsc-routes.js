const express = require('express');
const router = express.Router();
const gsc = require('../services/google-search-console');

// Check GSC connection status
router.get('/status', (req, res) => {
  res.json({ configured: gsc.isConfigured() });
});

// Get search analytics (top queries + pages)
router.get('/analytics', async (req, res, next) => {
  try {
    const { start_date, end_date, dimensions, limit } = req.query;

    const data = await gsc.getSearchAnalytics({
      startDate: start_date,
      endDate: end_date,
      dimensions: dimensions ? dimensions.split(',') : ['query', 'page'],
      rowLimit: parseInt(limit || '100', 10),
    });

    res.json({ data, count: data.length });
  } catch (err) {
    next(err);
  }
});

// Get top queries
router.get('/top-queries', async (req, res, next) => {
  try {
    const data = await gsc.getTopQueries(req.query);
    res.json({ queries: data });
  } catch (err) {
    next(err);
  }
});

// Get top pages
router.get('/top-pages', async (req, res, next) => {
  try {
    const data = await gsc.getTopPages(req.query);
    res.json({ pages: data });
  } catch (err) {
    next(err);
  }
});

// Get queries for a specific page
router.get('/page-queries', async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url query param is required' });

    const data = await gsc.getQueriesForPage(url);
    res.json({ queries: data });
  } catch (err) {
    next(err);
  }
});

// Find low CTR opportunities
router.get('/low-ctr', async (req, res, next) => {
  try {
    const data = await gsc.findLowCTRPages();
    res.json({ opportunities: data, count: data.length });
  } catch (err) {
    next(err);
  }
});

// Find striking distance keywords (positions 8-20)
router.get('/striking-distance', async (req, res, next) => {
  try {
    const data = await gsc.findStrikingDistanceKeywords();
    res.json({ keywords: data, count: data.length });
  } catch (err) {
    next(err);
  }
});

// Sync GSC data to local database
router.post('/sync', async (req, res, next) => {
  try {
    const { site_id } = req.body;
    if (!site_id) return res.status(400).json({ error: 'site_id is required' });

    const result = await gsc.syncToDatabase(site_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get sitemaps
router.get('/sitemaps', async (req, res, next) => {
  try {
    const sitemaps = await gsc.getSitemaps();
    res.json({ sitemaps });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
