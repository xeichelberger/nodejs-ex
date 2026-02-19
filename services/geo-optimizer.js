const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const { getDb } = require('../database');
const brandVoiceService = require('./brand-voice');

/**
 * GEO (Generative Engine Optimization) module
 *
 * Optimizes brand presence for AI-powered search engines (ChatGPT, Claude, Perplexity, Google AI Overview).
 * Focuses on making brand content more likely to be cited by LLMs in search results.
 */
class GEOOptimizer {
  constructor() {
    this.client = null;
    this._init();
  }

  _init() {
    if (config.anthropic.apiKey) {
      this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
    }
  }

  isConfigured() {
    return !!this.client;
  }

  /**
   * Full GEO audit for a brand
   * Analyzes how well a brand is positioned for AI search engine citations
   */
  async auditBrand({ brandName, siteUrl, siteId, products = [], niche = '' }) {
    this._ensureConfigured();

    // Step 1: Analyze existing content for GEO readiness
    const contentAnalysis = await this._analyzeContentForGEO(siteUrl);

    // Step 2: Check authority signals
    const authoritySignals = await this._checkAuthoritySignals(siteUrl, brandName);

    // Step 3: Generate target AI search queries for the brand
    const targetQueries = await this._generateTargetQueries(brandName, niche, products);

    // Step 4: Identify content gaps for GEO
    const contentGaps = await this._identifyContentGaps(brandName, niche, contentAnalysis, targetQueries);

    // Step 5: Generate recommendations
    const recommendations = await this._generateRecommendations(brandName, {
      contentAnalysis,
      authoritySignals,
      targetQueries,
      contentGaps,
    });

    // Calculate GEO score
    const score = this._calculateGEOScore(contentAnalysis, authoritySignals);

    const result = {
      brand_name: brandName,
      target_queries: targetQueries,
      current_citations: contentAnalysis,
      recommendations,
      content_gaps: contentGaps,
      authority_signals: authoritySignals,
      score,
    };

    // Save to database
    if (siteId) {
      this._saveOptimization(siteId, result);
    }

    return result;
  }

  /**
   * Generate GEO-optimized content for a specific topic
   * This creates content specifically designed to be cited by AI search engines
   */
  async generateGEOContent({ brandName, topic, keyword, contentType = 'authority_article', niche = '', siteId }) {
    this._ensureConfigured();

    // Auto-load brand voice if site has one configured
    let voiceBlock = '';
    if (siteId) {
      const storedVoice = brandVoiceService.getVoiceForPrompt(siteId);
      if (storedVoice) {
        voiceBlock = `\nBRAND VOICE GUIDE (follow this for tone and style):\n${storedVoice}\n`;
      }
      if (!brandName) brandName = brandVoiceService.getBrandName(siteId) || brandName;
    }

    const prompt = `Create GEO (Generative Engine Optimization) content for a brand to maximize chances of being cited by AI search engines like ChatGPT, Perplexity, and Google AI Overviews.

BRAND: ${brandName}
TOPIC: ${topic}
PRIMARY KEYWORD: ${keyword}
CONTENT TYPE: ${contentType}
NICHE: ${niche}
${voiceBlock}
GEO-Specific Requirements:
1. STRUCTURED DATA: Use clear, well-organized sections with descriptive headings that AI can easily parse
2. DEFINITIVE STATEMENTS: Include clear, quotable statements that AI can extract as answers
3. STATISTICS & DATA: Include specific numbers, percentages, and data points (cite sources where possible)
4. EXPERT POSITIONING: Position the brand as a subject matter expert with authoritative language
5. FAQ FORMAT: Include a FAQ section with clear question-answer pairs (AI loves extracting these)
6. COMPARISON CONTENT: Include fair comparisons or "best of" lists when relevant
7. FIRST-PERSON EXPERTISE: Include "According to [brand]..." or "Based on our experience..." statements
8. UNIQUE INSIGHTS: Provide original data, unique perspectives, or proprietary methodology
9. COMPREHENSIVE COVERAGE: Be thorough - AI prefers comprehensive sources over thin content
10. CITATION-FRIENDLY: Write sentences that work as standalone answers to search queries

Additional SEO Requirements:
- Natural keyword inclusion throughout
- Proper HTML structure with semantic headings
- Internal linking suggestions
- Schema markup recommendations

Return as JSON:
{
  "title": "Page title",
  "meta_description": "150-160 char description",
  "body_html": "Full HTML content optimized for GEO",
  "schema_markup": {
    "type": "recommended schema type",
    "properties": "key properties to include"
  },
  "faq_schema": [
    {"question": "Q1", "answer": "A1"}
  ],
  "quotable_statements": ["statement AI could cite"],
  "target_ai_queries": ["queries this content should rank for in AI search"],
  "internal_link_suggestions": [{"anchor": "text", "target": "page type"}]
}`;

    return this._generate(prompt);
  }

