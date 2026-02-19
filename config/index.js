require('dotenv').config();

const config = {
  port: process.env.PORT || 8080,
  ip: process.env.IP || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',

  apiKey: process.env.API_KEY || '',

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },

  shopify: {
    storeDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  },

  google: {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    privateKey: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    siteUrl: process.env.GOOGLE_SITE_URL || '',
  },

  cron: {
    seoAudit: process.env.CRON_SEO_AUDIT || '0 2 * * 1',       // Monday 2am
    serpCheck: process.env.CRON_SERP_CHECK || '0 6 * * *',       // Daily 6am
    contentSuggestions: process.env.CRON_CONTENT_SUGGESTIONS || '0 8 * * 1', // Monday 8am
  },

  // Rate limiting for crawling
  crawl: {
    maxConcurrent: parseInt(process.env.CRAWL_MAX_CONCURRENT || '3', 10),
    delayMs: parseInt(process.env.CRAWL_DELAY_MS || '1000', 10),
    maxPages: parseInt(process.env.CRAWL_MAX_PAGES || '100', 10),
    timeoutMs: parseInt(process.env.CRAWL_TIMEOUT_MS || '15000', 10),
  },
};

module.exports = config;
