const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { getDb } = require('../database');

class ContentGenerator {
  constructor() {
    this.client = null;
    this.model = config.anthropic.model;
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
   * Generate an SEO-optimized blog post
   */
  async generateBlogPost({ keyword, topic, brandName, tone = 'professional', wordCount = 1500, additionalContext = '' }) {
    this._ensureConfigured();

    const prompt = `Write a comprehensive, SEO-optimized blog post for an ecommerce brand.

BRAND: ${brandName || 'the brand'}
PRIMARY KEYWORD: ${keyword}
TOPIC: ${topic}
TONE: ${tone}
TARGET WORD COUNT: ${wordCount}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Requirements:
1. Create an engaging H1 title that naturally includes the primary keyword
2. Use H2 and H3 subheadings throughout for structure (include keyword variations)
3. Write a compelling introduction that hooks the reader in the first 2 sentences
4. Include the primary keyword naturally 3-5 times throughout the post
5. Use related/LSI keywords and semantic variations throughout
6. Write for humans first, search engines second - make it genuinely useful
7. Include a clear call-to-action relevant to the ecommerce brand
8. End with a conclusion that summarizes key takeaways
9. Use short paragraphs (2-3 sentences max) for readability
10. Include suggestions for internal links marked as [INTERNAL LINK: anchor text -> suggested page type]

Format the output as JSON with these fields:
{
  "title": "The H1/page title",
  "meta_description": "150-160 char meta description with keyword",
  "slug": "url-friendly-slug",
  "body_html": "Full HTML content with proper heading tags",
  "tags": ["tag1", "tag2"],
  "internal_link_suggestions": [{"anchor": "text", "target_page_type": "type"}],
  "target_keywords": ["primary", "secondary1", "secondary2"]
}`;

    return this._generate(prompt);
  }

  /**
   * Generate SEO meta descriptions for products or pages
   */
  async generateMetaDescription({ pageTitle, pageContent, keyword, pageType = 'product' }) {
    this._ensureConfigured();

    const prompt = `Generate 3 SEO-optimized meta descriptions for this ${pageType} page.

PAGE TITLE: ${pageTitle}
TARGET KEYWORD: ${keyword || 'N/A'}
PAGE CONTENT SUMMARY: ${(pageContent || '').substring(0, 500)}

Requirements for each meta description:
- Between 150-160 characters
- Include the target keyword naturally
- Include a compelling call-to-action or value proposition
- Make each one unique with a different angle

Return as JSON:
{
  "descriptions": [
    {"text": "description 1", "char_count": 155},
    {"text": "description 2", "char_count": 152},
    {"text": "description 3", "char_count": 158}
  ]
}`;

    return this._generate(prompt);
  }

  /**
   * Generate SEO-optimized product descriptions
   */
  async generateProductDescription({ productName, currentDescription, features, keyword, brandName }) {
    this._ensureConfigured();

    const prompt = `Write an SEO-optimized product description for an ecommerce store.

PRODUCT: ${productName}
BRAND: ${brandName || 'the brand'}
TARGET KEYWORD: ${keyword || productName}
CURRENT DESCRIPTION: ${(currentDescription || 'None').substring(0, 500)}
KEY FEATURES: ${features ? features.join(', ') : 'Not specified'}

Requirements:
1. Write a compelling product description (200-400 words)
2. Naturally include the target keyword 2-3 times
3. Highlight benefits, not just features
4. Use persuasive ecommerce copywriting techniques
5. Include structured HTML (bullet points for features, paragraphs for benefits)
6. Optimize for both search engines and conversion

Return as JSON:
{
  "title_tag": "SEO page title (50-60 chars)",
  "meta_description": "Meta description (150-160 chars)",
  "body_html": "Full HTML product description",
  "target_keywords": ["primary", "secondary"]
}`;

    return this._generate(prompt);
  }

  /**
   * Generate alt text for product images
   */
  async generateAltText({ productName, imageContext, brandName }) {
    this._ensureConfigured();

    const prompt = `Generate SEO-friendly alt text for a product image.

PRODUCT: ${productName}
BRAND: ${brandName || ''}
IMAGE CONTEXT: ${imageContext || 'Main product image'}

Requirements:
- Descriptive and accurate (what does the image show?)
- Include the product name naturally
- Under 125 characters
- Don't start with "image of" or "picture of"

Return as JSON:
{
  "alt_text": "the descriptive alt text",
  "char_count": 85
}`;

    return this._generate(prompt);
  }

  /**
   * Generate content improvement suggestions for an existing page
   */
  async suggestImprovements({ url, title, metaDescription, bodyContent, currentKeywords, gscData }) {
    this._ensureConfigured();

    const prompt = `Analyze this ecommerce page and suggest specific SEO improvements.

URL: ${url}
CURRENT TITLE: ${title || 'None'}
CURRENT META DESCRIPTION: ${metaDescription || 'None'}
CONTENT PREVIEW: ${(bodyContent || '').substring(0, 1000)}
CURRENT KEYWORDS RANKING FOR: ${currentKeywords ? JSON.stringify(currentKeywords) : 'Unknown'}
${gscData ? `SEARCH CONSOLE DATA: ${JSON.stringify(gscData)}` : ''}

Provide actionable improvements:
1. Title tag optimization
2. Meta description optimization
3. Content gaps and additions needed
4. Keyword targeting improvements
5. Internal linking opportunities
6. Schema markup suggestions
7. Content structure improvements

Return as JSON:
{
  "suggested_title": "improved title tag",
  "suggested_meta_description": "improved meta description",
  "content_suggestions": ["suggestion 1", "suggestion 2"],
  "keyword_opportunities": ["keyword 1", "keyword 2"],
  "internal_linking_suggestions": [{"anchor": "text", "target": "page type"}],
  "schema_suggestions": ["schema type 1"],
  "priority_actions": [{"action": "what to do", "impact": "high/medium/low", "effort": "high/medium/low"}]
}`;

    return this._generate(prompt);
  }

  /**
   * Generate a content calendar / topic cluster for a brand
   */
  async generateContentCalendar({ brandName, niche, existingContent = [], targetKeywords = [], months = 3 }) {
    this._ensureConfigured();

    const prompt = `Create a ${months}-month SEO content calendar for an ecommerce brand.

BRAND: ${brandName}
NICHE/INDUSTRY: ${niche}
EXISTING CONTENT: ${existingContent.length > 0 ? existingContent.slice(0, 20).join(', ') : 'None provided'}
TARGET KEYWORDS: ${targetKeywords.length > 0 ? targetKeywords.join(', ') : 'Not specified'}

Requirements:
1. Create topic clusters around pillar pages
2. Include a mix of blog posts, guides, and landing page content
3. Target different stages of the buying funnel (awareness, consideration, decision)
4. Include primary and secondary keywords for each piece
5. Suggest internal linking between pieces
6. Consider seasonal trends and search intent

Return as JSON:
{
  "pillar_pages": [
    {"topic": "main topic", "target_keyword": "keyword", "supporting_posts": ["post1", "post2"]}
  ],
  "monthly_plan": [
    {
      "month": 1,
      "content": [
        {
          "title": "Post title",
          "type": "blog_post|guide|landing_page",
          "target_keyword": "keyword",
          "search_intent": "informational|transactional|navigational",
          "funnel_stage": "awareness|consideration|decision",
          "internal_links_to": ["other content titles"]
        }
      ]
    }
  ]
}`;

    return this._generate(prompt);
  }

  /**
   * Save generated content to database
   */
  saveContent(siteId, type, content, { targetUrl, targetKeyword, title } = {}) {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO content (site_id, type, target_url, target_keyword, title, body, status)
      VALUES (?, ?, ?, ?, ?, ?, 'draft')
    `);

    const result = stmt.run(
      siteId,
      type,
      targetUrl || null,
      targetKeyword || null,
      title || null,
      typeof content === 'string' ? content : JSON.stringify(content)
    );

    return result.lastInsertRowid;
  }

  async _generate(prompt) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;

    // Try to parse as JSON
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Return raw text if JSON parsing fails
    }

    return { raw: text };
  }

  _ensureConfigured() {
    if (!this.isConfigured()) {
      throw new Error('Anthropic API not configured. Set ANTHROPIC_API_KEY in your .env file.');
    }
  }
}

module.exports = new ContentGenerator();
