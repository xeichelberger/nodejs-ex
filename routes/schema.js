const express = require('express');
const router = express.Router();
const schemaGenerator = require('../services/schema-generator');

// Recommend schemas for a page
router.post('/recommend', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await schemaGenerator.recommendSchemas(url);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Generate Product schema
router.post('/product', (req, res) => {
  const { name, description, image_url, price, currency, availability, brand, sku, url, rating, review_count } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const schema = schemaGenerator.generateProductSchema({
    name, description, imageUrl: image_url, price, currency, availability,
    brand, sku, url, rating, reviewCount: review_count,
  });

  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Generate FAQ schema
router.post('/faq', (req, res) => {
  const { faqs } = req.body;
  if (!faqs || !Array.isArray(faqs)) return res.status(400).json({ error: 'faqs array is required: [{question, answer}]' });

  const schema = schemaGenerator.generateFAQSchema(faqs);
  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Generate Article schema
router.post('/article', (req, res) => {
  const { title, description, image_url, author_name, publish_date, modified_date, url, publisher_name, publisher_logo } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const schema = schemaGenerator.generateArticleSchema({
    title, description, imageUrl: image_url, authorName: author_name,
    publishDate: publish_date, modifiedDate: modified_date, url,
    publisherName: publisher_name, publisherLogo: publisher_logo,
  });

  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Generate Organization schema
router.post('/organization', (req, res) => {
  const { name, url, logo, description, social_profiles, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const schema = schemaGenerator.generateOrganizationSchema({
    name, url, logo, description, socialProfiles: social_profiles, phone, email, address,
  });

  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Generate Breadcrumb schema
router.post('/breadcrumb', (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) return res.status(400).json({ error: 'items array is required: [{name, url}]' });

  const schema = schemaGenerator.generateBreadcrumbSchema(items);
  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Generate HowTo schema
router.post('/howto', (req, res) => {
  const { name, description, total_time, steps, image_url } = req.body;
  if (!name || !steps) return res.status(400).json({ error: 'name and steps are required' });

  const schema = schemaGenerator.generateHowToSchema({
    name, description, totalTime: total_time, steps, imageUrl: image_url,
  });

  res.json({ schema, script_tag: `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>` });
});

// Generate all recommended schemas for a page
router.post('/generate-all', async (req, res, next) => {
  try {
    const { url, brand_name, site_url, logo_url, description, social_profiles } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await schemaGenerator.generateAllForPage(url, {
      brandName: brand_name, siteUrl: site_url, logoUrl: logo_url,
      description, socialProfiles: social_profiles,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
