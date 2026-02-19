const express = require('express');
const router = express.Router();
const reviewSEO = require('../services/review-seo');

// Audit review SEO across all products
router.get('/audit', async (req, res, next) => {
  try {
    const result = await reviewSEO.auditReviewSEO();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Generate Product schema with review data
router.post('/schema', (req, res) => {
  const { product_name, product_url, image_url, price, currency, brand, rating, review_count } = req.body;
  if (!product_name) return res.status(400).json({ error: 'product_name is required' });

  const schema = reviewSEO.generateProductReviewSchema({
    productName: product_name,
    productUrl: product_url,
    imageUrl: image_url,
    price,
    currency,
    brand,
    rating,
    reviewCount: review_count,
  });

  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Get review collection strategy based on audit
router.post('/strategy', async (req, res, next) => {
  try {
    const audit = await reviewSEO.auditReviewSEO();
    const strategies = reviewSEO.getReviewStrategy(audit);
    res.json({ audit_summary: audit.summary, strategies });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
