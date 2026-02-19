const express = require('express');
const router = express.Router();
const geoOptimizer = require('../services/geo-optimizer');

// Run a full GEO audit for a brand
router.post('/audit', async (req, res, next) => {
  try {
    const { brand_name, site_url, site_id, products, niche } = req.body;

    if (!brand_name || !site_url) {
      return res.status(400).json({ error: 'brand_name and site_url are required' });
    }

    const result = await geoOptimizer.auditBrand({
      brandName: brand_name,
      siteUrl: site_url,
      siteId: site_id,
      products: products || [],
      niche: niche || '',
    });

    res.json({ audit: result });
  } catch (err) {
    next(err);
  }
});

// Generate GEO-optimized content
router.post('/content', async (req, res, next) => {
  try {
    const { brand_name, topic, keyword, content_type, niche, site_id } = req.body;

    if (!brand_name || !topic) {
      return res.status(400).json({ error: 'brand_name and topic are required' });
    }

    const result = await geoOptimizer.generateGEOContent({
      brandName: brand_name,
      topic,
      keyword: keyword || topic,
      contentType: content_type,
      niche: niche || '',
      siteId: site_id,
    });

    res.json({ content: result });
  } catch (err) {
    next(err);
  }
});

// Optimize brand entity
router.post('/brand-entity', async (req, res, next) => {
  try {
    const { brand_name, site_url, niche, founders, year_founded, unique_selling_points } = req.body;

    if (!brand_name) {
      return res.status(400).json({ error: 'brand_name is required' });
    }

    const result = await geoOptimizer.optimizeBrandEntity({
      brandName: brand_name,
      siteUrl: site_url,
      niche: niche || '',
      founders,
      yearFounded: year_founded,
      uniqueSellingPoints: unique_selling_points,
    });

    res.json({ optimization: result });
  } catch (err) {
    next(err);
  }
});

// Get past GEO optimizations
router.get('/:site_id', (req, res) => {
  const { getDb } = require('../database');
  const db = getDb();

  const optimizations = db.prepare(`
    SELECT * FROM geo_optimizations
    WHERE site_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.params.site_id);

  // Parse JSON fields
  optimizations.forEach(o => {
    try { o.target_queries = JSON.parse(o.target_queries); } catch { /* keep raw */ }
    try { o.current_citations = JSON.parse(o.current_citations); } catch { /* keep raw */ }
    try { o.recommendations = JSON.parse(o.recommendations); } catch { /* keep raw */ }
    try { o.content_gaps = JSON.parse(o.content_gaps); } catch { /* keep raw */ }
    try { o.authority_signals = JSON.parse(o.authority_signals); } catch { /* keep raw */ }
  });

  res.json({ optimizations });
});

module.exports = router;
