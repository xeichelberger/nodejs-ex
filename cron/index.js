const cron = require('node-cron');
const config = require('../config');
const { getDb } = require('../database');
const seoAnalyzer = require('../services/seo-analyzer');
const gsc = require('../services/google-search-console');
const serpTracker = require('../services/serp-tracker');
const contentPerformance = require('../services/content-performance');
const autoReoptimize = require('../services/auto-reoptimize');

function logJob(jobName, status, result) {
  try {
    const db = getDb();
    if (status === 'running') {
      const stmt = db.prepare('INSERT INTO job_runs (job_name, status) VALUES (?, ?)');
      return stmt.run(jobName, status).lastInsertRowid;
    } else {
      db.prepare('UPDATE job_runs SET status = ?, result = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(status, typeof result === 'string' ? result : JSON.stringify(result), result);
    }
  } catch (err) {
    console.error(`[CRON] Failed to log job ${jobName}:`, err.message);
  }
}

function startCronJobs() {
  console.log('[CRON] Initializing scheduled jobs...');

  // Weekly SEO audit of all tracked sites
  cron.schedule(config.cron.seoAudit, async () => {
    console.log('[CRON] Starting weekly SEO audit...');
    const jobId = logJob('seo_audit', 'running');

    try {
      const db = getDb();
      const sites = db.prepare('SELECT * FROM sites').all();

      for (const site of sites) {
        console.log(`[CRON] Auditing ${site.url}...`);
        await seoAnalyzer.auditSite(site.url, site.id, 20);
      }

      logJob('seo_audit', 'completed', { jobId, sites: sites.length });
      console.log('[CRON] Weekly SEO audit complete.');
    } catch (err) {
      logJob('seo_audit', 'failed', { jobId, error: err.message });
      console.error('[CRON] SEO audit failed:', err.message);
    }
  });

  // Daily SERP check - sync GSC data and update keyword positions
  cron.schedule(config.cron.serpCheck, async () => {
    console.log('[CRON] Starting daily SERP check...');
    const jobId = logJob('serp_check', 'running');

    try {
      if (!gsc.isConfigured()) {
        console.log('[CRON] GSC not configured, skipping SERP check.');
        return;
      }

      const db = getDb();
      const sites = db.prepare('SELECT * FROM sites').all();

      for (const site of sites) {
        // Sync GSC data
        await gsc.syncToDatabase(site.id);
        // Update keyword positions
        serpTracker.updatePositions(site.id);
      }

      logJob('serp_check', 'completed', { jobId, sites: sites.length });
      console.log('[CRON] Daily SERP check complete.');
    } catch (err) {
      logJob('serp_check', 'failed', { jobId, error: err.message });
      console.error('[CRON] SERP check failed:', err.message);
    }
  });

  // Weekly content performance check — runs after SERP data is fresh
  cron.schedule(config.cron.performanceCheck, async () => {
    console.log('[CRON] Starting content performance check...');
    const jobId = logJob('performance_check', 'running');

    try {
      const db = getDb();
      const sites = db.prepare('SELECT * FROM sites').all();
      let totalChecked = 0;

      for (const site of sites) {
        const result = await contentPerformance.checkAll(site.id);
        totalChecked += result.checked;
      }

      logJob('performance_check', 'completed', { jobId, sites: sites.length, articles_checked: totalChecked });
      console.log(`[CRON] Content performance check complete. ${totalChecked} articles checked.`);
    } catch (err) {
      logJob('performance_check', 'failed', { jobId, error: err.message });
      console.error('[CRON] Performance check failed:', err.message);
    }
  });

  // Weekly auto-reoptimize — runs after performance check, fixes underperformers
  cron.schedule(config.cron.autoReoptimize, async () => {
    console.log('[CRON] Starting auto-reoptimize sweep...');
    const jobId = logJob('auto_reoptimize', 'running');

    try {
      const db = getDb();
      const sites = db.prepare('SELECT * FROM sites').all();
      let totalActions = 0;

      for (const site of sites) {
        const result = await autoReoptimize.sweep(site.id);
        totalActions += result.actions_taken;
      }

      logJob('auto_reoptimize', 'completed', { jobId, sites: sites.length, actions_taken: totalActions });
      console.log(`[CRON] Auto-reoptimize complete. ${totalActions} actions taken.`);
    } catch (err) {
      logJob('auto_reoptimize', 'failed', { jobId, error: err.message });
      console.error('[CRON] Auto-reoptimize failed:', err.message);
    }
  });

  console.log('[CRON] Scheduled jobs initialized.');
  console.log(`  - SEO Audit: ${config.cron.seoAudit}`);
  console.log(`  - SERP Check: ${config.cron.serpCheck}`);
  console.log(`  - Performance Check: ${config.cron.performanceCheck}`);
  console.log(`  - Auto-Reoptimize: ${config.cron.autoReoptimize}`);
}

module.exports = { startCronJobs };
