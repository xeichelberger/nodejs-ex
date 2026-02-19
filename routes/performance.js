const express = require('express');
const router = express.Router();
const contentPerformance = require('../services/content-performance');

/**
 * POST /api/performance/check
 *
 * Trigger a performance check for all published pipeline content for a site.
 * Queries GSC, compares to previous snapshots, saves new snapshot.
 */
router.post('/check', async (req, res, next) => {
  try {
    const { site_id } = req.body;
    if (!site_id) return res.status(400).json({ error: 'site_id is required' });

    const result = await contentPerformance.checkAll(site_id);
    res.json({ performance: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/performance/check/:run_id
 *
 * Trigger a performance check for a single pipeline run.
 */
router.post('/check/:run_id', async (req, res, next) => {
  try {
    const snapshot = await contentPerformance.checkRun(parseInt(req.params.run_id, 10));
    res.json({ snapshot });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/performance/overview
 *
 * Dashboard view: all published content grouped by status.
 * Shows what's performing, what's climbing, and what needs attention.
 */
router.get('/overview', (req, res) => {
  const { site_id } = req.query;
  if (!site_id) return res.status(400).json({ error: 'site_id query param is required' });

  const overview = contentPerformance.getOverview(parseInt(site_id, 10));
  res.json({ overview });
});

/**
 * GET /api/performance/attention
 *
 * Articles that need attention: stalled, declining, or not indexed.
 * Each item includes a specific recommendation.
 */
router.get('/attention', (req, res) => {
  const { site_id } = req.query;
  if (!site_id) return res.status(400).json({ error: 'site_id query param is required' });

  const items = contentPerformance.getNeedingAttention(parseInt(site_id, 10));
  res.json({ needs_attention: items });
});

/**
 * GET /api/performance/history/:run_id
 *
 * Position history for a single published article over time.
 * Shows how the keyword ranking changed since publish.
 */
router.get('/history/:run_id', (req, res) => {
  const history = contentPerformance.getHistory(parseInt(req.params.run_id, 10));
  res.json({ history });
});

module.exports = router;
