const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const brandVoice = require('../services/brand-voice');

// List all tracked sites
router.get('/', (req, res) => {
  const db = getDb();
  const sites = db.prepare('SELECT * FROM sites ORDER BY created_at DESC').all();
  res.json({ sites });
});

// Add a new site to track
router.post('/', (req, res) => {
  const { url, name, platform } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const db = getDb();
  try {
    const stmt = db.prepare('INSERT INTO sites (url, name, platform) VALUES (?, ?, ?)');
    const result = stmt.run(url, name || url, platform || 'shopify');
    const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ site });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Site already exists' });
    }
    throw err;
  }
});

// Get a specific site
router.get('/:id', (req, res) => {
  const db = getDb();
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });
  res.json({ site });
});

// Delete a site
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM sites WHERE id = ?').run(req.params.id);
  res.json({ deleted: true });
});

// ==================== Brand Voice ====================

// Get brand voice for a site
router.get('/:id/voice', (req, res) => {
  const voice = brandVoice.get(parseInt(req.params.id, 10));
  if (!voice) return res.json({ voice: null, message: 'No brand voice configured for this site. Content will use generic professional tone.' });
  res.json({ voice });
});

// Set or update brand voice for a site
router.put('/:id/voice', (req, res) => {
  const { voice_document, brand_name, summary } = req.body;

  if (!voice_document) {
    return res.status(400).json({ error: 'voice_document is required. Paste your full brand voice guide.' });
  }

  const db = getDb();
  const site = db.prepare('SELECT * FROM sites WHERE id = ?').get(req.params.id);
  if (!site) return res.status(404).json({ error: 'Site not found' });

  const voice = brandVoice.set(parseInt(req.params.id, 10), {
    voiceDocument: voice_document,
    brandName: brand_name,
    summary,
  });

  res.json({
    voice,
    message: 'Brand voice saved. All content generation for this site will now automatically use this voice.',
  });
});

// Delete brand voice for a site
router.delete('/:id/voice', (req, res) => {
  brandVoice.delete(parseInt(req.params.id, 10));
  res.json({ deleted: true, message: 'Brand voice removed. Content will use generic professional tone.' });
});

module.exports = router;
