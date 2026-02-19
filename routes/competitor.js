const express = require('express');
const router = express.Router();
const competitorAnalyzer = require('../services/competitor-analyzer');
const contentGenerator = require('../services/content-generator');

// Crawl a competitor site (Screaming Frog-style)
router.post('/crawl', async (req, res, next) => {
  try {
    const { url, max_pages } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const pages = await competitorAnalyzer.crawlCompetitor(url, {
      maxPages: max_pages || 200,
    });

    res.json({
      total_pages: pages.length,
      indexable_html: pages.filter(p => p.status_code === 200 && p.indexable && p.content_type === 'html').length,
      pages,
    });
  } catch (err) {
    next(err);
  }
});

// Get competitor's most valuable pages (sorted by inlinks)
router.post('/top-pages', async (req, res, next) => {
  try {
    const { url, max_pages, blog_only, limit } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await competitorAnalyzer.getTopCompetitorPages(url, {
      maxPages: max_pages || 200,
      blogOnly: blog_only || false,
      limit: limit || 30,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Deep-analyze a single competitor page
router.post('/analyze-page', async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const analysis = await competitorAnalyzer.analyzeCompetitorPage(url);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

// Generate a content brief to outperform a competitor page
router.post('/brief', async (req, res, next) => {
  try {
    const { url, brand_name, target_keyword } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await competitorAnalyzer.generateContentBrief(url, {
      brandName: brand_name,
      targetKeyword: target_keyword,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Full workflow: analyze competitor page -> generate brief -> write article
router.post('/outperform', async (req, res, next) => {
  try {
    const { url, brand_name, target_keyword, brand_voice, site_id } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    // Step 1: Generate brief from competitor page
    const briefResult = await competitorAnalyzer.generateContentBrief(url, {
      brandName: brand_name,
      targetKeyword: target_keyword,
    });

    if (briefResult.error) {
      return res.status(400).json({ error: briefResult.error });
    }

    // Step 2: Write article from brief
    const article = await contentGenerator.writeFromBrief({
      brief: briefResult.brief,
      brandName: brand_name,
      brandVoice: brand_voice,
      targetKeyword: target_keyword,
    });

    // Step 3: Save to database if site_id provided
    if (site_id) {
      const contentId = contentGenerator.saveContent(site_id, 'competitor_article', article, {
        targetUrl: url,
        targetKeyword: target_keyword,
        title: article.title,
      });
      article.content_id = contentId;
    }

    res.json({
      competitor_analysis: briefResult.competitor_analysis,
      brief: briefResult.brief,
      article,
    });
  } catch (err) {
    next(err);
  }
});

// Compare your site's content coverage vs a competitor
router.post('/compare', async (req, res, next) => {
  try {
    const { your_url, competitor_url, max_pages } = req.body;
    if (!your_url || !competitor_url) {
      return res.status(400).json({ error: 'your_url and competitor_url are required' });
    }

    const comparison = await competitorAnalyzer.compareContentCoverage(your_url, competitor_url, {
      maxPages: max_pages || 100,
    });

    res.json(comparison);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
