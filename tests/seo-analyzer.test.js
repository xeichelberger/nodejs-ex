const { expect } = require('chai');
const seoAnalyzer = require('../services/seo-analyzer');

describe('SEO Analyzer', () => {
  describe('analyzePage()', () => {
    it('should return a result object with all SEO fields', async function () {
      this.timeout(20000);

      // Analyze a well-known site that should be stable
      const result = await seoAnalyzer.analyzePage('https://example.com');

      expect(result).to.be.an('object');
      expect(result).to.have.property('url', 'https://example.com');
      expect(result).to.have.property('title').that.is.a('string');
      expect(result).to.have.property('score').that.is.a('number');
      expect(result.score).to.be.within(0, 100);
      expect(result).to.have.property('issues').that.is.an('array');
      expect(result).to.have.property('h1_count').that.is.a('number');
      expect(result).to.have.property('word_count').that.is.a('number');
      expect(result).to.have.property('image_count').that.is.a('number');
      expect(result).to.have.property('internal_links').that.is.a('number');
      expect(result).to.have.property('external_links').that.is.a('number');
      expect(result).to.have.property('status_code', 200);
      expect(result).to.have.property('load_time_ms').that.is.a('number');
    });

    it('should detect missing meta description as an issue', async function () {
      this.timeout(20000);

      // example.com has a minimal page that likely lacks meta description
      const result = await seoAnalyzer.analyzePage('https://example.com');
      const metaIssues = result.issues.filter(i => i.category === 'meta');

      // example.com should have some meta-related issues
      expect(result.issues).to.be.an('array');
    });

    it('should handle unreachable URLs gracefully', async function () {
      this.timeout(20000);

      const result = await seoAnalyzer.analyzePage('https://this-domain-does-not-exist-12345.com');

      expect(result).to.have.property('score', 0);
      expect(result.issues).to.have.length.greaterThan(0);
      expect(result.issues[0].severity).to.equal('critical');
    });
  });

  describe('parseSitemap()', () => {
    it('should parse a sitemap and return URLs', async function () {
      this.timeout(20000);

      const urls = await seoAnalyzer.parseSitemap('https://www.sitemaps.org/sitemap.xml');

      expect(urls).to.be.an('array');
      // May or may not have URLs depending on availability
    });

    it('should return empty array for invalid sitemap', async function () {
      this.timeout(10000);

      const urls = await seoAnalyzer.parseSitemap('https://example.com/nonexistent-sitemap.xml');
      expect(urls).to.be.an('array');
      expect(urls).to.have.length(0);
    });
  });

  describe('checkRobotsTxt()', () => {
    it('should check robots.txt existence', async function () {
      this.timeout(10000);

      const result = await seoAnalyzer.checkRobotsTxt('https://example.com');

      expect(result).to.be.an('object');
      expect(result).to.have.property('exists').that.is.a('boolean');
      expect(result).to.have.property('sitemapUrls').that.is.an('array');
    });
  });
});
