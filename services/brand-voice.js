const { getDb } = require('../database');

/**
 * Brand Voice Service
 *
 * Stores and retrieves brand voice documents per site.
 * Every content generation call auto-loads the voice for the site
 * so you never have to pass it manually.
 */
class BrandVoice {
  /**
   * Set or update the brand voice for a site.
   * Stores the full document and an optional short summary.
   */
  set(siteId, { voiceDocument, brandName, summary }) {
    const db = getDb();

    const existing = db.prepare('SELECT id FROM brand_voice WHERE site_id = ?').get(siteId);

    if (existing) {
      db.prepare(`
        UPDATE brand_voice
        SET voice_document = ?, brand_name = ?, summary = ?, updated_at = CURRENT_TIMESTAMP
        WHERE site_id = ?
      `).run(voiceDocument, brandName || null, summary || null, siteId);
    } else {
      db.prepare(`
        INSERT INTO brand_voice (site_id, voice_document, brand_name, summary)
        VALUES (?, ?, ?, ?)
      `).run(siteId, voiceDocument, brandName || null, summary || null);
    }

    return this.get(siteId);
  }

  /**
   * Get the brand voice for a site. Returns null if none is set.
   */
  get(siteId) {
    const db = getDb();
    return db.prepare('SELECT * FROM brand_voice WHERE site_id = ?').get(siteId) || null;
  }

  /**
   * Delete the brand voice for a site.
   */
  delete(siteId) {
    const db = getDb();
    db.prepare('DELETE FROM brand_voice WHERE site_id = ?').run(siteId);
    return { deleted: true };
  }

  /**
   * Get the voice document text for injection into prompts.
   * Returns empty string if no voice is configured (falls back to generic tone).
   */
  getVoiceForPrompt(siteId) {
    if (!siteId) return '';
    const voice = this.get(siteId);
    if (!voice) return '';
    return voice.voice_document;
  }

  /**
   * Get brand name from stored voice config.
   */
  getBrandName(siteId) {
    if (!siteId) return null;
    const voice = this.get(siteId);
    return voice?.brand_name || null;
  }
}

module.exports = new BrandVoice();
