const express = require('express');
const router = express.Router();
const shopify = require('../services/shopify');

// Check Shopify connection status
router.get('/status', (req, res) => {
  res.json({ configured: shopify.isConfigured() });
});

// Get products
router.get('/products', async (req, res, next) => {
  try {
    const products = await shopify.getProducts(req.query.limit);
    res.json({ products });
  } catch (err) {
    next(err);
  }
});

// Audit product SEO
router.get('/products/audit', async (req, res, next) => {
  try {
    const audit = await shopify.auditProductSEO();
    const summary = {
      total_products: audit.length,
      products_without_description: audit.filter(p => !p.has_description).length,
      total_images_without_alt: audit.reduce((s, p) => s + p.images_without_alt, 0),
      products_with_issues: audit.filter(p => p.seo_issues.length > 0).length,
    };
    res.json({ summary, products: audit });
  } catch (err) {
    next(err);
  }
});

// Update product SEO
router.put('/products/:id/seo', async (req, res, next) => {
  try {
    const { title_tag, body_html, meta_description, handle } = req.body;
    const product = await shopify.updateProductSEO(req.params.id, {
      title_tag,
      body_html,
      meta_description,
      handle,
    });
    res.json({ product });
  } catch (err) {
    next(err);
  }
});

// Get pages
router.get('/pages', async (req, res, next) => {
  try {
    const pages = await shopify.getPages();
    res.json({ pages });
  } catch (err) {
    next(err);
  }
});

// Create a new page
router.post('/pages', async (req, res, next) => {
  try {
    const { title, body_html, title_tag, description_tag } = req.body;
    const page = await shopify.createPage(title, body_html, { title_tag, description_tag });
    res.json({ page });
  } catch (err) {
    next(err);
  }
});

// Get blogs
router.get('/blogs', async (req, res, next) => {
  try {
    const blogs = await shopify.getBlogs();
    res.json({ blogs });
  } catch (err) {
    next(err);
  }
});

// Get articles for a blog
router.get('/blogs/:blog_id/articles', async (req, res, next) => {
  try {
    const articles = await shopify.getArticles(req.params.blog_id);
    res.json({ articles });
  } catch (err) {
    next(err);
  }
});

// Create blog article
router.post('/blogs/:blog_id/articles', async (req, res, next) => {
  try {
    const { title, body_html, tags, meta_description, image_url } = req.body;
    const article = await shopify.createArticle(req.params.blog_id, {
      title,
      body_html,
      tags,
      meta_description,
      image_url,
    });
    res.json({ article });
  } catch (err) {
    next(err);
  }
});

// Get redirects
router.get('/redirects', async (req, res, next) => {
  try {
    const redirects = await shopify.getRedirects();
    res.json({ redirects });
  } catch (err) {
    next(err);
  }
});

// Create redirect
router.post('/redirects', async (req, res, next) => {
  try {
    const { from, to } = req.body;
    const redirect = await shopify.createRedirect(from, to);
    res.json({ redirect });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
