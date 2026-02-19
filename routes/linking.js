const express = require('express');
const router = express.Router();
const internalLinking = require('../services/internal-linking');
const { getDb } = require('../database');

// Analyze internal link structure
router.post('/analyze', async (req, res, next) => {
  try {
    const { site_url, site_id } = req.body;
    if (!site_url) return res.status(400).json({ error: 'site_url is required' });

    const analysis = await internalLinking.analyzeStructure(site_url, site_id);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

// Get link suggestions for a site
router.post('/suggestions', async (req, res, next) => {
  try {
    const { site_id } = req.body;
    if (!site_id) return res.status(400).json({ error: 'site_id is required' });

    const result = await internalLinking.suggestLinks(site_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get under-linked pages
router.get('/underlinked/:site_id', (req, res, next) => {
  try {
    const result = internalLinking.findUnderlinkedPages(req.params.site_id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Analyze anchor text distribution
router.post('/anchor-text', async (req, res, next) => {
  try {
    const { site_url } = req.body;
    if (!site_url) return res.status(400).json({ error: 'site_url is required' });

    const result = await internalLinking.analyzeAnchorText(site_url);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get saved link suggestions
router.get('/suggestions/:site_id', (req, res) => {
  const db = getDb();
  const { status } = req.query;

  let query = 'SELECT * FROM link_suggestions WHERE site_id = ?';
  const params = [req.params.site_id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY relevance_score DESC LIMIT 50';
  const suggestions = db.prepare(query).all(...params);
  res.json({ suggestions });
});

// Update link suggestion status
router.patch('/suggestions/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'applied', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = getDb();
  db.prepare('UPDATE link_suggestions SET status = ? WHERE id = ?')
    .run(status, req.params.id);
  res.json({ updated: true });
});

module.exports = router;
