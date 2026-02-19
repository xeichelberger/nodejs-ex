const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

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

module.exports = router;
