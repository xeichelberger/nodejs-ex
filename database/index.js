const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'seo-bot.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    migrate(db);
  }
  return db;
}

function migrate(database) {
  database.exec(`
    -- Sites being tracked
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      name TEXT,
      platform TEXT DEFAULT 'shopify',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- SEO audit results per page
    CREATE TABLE IF NOT EXISTS page_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      title TEXT,
      meta_description TEXT,
      h1_count INTEGER DEFAULT 0,
      h2_count INTEGER DEFAULT 0,
      h3_count INTEGER DEFAULT 0,
      word_count INTEGER DEFAULT 0,
      image_count INTEGER DEFAULT 0,
      images_without_alt INTEGER DEFAULT 0,
      internal_links INTEGER DEFAULT 0,
      external_links INTEGER DEFAULT 0,
      broken_links INTEGER DEFAULT 0,
      has_canonical INTEGER DEFAULT 0,
      has_robots_meta INTEGER DEFAULT 0,
      has_og_tags INTEGER DEFAULT 0,
      has_schema_markup INTEGER DEFAULT 0,
      load_time_ms INTEGER,
      status_code INTEGER,
      score REAL DEFAULT 0,
      issues TEXT, -- JSON array of issues found
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    -- SERP keyword tracking
    CREATE TABLE IF NOT EXISTS keywords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      current_position INTEGER,
      previous_position INTEGER,
      search_volume INTEGER,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id),
      UNIQUE(site_id, keyword)
    );

    -- SERP position history
    CREATE TABLE IF NOT EXISTS keyword_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword_id INTEGER NOT NULL,
      position INTEGER,
      url TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (keyword_id) REFERENCES keywords(id)
    );

    -- Generated content
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'blog_post', 'meta_description', 'product_description', 'page_title', 'alt_text'
      target_url TEXT,
      target_keyword TEXT,
      title TEXT,
      body TEXT NOT NULL,
      status TEXT DEFAULT 'draft', -- 'draft', 'approved', 'published', 'rejected'
      published_to TEXT, -- 'shopify_blog', 'shopify_page', etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    -- Internal linking suggestions
    CREATE TABLE IF NOT EXISTS link_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      source_url TEXT NOT NULL,
      target_url TEXT NOT NULL,
      anchor_text TEXT,
      context TEXT, -- surrounding text for the suggestion
      relevance_score REAL DEFAULT 0,
      status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'dismissed'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    -- Google Search Console data snapshots
    CREATE TABLE IF NOT EXISTS gsc_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      query TEXT,
      page TEXT,
      clicks INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      ctr REAL DEFAULT 0,
      position REAL DEFAULT 0,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    -- GEO optimization records
    CREATE TABLE IF NOT EXISTS geo_optimizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_id INTEGER NOT NULL,
      brand_name TEXT NOT NULL,
      target_queries TEXT, -- JSON array of AI search queries to optimize for
      current_citations TEXT, -- JSON: where the brand currently appears in AI results
      recommendations TEXT, -- JSON array of recommendations
      content_gaps TEXT, -- JSON array of content gaps identified
      authority_signals TEXT, -- JSON: current authority signals found
      score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (site_id) REFERENCES sites(id)
    );

    -- Cron job run log
    CREATE TABLE IF NOT EXISTS job_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_name TEXT NOT NULL,
      status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
      result TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      finished_at DATETIME
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_page_audits_site ON page_audits(site_id);
    CREATE INDEX IF NOT EXISTS idx_page_audits_url ON page_audits(url);
    CREATE INDEX IF NOT EXISTS idx_keywords_site ON keywords(site_id);
    CREATE INDEX IF NOT EXISTS idx_gsc_data_site_date ON gsc_data(site_id, date);
    CREATE INDEX IF NOT EXISTS idx_content_site_type ON content(site_id, type);
    CREATE INDEX IF NOT EXISTS idx_link_suggestions_site ON link_suggestions(site_id);
  `);
}

function reset() {
  const d = getDb();
  d.exec(`
    DROP TABLE IF EXISTS job_runs;
    DROP TABLE IF EXISTS geo_optimizations;
    DROP TABLE IF EXISTS gsc_data;
    DROP TABLE IF EXISTS link_suggestions;
    DROP TABLE IF EXISTS content;
    DROP TABLE IF EXISTS keyword_history;
    DROP TABLE IF EXISTS keywords;
    DROP TABLE IF EXISTS page_audits;
    DROP TABLE IF EXISTS sites;
  `);
  migrate(d);
  console.log('Database reset complete.');
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, reset, close };