  /**
   * Generate brand entity optimization recommendations
   * Helps establish brand as a recognized entity for AI systems
   */
  async optimizeBrandEntity({ brandName, siteUrl, niche, founders, yearFounded, uniqueSellingPoints }) {
    this._ensureConfigured();

    const prompt = `Analyze and provide recommendations for establishing "${brandName}" as a recognized entity for AI search engines and knowledge graphs.

BRAND: ${brandName}
WEBSITE: ${siteUrl}
NICHE: ${niche}
FOUNDED: ${yearFounded || 'Unknown'}
FOUNDERS: ${founders || 'Unknown'}
USPs: ${uniqueSellingPoints ? uniqueSellingPoints.join(', ') : 'Not specified'}

Provide recommendations for:
1. KNOWLEDGE PANEL OPTIMIZATION: Steps to get/improve Google Knowledge Panel
2. ENTITY ASSOCIATIONS: What concepts/entities the brand should be associated with
3. ABOUT PAGE: What the About page should include for entity recognition
4. STRUCTURED DATA: Schema.org markup for Organization/Brand
5. EXTERNAL SIGNALS: Where the brand should be mentioned/listed (Wikipedia, Crunchbase, industry directories)
6. CONSISTENT NAP+: Ensuring consistent Name, Address, Phone + brand description across the web
7. SOCIAL PROOF: Reviews, testimonials, and social signals that build entity authority
8. CONTENT STRATEGY: Types of content that establish entity expertise

Return as JSON:
{
  "entity_score": 0-100,
  "knowledge_panel": {"status": "likely/unlikely/exists", "recommendations": []},
  "schema_markup": "Complete Organization schema JSON-LD to add to site",
  "about_page_template": "Recommended about page structure",
  "external_listings": [{"platform": "name", "priority": "high/medium/low", "action": "what to do"}],
  "content_recommendations": [{"type": "content type", "topic": "topic", "purpose": "why this helps GEO"}],
  "quick_wins": ["immediate action 1", "immediate action 2"]
}`;

    return this._generate(prompt);
  }

  // ==================== Private methods ====================

