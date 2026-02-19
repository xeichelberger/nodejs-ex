const express = require('express');
const router = express.Router();
const serpTracker = require('../services/serp-tracker');

// Get all keyword rankings for a site
router.get('/:site_id', (req, res) => {
  const { sort_by, limit } = req.query;
  const rankings = serpTracker.getRankings(req.params.site_id, {
    sortBy: sort_by,
    limit: parseInt(limit || '100', 10),
  });
  res.json({ keywords: rankings });
});

// Add keywords to track
router.post('/:site_id', (req, res) => {
  const { keywords } = req.body;
  if (!keywords || !Array.isArray(keywords)) {
    return res.status(400).json({ error: 'keywords array is required' });
  }

  const result = serpTracker.addKeywords(req.params.site_id, keywords);
  res.json(result);
});

// Update keyword positions from GSC data
router.post('/:site_id/update', (req, res) => {
  const result = serpTracker.updatePositions(req.params.site_id);
  res.json(result);
});

// Get keyword history
router.get('/:site_id/history/:keyword', (req, res) => {
  const history = serpTracker.getKeywordHistory(req.params.site_id, req.params.keyword);
  res.json(history);
});

// Get ranking alerts
router.get('/:site_id/alerts', (req, res) => {
  const threshold = parseInt(req.query.threshold || '5', 10);
  const alerts = serpTracker.getAlerts(req.params.site_id, threshold);
  res.json({ alerts });
});

// Get ranking distribution
router.get('/:site_id/distribution', (req, res) => {
  const distribution = serpTracker.getDistribution(req.params.site_id);
  res.json({ distribution });
});

// Get keyword opportunities
router.get('/:site_id/opportunities', (req, res) => {
  const opportunities = serpTracker.getOpportunities(req.params.site_id);
  res.json(opportunities);
});

module.exports = router;
