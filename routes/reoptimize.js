const express = require('express');
const router = express.Router();
const autoReoptimize = require('../services/auto-reoptimize');

/**
 * POST /api/reoptimize/sweep
 *
 * Run a full reoptimization sweep for a site.
 * Checks all underperforming articles and takes corrective action.
 */
router.post('/sweep', async (req, res, next) => {
  try {
    const { site_id } = req.body;
    if (!site_id) return res.status(400).json({ error: 'site_id is required' });

    const result = await autoReoptimize.sweep(site_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/reoptimize/:run_id
 *
 * Reoptimize a single article by pipeline run ID.
 */
router.post('/:run_id', async (req, res, next) => {
  try {
    const result = await autoReoptimize.reoptimizeOne(parseInt(req.params.run_id, 10));
    if (!result) {
      return res.json({ message: 'No action needed for this article' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/reoptimize/actions
 *
 * Get reoptimization action history for a site.
 */
router.get('/actions', (req, res) => {
  const { site_id, pipeline_run_id, limit } = req.query;
  if (!site_id) return res.status(400).json({ error: 'site_id query param is required' });

  const actions = autoReoptimize.getActions(
    parseInt(site_id, 10),
    {
      pipelineRunId: pipeline_run_id ? parseInt(pipeline_run_id, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    }
  );

  res.json({ actions });
});

module.exports = router;