  async _analyzeContentForGEO(siteUrl) {
    try {
      const response = await axios.get(siteUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SEOBot/1.0' },
      });

      const $ = cheerio.load(response.data);

      return {
        has_faq_section: $('*:contains("FAQ")').length > 0 || $('[itemtype*="FAQPage"]').length > 0,
        has_schema_markup: $('script[type="application/ld+json"]').length > 0,
        has_about_page: $('a[href*="about"]').length > 0,
        has_statistics: ($.html().match(/\d+%|\d+\s*(million|billion|thousand)/gi) || []).length,
        has_definitions: $('dfn, dt').length > 0 || ($.html().match(/\bis\s+defined\s+as\b|\bmeans\b/gi) || []).length,
        heading_structure: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length,
        },
        word_count: $('body').text().replace(/\s+/g, ' ').trim().split(/\s+/).length,
        schema_types: this._extractSchemaTypes($),
      };
    } catch {
      return { error: 'Could not analyze site content' };
    }
  }

  async _checkAuthoritySignals(siteUrl, brandName) {
    const signals = {
      has_https: siteUrl.startsWith('https://'),
      has_structured_data: false,
      external_mentions: 'not_checked', // Would need external API for this
      social_profiles_linked: false,
    };

    try {
      const response = await axios.get(siteUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'SEOBot/1.0' },
      });

      const $ = cheerio.load(response.data);

      signals.has_structured_data = $('script[type="application/ld+json"]').length > 0;
      signals.social_profiles_linked = $('a[href*="facebook.com"], a[href*="twitter.com"], a[href*="linkedin.com"], a[href*="instagram.com"]').length > 0;

      // Check for author/expertise signals
      signals.has_author_info = $('[rel="author"], .author, [itemtype*="Person"]').length > 0;
      signals.has_reviews = $('[itemtype*="Review"], .review, .testimonial').length > 0;
    } catch {
      // Continue with defaults
    }

    return signals;
  }

  async _generateTargetQueries(brandName, niche, products) {
    const prompt = `Generate a list of AI search queries where the brand "${brandName}" in the ${niche || 'ecommerce'} niche should ideally appear in AI-generated answers.

Products/Services: ${products.length > 0 ? products.slice(0, 10).join(', ') : 'General ecommerce'}

Generate queries in these categories:
1. Direct brand queries ("what is [brand]", "is [brand] good")
2. Category queries ("best [product category]", "top [niche] brands")
3. Comparison queries ("[brand] vs [competitor]")
4. Problem-solution queries ("how to [solve problem brand addresses]")
5. Review/recommendation queries ("best [product type] for [use case]")

Return as JSON:
{
  "queries": [
    {"query": "the search query", "category": "category", "priority": "high/medium/low", "current_likely_position": "cited/not_cited/unknown"}
  ]
}`;

    return this._generate(prompt);
  }

  async _identifyContentGaps(brandName, niche, contentAnalysis, targetQueries) {
    const prompt = `Based on this analysis, identify content gaps that prevent "${brandName}" from being cited in AI search results.

CONTENT ANALYSIS: ${JSON.stringify(contentAnalysis)}
TARGET QUERIES: ${JSON.stringify(targetQueries)}
NICHE: ${niche}

Identify:
1. Missing content types (FAQ pages, comparison pages, how-to guides, etc.)
2. Topics not covered that AI engines would need to cite the brand
3. Missing authority signals (expert content, data-driven articles, etc.)
4. Missing structured data types

Return as JSON:
{
  "gaps": [
    {"type": "content type needed", "topic": "specific topic", "priority": "high/medium/low", "reason": "why this matters for GEO"}
  ]
}`;

    return this._generate(prompt);
  }

  async _generateRecommendations(brandName, analysisData) {
    const prompt = `Based on this GEO audit data, provide prioritized recommendations for "${brandName}" to improve visibility in AI-powered search engines.

ANALYSIS DATA: ${JSON.stringify(analysisData)}

Provide specific, actionable recommendations sorted by impact.

Return as JSON:
{
  "immediate_actions": [{"action": "what to do", "impact": "description", "effort": "low/medium/high"}],
  "short_term": [{"action": "what to do", "impact": "description", "timeline": "weeks"}],
  "long_term": [{"action": "what to do", "impact": "description", "timeline": "months"}]
}`;

    return this._generate(prompt);
  }

  _extractSchemaTypes($) {
    const types = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html());
        if (data['@type']) types.push(data['@type']);
      } catch {
        // skip malformed
      }
    });
    return types;
  }

  _calculateGEOScore(contentAnalysis, authoritySignals) {
    let score = 0;
    const max = 100;

    if (contentAnalysis.has_schema_markup) score += 15;
    if (contentAnalysis.has_faq_section) score += 15;
    if (contentAnalysis.has_about_page) score += 5;
    if (contentAnalysis.has_statistics > 3) score += 10;
    else if (contentAnalysis.has_statistics > 0) score += 5;
    if (contentAnalysis.heading_structure && contentAnalysis.heading_structure.h2 >= 3) score += 10;
    if (contentAnalysis.word_count > 1000) score += 10;
    else if (contentAnalysis.word_count > 500) score += 5;

    if (authoritySignals.has_https) score += 5;
    if (authoritySignals.has_structured_data) score += 10;
    if (authoritySignals.social_profiles_linked) score += 5;
    if (authoritySignals.has_author_info) score += 10;
    if (authoritySignals.has_reviews) score += 5;

    return Math.min(score, max);
  }

  _saveOptimization(siteId, result) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO geo_optimizations (
        site_id, brand_name, target_queries, current_citations,
        recommendations, content_gaps, authority_signals, score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      siteId,
      result.brand_name,
      JSON.stringify(result.target_queries),
      JSON.stringify(result.current_citations),
      JSON.stringify(result.recommendations),
      JSON.stringify(result.content_gaps),
      JSON.stringify(result.authority_signals),
      result.score
    );
  }

  async _generate(prompt) {
    const response = await this.client.messages.create({
      model: config.anthropic.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {
      // fall through
    }
    return { raw: text };
  }

  _ensureConfigured() {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API not configured. Set ANTHROPIC_API_KEY for GEO optimization.');
    }
  }
}

module.exports = new GEOOptimizer();
