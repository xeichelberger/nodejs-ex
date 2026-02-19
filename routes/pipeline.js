const express = require('express');
const router = express.Router();
const pipeline = require('../services/publish-pipeline');
const { getDb } = require('../database');

/**
 * POST /api/pipeline/publish
 *
 * Full pipeline: generate content -> publish to Shopify -> interlink -> submit to Google.
 * One API call does everything.
 */
router.post('/publish', async (req, res, next) => {
  try {
    const {
      keyword,
      topic,
      site_id,
      blog_id,
      word_count,
      tone,
      additional_context,
      image_url,
      // Options (all default true)
      publish = true,
      interlink = true,
      submit_to_google = true,
      track_keyword = true,
    } = req.body;

    if (!keyword || !topic) {
      return res.status(400).json({ error: 'keyword and topic are required' });
    }

    const result = await pipeline.run({
      keyword,
      topic,
      siteId: site_id,
      blogId: blog_id,
      wordCount: word_count,
      tone,
      additionalContext: additional_context,
      imageUrl: image_url,
      publish,
      interlink,
      submitToGoogle: submit_to_google,
      trackKeyword: track_keyword,
    });

    res.json({ pipeline: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pipeline/publish-existing
 *
 * Publish a previously generated content record (status = draft/approved)
 * through the rest of the pipeline: Shopify -> interlink -> Google.
 */
router.post('/publish-existing', async (req, res, next) => {
  try {
    const { content_id, blog_id, interlink = true, submit_to_google = true } = req.body;

    if (!content_id) {
      return res.status(400).json({ error: 'content_id is required' });
    }

    const result = await pipeline.publishExisting({
      contentId: content_id,
      blogId: blog_id,
      interlink,
      submitToGoogle: submit_to_google,
    });

    res.json({ pipeline: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pipeline/dry-run
 *
 * Generate content and resolve internal links without publishing.
 * Returns exactly what WOULD be published so you can review first.
 */
router.post('/dry-run', async (req, res, next) => {
  try {
    const { keyword, topic, site_id, word_count, tone, additional_context } = req.body;

    if (!keyword || !topic) {
      return res.status(400).json({ error: 'keyword and topic are required' });
    }

    const result = await pipeline.run({
      keyword,
      topic,
      siteId: site_id,
      wordCount: word_count,
      tone,
      additionalContext: additional_context,
      publish: false,
      interlink: false,
      submitToGoogle: false,
      trackKeyword: false,
    });

    res.json({ dry_run: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/pipeline/runs
 *
 * List recent pipeline runs for a site.
 */
router.get('/runs', (req, res) => {
  const db = getDb();
  const { site_id, limit = 20 } = req.query;

  let query = 'SELECT * FROM pipeline_runs';
  const params = [];

  if (site_id) {
    query += ' WHERE site_id = ?';
    params.push(site_id);
  }

  query += ' ORDER BY started_at DESC LIMIT ?';
  params.push(parseInt(limit, 10));

  const runs = db.prepare(query).all(...params);

  // Parse the steps JSON for readability
  for (const run of runs) {
    try { run.steps = JSON.parse(run.steps); } catch { /* keep as string */ }
  }

  res.json({ runs });
});

/**
 * GET /api/pipeline/runs/:id
 *
 * Get details for a single pipeline run.
 */
router.get('/runs/:id', (req, res) => {
  const db = getDb();
  const run = db.prepare('SELECT * FROM pipeline_runs WHERE id = ?').get(req.params.id);

  if (!run) {
    return res.status(404).json({ error: 'Pipeline run not found' });
  }

  try { run.steps = JSON.parse(run.steps); } catch { /* keep as string */ }

  res.json({ run });
});

module.exports = router;
