require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const config = require('./config');
const { requireAuth } = require('./middleware/auth');
const { startCronJobs } = require('./cron');

// Initialize database on startup
require('./database').getDb();

const app = express();

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // CSP off for dashboard inline scripts
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Prevent caching on all responses (avoids stale auth errors in browser)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// ==================== Dashboard ====================

app.get('/', (req, res) => {
  res.render('dashboard', { apiKey: config.apiKey || '' });
});

// ==================== Shopify OAuth (no auth required — one-time setup) ====================
app.use('/auth', require('./routes/shopify-auth'));

// ==================== API Routes ====================

// All API routes require authentication
app.use('/api', requireAuth);

// Site management
app.use('/api/sites', require('./routes/sites'));

// SEO analysis
app.use('/api/analysis', require('./routes/analysis'));

// Content generation
app.use('/api/content', require('./routes/content'));

// GEO optimization
app.use('/api/geo', require('./routes/geo'));

// Internal linking
app.use('/api/linking', require('./routes/linking'));

// Keyword & SERP tracking
app.use('/api/keywords', require('./routes/keywords'));

// Google Search Console
app.use('/api/gsc', require('./routes/gsc-routes'));

// Shopify
app.use('/api/shopify', require('./routes/shopify-routes'));

// Competitor analysis
app.use('/api/competitor', require('./routes/competitor'));

// Schema markup generation
app.use('/api/schema', require('./routes/schema'));

// Reviews & UGC SEO
app.use('/api/reviews', require('./routes/reviews'));

// Publish pipeline (generate -> publish -> interlink -> submit)
app.use('/api/pipeline', require('./routes/pipeline'));

// Content performance tracking (feedback loop after publish)
app.use('/api/performance', require('./routes/performance'));

// Auto-reoptimization (autonomous fixes for underperforming content)
app.use('/api/reoptimize', require('./routes/reoptimize'));

// ==================== Health check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    integrations: {
      shopify: require('./services/shopify').isConfigured(),
      gsc: require('./services/google-search-console').isConfigured(),
      anthropic: require('./services/content-generator').isConfigured(),
    },
  });
});

// ==================== Error handling ====================

app.use((err, req, res, _next) => {
  console.error('[ERROR]', err.stack || err.message);

  const status = err.status || 500;
  res.status(status).json({
    error: config.env === 'production' ? 'Internal server error' : err.message,
  });
});

// ==================== Start server ====================

app.listen(config.port, config.ip, () => {
  console.log(`\n  SEO Bot running on http://${config.ip}:${config.port}`);
  console.log(`  Dashboard: http://localhost:${config.port}/`);
  console.log(`  API Base:  http://localhost:${config.port}/api\n`);
});

// Start cron jobs
startCronJobs();

module.exports = app;
