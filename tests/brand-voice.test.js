const { expect } = require('chai');
const { getDb, close } = require('../database');
const brandVoice = require('../services/brand-voice');

describe('Brand Voice', () => {
  let siteId;

  before(() => {
    // Reset for clean test
    const db = getDb();
    db.exec('DELETE FROM brand_voice');
    db.exec('DELETE FROM sites');

    const result = db.prepare('INSERT INTO sites (url, name) VALUES (?, ?)').run('https://ashmiandco.com', 'Ashmi & Co.');
    siteId = result.lastInsertRowid;
  });

  after(() => {
    close();
  });

  it('should return null when no voice is set', () => {
    const voice = brandVoice.get(siteId);
    expect(voice).to.be.null;
  });

  it('should return empty string for prompt when no voice is set', () => {
    const text = brandVoice.getVoiceForPrompt(siteId);
    expect(text).to.equal('');
  });

  it('should store and retrieve a brand voice', () => {
    const result = brandVoice.set(siteId, {
      voiceDocument: 'Write like a knowledgeable friend with incredible taste.',
      brandName: 'Ashmi & Co.',
      summary: 'Luxury baby clothing brand, warm and intentional tone',
    });

    expect(result).to.not.be.null;
    expect(result.brand_name).to.equal('Ashmi & Co.');
    expect(result.voice_document).to.include('knowledgeable friend');
    expect(result.summary).to.include('Luxury baby');
  });

  it('should return stored voice for prompt injection', () => {
    const text = brandVoice.getVoiceForPrompt(siteId);
    expect(text).to.include('knowledgeable friend');
  });

  it('should return brand name from stored config', () => {
    const name = brandVoice.getBrandName(siteId);
    expect(name).to.equal('Ashmi & Co.');
  });

  it('should update existing voice on re-set', () => {
    brandVoice.set(siteId, {
      voiceDocument: 'Updated voice guide with new rules.',
      brandName: 'Ashmi & Co.',
      summary: 'Updated summary',
    });

    const voice = brandVoice.get(siteId);
    expect(voice.voice_document).to.include('Updated voice guide');
    expect(voice.summary).to.equal('Updated summary');
  });

  it('should delete brand voice', () => {
    brandVoice.delete(siteId);
    const voice = brandVoice.get(siteId);
    expect(voice).to.be.null;
  });

  it('should handle null siteId gracefully', () => {
    expect(brandVoice.getVoiceForPrompt(null)).to.equal('');
    expect(brandVoice.getBrandName(null)).to.be.null;
  });
});
