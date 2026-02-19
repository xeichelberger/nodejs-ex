const express = require('express');
const router = express.Router();
const contentGenerator = require('../services/content-generator');
const { getDb } = require('../database');

// Generate a blog post
router.post('/blog-post', async (req, res, next) => {
  try {
    const { keyword, topic, brand_name, tone, word_count, site_id, additional_context } = req.body;

    if (!keyword || !topic) {
      return res.status(400).json({ error: 'keyword and topic are required' });
    }

    const result = await contentGenerator.generateBlogPost({
      keyword,
      topic,
      brandName: brand_name,
      tone,
      wordCount: word_count,
      additionalContext: additional_context,
      siteId: site_id,
    });

    // Save to database if site_id provided
    if (site_id) {
      const contentId = contentGenerator.saveContent(site_id, 'blog_post', result, {
        targetKeyword: keyword,
        title: result.title,
      });
      result.content_id = contentId;
    }

    res.json({ content: result });
  } catch (err) {
    next(err);
  }
});

// Generate meta descriptions
router.post('/meta-description', async (req, res, next) => {
  try {
    const { page_title, page_content, keyword, page_type } = req.body;

    if (!page_title) {
      return res.status(400).json({ error: 'page_title is required' });
    }

    const result = await contentGenerator.generateMetaDescription({
      pageTitle: page_title,
      pageContent: page_content,
      keyword,
      pageType: page_type,
    });

    res.json({ content: result });
  } catch (err) {
    next(err);
  }
});

// Generate product description
router.post('/product-description', async (req, res, next) => {
  try {
    const { product_name, current_description, features, keyword, brand_name, site_id } = req.body;

    if (!product_name) {
      return res.status(400).json({ error: 'product_name is required' });
    }

    const result = await contentGenerator.generateProductDescription({
      productName: product_name,
      currentDescription: current_description,
      features,
      keyword,
      brandName: brand_name,
      siteId: site_id,
    });

    if (site_id) {
      const contentId = contentGenerator.saveContent(site_id, 'product_description', result, {
        targetKeyword: keyword || product_name,
        title: product_name,
      });
      result.content_id = contentId;
    }

    res.json({ content: result });
  } catch (err) {
    next(err);
  }
});

// Generate alt text for images
router.post('/alt-text', async (req, res, next) => {
  try {
    const { product_name, image_context, brand_name } = req.body;

    if (!product_name) {
      return res.status(400).json({ error: 'product_name is required' });
    }

    const result = await contentGenerator.generateAltText({
      productName: product_name,
      imageContext: image_context,
      brandName: brand_name,
    });

    res.json({ content: result });
  } catch (err) {
    next(err);
  }
});

// Get improvement suggestions for a page
router.post('/suggest-improvements', async (req, res, next) => {
  try {
    const { url, title, meta_description, body_content, current_keywords, gsc_data } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    const result = await contentGenerator.suggestImprovements({
      url,
      title,
      metaDescription: meta_description,
      bodyContent: body_content,
      currentKeywords: current_keywords,
      gscData: gsc_data,
    });

    res.json({ suggestions: result });
  } catch (err) {
    next(err);
  }
});

// Generate content calendar
router.post('/calendar', async (req, res, next) => {
  try {
    const { brand_name, niche, existing_content, target_keywords, months, site_id } = req.body;

    if (!brand_name || !niche) {
      return res.status(400).json({ error: 'brand_name and niche are required' });
    }

    const result = await contentGenerator.generateContentCalendar({
      brandName: brand_name,
      niche,
      existingContent: existing_content,
      targetKeywords: target_keywords,
      months,
    });

    if (site_id) {
      contentGenerator.saveContent(site_id, 'content_calendar', result, { title: `${brand_name} Content Calendar` });
    }

    res.json({ calendar: result });
  } catch (err) {
    next(err);
  }
});

// Humanize content (remove AI tells, improve readability)
router.post('/humanize', async (req, res, next) => {
  try {
    const { content, brand_voice, preserve_html, site_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content is required' });
    }

    const result = await contentGenerator.humanizeContent({
      content,
      brandVoice: brand_voice,
      preserveHtml: preserve_html !== false,
      siteId: site_id,
    });

    res.json({ result });
  } catch (err) {
    next(err);
  }
});

// Write an article from a content brief (used with competitor analysis)
router.post('/write-from-brief', async (req, res, next) => {
  try {
    const { brief, brand_name, brand_voice, target_keyword, site_id } = req.body;

    if (!brief) {
      return res.status(400).json({ error: 'brief is required' });
    }

    const result = await contentGenerator.writeFromBrief({
      brief,
      brandName: brand_name,
      brandVoice: brand_voice,
      targetKeyword: target_keyword,
      siteId: site_id,
    });

    if (site_id) {
      const contentId = contentGenerator.saveContent(site_id, 'brief_article', result, {
        targetKeyword: target_keyword,
        title: result.title,
      });
      result.content_id = contentId;
    }

    res.json({ article: result });
  } catch (err) {
    next(err);
  }
});

// List saved content
router.get('/:site_id', (req, res) => {
  const db = getDb();
  const { type, status } = req.query;

  let query = 'SELECT * FROM content WHERE site_id = ?';
  const params = [req.params.site_id];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT 50';
  const content = db.prepare(query).all(...params);

  res.json({ content });
});

// Update content status
router.patch('/:content_id/status', (req, res) => {
  const { status } = req.body;
  if (!['draft', 'approved', 'published', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = getDb();
  db.prepare('UPDATE content SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(status, req.params.content_id);

  res.json({ updated: true });
});

module.exports = router;
