const axios = require('axios');
const config = require('../config');

class ShopifyService {
  constructor() {
    this.baseUrl = null;
    this._accessToken = null;
    this._tokenExpiresAt = null;
    this._useClientCredentials = false;
    this._init();
  }

  _init() {
    const { storeDomain, accessToken, clientId, clientSecret } = config.shopify;
    if (!storeDomain) return;

    const domain = storeDomain.replace(/\/$/, '');
    this.baseUrl = `https://${domain}/admin/api/2024-01`;
    this._domain = domain;

    if (clientId && clientSecret) {
      // New Dev Dashboard flow: client credentials grant (tokens expire every 24h)
      this._useClientCredentials = true;
      this._clientId = clientId;
      this._clientSecret = clientSecret;
    } else if (accessToken) {
      // Legacy static token (shpat_)
      this._accessToken = accessToken;
    }
  }

  isConfigured() {
    if (!this.baseUrl) return false;
    return !!(this._accessToken || this._useClientCredentials);
  }

  async _ensureToken() {
    if (!this._useClientCredentials) return;

    // Refresh if no token or within 5 minutes of expiry
    const bufferMs = 5 * 60 * 1000;
    if (this._accessToken && this._tokenExpiresAt && Date.now() < this._tokenExpiresAt - bufferMs) {
      return;
    }

    const tokenUrl = `https://${this._domain}/admin/oauth/access_token`;
    const res = await axios.post(tokenUrl, new URLSearchParams({
      client_id: this._clientId,
      client_secret: this._clientSecret,
      grant_type: 'client_credentials',
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    this._accessToken = res.data.access_token;
    // Shopify client credentials tokens last 24h; set expiry with margin
    const expiresIn = res.data.expires_in || 86400;
    this._tokenExpiresAt = Date.now() + expiresIn * 1000;
    console.log('[Shopify] Access token refreshed, expires in', expiresIn, 'seconds');
  }

  // ==================== Products ====================

  async getProducts(limit = 50, pageInfo = null) {
    let url = `${this.baseUrl}/products.json?limit=${limit}`;
    if (pageInfo) url += `&page_info=${pageInfo}`;

    const res = await this._request('GET', url);
    return res.products;
  }

  async getProduct(productId) {
    const res = await this._request('GET', `${this.baseUrl}/products/${productId}.json`);
    return res.product;
  }

  async updateProduct(productId, data) {
    const res = await this._request('PUT', `${this.baseUrl}/products/${productId}.json`, {
      product: data,
    });
    return res.product;
  }

  /**
   * Update product SEO fields (title tag, meta description, URL handle)
   */
  async updateProductSEO(productId, { title_tag, body_html, meta_description, handle }) {
    const updates = {};
    if (title_tag !== undefined) updates.title = title_tag;
    if (body_html !== undefined) updates.body_html = body_html;
    if (handle !== undefined) updates.handle = handle;

    // Metafields for SEO
    const metafields = [];
    if (title_tag !== undefined) {
      metafields.push({
        namespace: 'global',
        key: 'title_tag',
        value: title_tag,
        type: 'single_line_text_field',
      });
    }
    if (meta_description !== undefined) {
      metafields.push({
        namespace: 'global',
        key: 'description_tag',
        value: meta_description,
        type: 'single_line_text_field',
      });
    }

    if (metafields.length > 0) updates.metafields = metafields;

    return this.updateProduct(productId, updates);
  }

  // ==================== Pages ====================

  async getPages(limit = 50) {
    const res = await this._request('GET', `${this.baseUrl}/pages.json?limit=${limit}`);
    return res.pages;
  }

  async createPage(title, bodyHtml, metafields = {}) {
    const page = {
      title,
      body_html: bodyHtml,
      published: false, // draft by default
    };

    if (metafields.title_tag || metafields.description_tag) {
      page.metafield = [];
      if (metafields.title_tag) {
        page.metafield.push({
          namespace: 'global',
          key: 'title_tag',
          value: metafields.title_tag,
          type: 'single_line_text_field',
        });
      }
      if (metafields.description_tag) {
        page.metafield.push({
          namespace: 'global',
          key: 'description_tag',
          value: metafields.description_tag,
          type: 'single_line_text_field',
        });
      }
    }

    const res = await this._request('POST', `${this.baseUrl}/pages.json`, { page });
    return res.page;
  }

  async updatePage(pageId, data) {
    const res = await this._request('PUT', `${this.baseUrl}/pages/${pageId}.json`, {
      page: data,
    });
    return res.page;
  }

  // ==================== Blog / Articles ====================

  async getBlogs() {
    const res = await this._request('GET', `${this.baseUrl}/blogs.json`);
    return res.blogs;
  }

  async getArticles(blogId, limit = 50) {
    const res = await this._request('GET', `${this.baseUrl}/blogs/${blogId}/articles.json?limit=${limit}`);
    return res.articles;
  }

  async createArticle(blogId, { title, body_html, tags, meta_description, image_url }) {
    const article = {
      title,
      body_html,
      tags: tags || '',
      published: false,
    };

    if (image_url) {
      article.image = { src: image_url };
    }

    const metafields = [];
    if (meta_description) {
      metafields.push({
        namespace: 'global',
        key: 'description_tag',
        value: meta_description,
        type: 'single_line_text_field',
      });
    }
    if (metafields.length > 0) article.metafields = metafields;

    const res = await this._request('POST', `${this.baseUrl}/blogs/${blogId}/articles.json`, { article });
    return res.article;
  }

  async updateArticle(blogId, articleId, data) {
    const res = await this._request('PUT', `${this.baseUrl}/blogs/${blogId}/articles/${articleId}.json`, {
      article: data,
    });
    return res.article;
  }

  // ==================== Redirects ====================

  async getRedirects(limit = 50) {
    const res = await this._request('GET', `${this.baseUrl}/redirects.json?limit=${limit}`);
    return res.redirects;
  }

  async createRedirect(fromPath, toPath) {
    const res = await this._request('POST', `${this.baseUrl}/redirects.json`, {
      redirect: { path: fromPath, target: toPath },
    });
    return res.redirect;
  }

  // ==================== Metafields ====================

  async getMetafields(resourceType, resourceId) {
    const res = await this._request('GET', `${this.baseUrl}/${resourceType}/${resourceId}/metafields.json`);
    return res.metafields;
  }

  // ==================== Themes (for sitemap/robots) ====================

  async getThemes() {
    const res = await this._request('GET', `${this.baseUrl}/themes.json`);
    return res.themes;
  }

  // ==================== Helpers ====================

  /**
   * Get all products with their SEO data for audit
   */
  async auditProductSEO() {
    const products = await this.getProducts(250);
    return products.map(p => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      url: `/products/${p.handle}`,
      body_html_length: (p.body_html || '').length,
      has_description: !!(p.body_html && p.body_html.length > 50),
      image_count: (p.images || []).length,
      images_without_alt: (p.images || []).filter(i => !i.alt || i.alt.trim() === '').length,
      variant_count: (p.variants || []).length,
      tags: p.tags,
      seo_issues: this._checkProductSEO(p),
    }));
  }

  _checkProductSEO(product) {
    const issues = [];

    if (!product.body_html || product.body_html.length < 100) {
      issues.push({ severity: 'warning', message: 'Product description too short or missing' });
    }

    if ((product.images || []).length === 0) {
      issues.push({ severity: 'warning', message: 'No product images' });
    }

    const noAltImages = (product.images || []).filter(i => !i.alt || i.alt.trim() === '');
    if (noAltImages.length > 0) {
      issues.push({ severity: 'warning', message: `${noAltImages.length} images missing alt text` });
    }

    if (!product.title || product.title.length > 70) {
      issues.push({ severity: 'info', message: 'Product title may be too long for search results' });
    }

    return issues;
  }

  async _request(method, url, data = null) {
    if (!this.isConfigured()) {
      throw new Error('Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and either SHOPIFY_ACCESS_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET.');
    }

    // Ensure we have a valid token (refreshes if using client credentials and expired)
    await this._ensureToken();

    const options = {
      method,
      url,
      headers: {
        'X-Shopify-Access-Token': this._accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    };

    if (data) options.data = data;

    const response = await axios(options);
    return response.data;
  }
}

module.exports = new ShopifyService();
