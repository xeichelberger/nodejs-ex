/**
 * Shopify Store Export Script
 *
 * Run this in the Claude Code window that has Shopify Admin API access.
 * It exports all store data needed for SEO/CRO/GEO review.
 *
 * Usage: node site-review/export.js
 *
 * Requires: SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN (or client credentials)
 * in .env or environment variables.
 */

const fs = require('fs');
const path = require('path');

// Try to load from the existing shopify service if available
let shopify;
try {
  shopify = require('../services/shopify');
} catch (e) {
  // Fallback: build a minimal client
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
  const axios = require('axios');

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!domain || !token) {
    console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ACCESS_TOKEN');
    process.exit(1);
  }

  const baseUrl = `https://${domain}/admin/api/2024-01`;
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

  shopify = {
    _request: async (method, url) => {
      const res = await axios({ method, url, headers, timeout: 30000 });
      return res.data;
    },
    getProducts: async (limit = 250) => {
      const res = await axios.get(`${baseUrl}/products.json?limit=${limit}&status=active`, { headers, timeout: 30000 });
      return res.data.products;
    },
    getPages: async () => {
      const res = await axios.get(`${baseUrl}/pages.json?limit=250`, { headers, timeout: 30000 });
      return res.data.pages;
    },
    baseUrl,
    headers,
  };
}

const OUTPUT_DIR = path.join(__dirname);

async function fetchJSON(endpoint) {
  const axios = require('axios');
  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'ashmi-co.myshopify.com';
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const baseUrl = `https://${domain}/admin/api/2024-01`;
  const headers = { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' };

  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
  const res = await axios.get(url, { headers, timeout: 30000 });
  return res.data;
}

function save(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`  Saved ${filepath} (${(JSON.stringify(data).length / 1024).toFixed(1)} KB)`);
}

function saveText(filepath, content) {
  const fullpath = path.join(OUTPUT_DIR, filepath);
  const dir = path.dirname(fullpath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullpath, content || '');
  console.log(`  Saved ${fullpath}`);
}

async function exportProducts() {
  console.log('\n1/8 Exporting products...');
  let allProducts = [];
  let url = '/products.json?limit=250&status=active';

  try {
    const data = await fetchJSON(url);
    allProducts = data.products || [];

    // Get metafields for each product (first 10 to avoid rate limits)
    for (let i = 0; i < Math.min(allProducts.length, 50); i++) {
      try {
        const mf = await fetchJSON(`/products/${allProducts[i].id}/metafields.json`);
        allProducts[i].metafields = mf.metafields || [];
      } catch (e) {
        allProducts[i].metafields = [];
      }
    }

    save('products.json', allProducts);
    console.log(`  Found ${allProducts.length} products`);
  } catch (err) {
    console.error('  Error:', err.message);
    save('products.json', []);
  }
}

async function exportCollections() {
  console.log('\n2/8 Exporting collections...');
  try {
    const [custom, smart] = await Promise.all([
      fetchJSON('/custom_collections.json?limit=250'),
      fetchJSON('/smart_collections.json?limit=250'),
    ]);

    const collections = {
      custom_collections: custom.custom_collections || [],
      smart_collections: smart.smart_collections || [],
    };

    save('collections.json', collections);
    console.log(`  Found ${collections.custom_collections.length} custom + ${collections.smart_collections.length} smart collections`);
  } catch (err) {
    console.error('  Error:', err.message);
    save('collections.json', { custom_collections: [], smart_collections: [] });
  }
}

async function exportPages() {
  console.log('\n3/8 Exporting pages...');
  try {
    const data = await fetchJSON('/pages.json?limit=250');
    save('pages.json', data.pages || []);
    console.log(`  Found ${(data.pages || []).length} pages`);
  } catch (err) {
    console.error('  Error:', err.message);
    save('pages.json', []);
  }
}

async function exportBlogs() {
  console.log('\n4/8 Exporting blogs & articles...');
  try {
    const blogData = await fetchJSON('/blogs.json');
    const blogs = blogData.blogs || [];

    for (const blog of blogs) {
      try {
        const articles = await fetchJSON(`/blogs/${blog.id}/articles.json?limit=250`);
        blog.articles = articles.articles || [];
      } catch (e) {
        blog.articles = [];
      }
    }

    save('blogs.json', blogs);
    console.log(`  Found ${blogs.length} blogs with ${blogs.reduce((s, b) => s + b.articles.length, 0)} total articles`);
  } catch (err) {
    console.error('  Error:', err.message);
    save('blogs.json', []);
  }
}

async function exportNavigation() {
  console.log('\n5/8 Exporting navigation menus...');
  try {
    // Navigation is under menus in newer API, or we get it from theme settings
    // Try the navigation endpoint first
    const data = await fetchJSON('/menus.json');
    save('navigation.json', data);
  } catch (err) {
    // Menus endpoint may not exist in REST API — try getting from theme
    try {
      console.log('  Menus endpoint unavailable, will extract from theme settings...');
      save('navigation.json', { note: 'Extract from theme settings_data.json or Liquid files' });
    } catch (e) {
      save('navigation.json', { error: err.message });
    }
  }
}

async function exportThemeFiles() {
  console.log('\n6/8 Exporting theme files...');
  try {
    const themes = await fetchJSON('/themes.json');
    const mainTheme = (themes.themes || []).find(t => t.role === 'main');

    if (!mainTheme) {
      console.error('  No main theme found');
      save('theme-info.json', themes.themes || []);
      return;
    }

    console.log(`  Main theme: "${mainTheme.name}" (ID: ${mainTheme.id})`);
    save('theme-info.json', mainTheme);

    // Key files to pull
    const keyFiles = [
      'layout/theme.liquid',
      'templates/index.json',
      'templates/index.liquid',
      'templates/product.json',
      'templates/product.liquid',
      'templates/collection.json',
      'templates/collection.liquid',
      'templates/page.json',
      'templates/page.liquid',
      'templates/article.json',
      'templates/article.liquid',
      'templates/blog.json',
      'templates/blog.liquid',
      'sections/header.liquid',
      'sections/footer.liquid',
      'sections/announcement-bar.liquid',
      'config/settings_data.json',
      'config/settings_schema.json',
      'snippets/seo.liquid',
      'snippets/schema.liquid',
      'snippets/json-ld.liquid',
      'snippets/meta-tags.liquid',
    ];

    // Get asset list to find homepage sections
    let assetList = [];
    try {
      const assets = await fetchJSON(`/themes/${mainTheme.id}/assets.json`);
      assetList = (assets.assets || []).map(a => a.key);
      save('theme-files/asset-list.json', assetList);
      console.log(`  Found ${assetList.length} total theme assets`);
    } catch (e) {
      console.log('  Could not list assets:', e.message);
    }

    // Add any section files we find
    const sectionFiles = assetList.filter(a => a.startsWith('sections/'));
    const snippetSEOFiles = assetList.filter(a =>
      a.startsWith('snippets/') &&
      (a.includes('seo') || a.includes('schema') || a.includes('json-ld') || a.includes('meta') || a.includes('structured'))
    );

    const allFiles = [...new Set([...keyFiles, ...sectionFiles, ...snippetSEOFiles])];

    for (const key of allFiles) {
      try {
        const asset = await fetchJSON(`/themes/${mainTheme.id}/assets.json?asset[key]=${encodeURIComponent(key)}`);
        if (asset.asset && asset.asset.value) {
          saveText(`theme-files/${key}`, asset.asset.value);
        }
      } catch (e) {
        // File doesn't exist, skip silently
      }
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}

async function exportRedirects() {
  console.log('\n7/8 Exporting redirects...');
  try {
    const data = await fetchJSON('/redirects.json?limit=250');
    save('redirects.json', data.redirects || []);
    console.log(`  Found ${(data.redirects || []).length} redirects`);
  } catch (err) {
    console.error('  Error:', err.message);
    save('redirects.json', []);
  }
}

async function exportStoreInfo() {
  console.log('\n8/8 Exporting store info...');
  try {
    const [shop, policies] = await Promise.all([
      fetchJSON('/shop.json'),
      fetchJSON('/policies.json').catch(() => ({ policies: [] })),
    ]);

    save('store-info.json', {
      shop: shop.shop || shop,
      policies: policies.policies || [],
    });
  } catch (err) {
    console.error('  Error:', err.message);
    save('store-info.json', { error: err.message });
  }
}

async function main() {
  console.log('=== Shopify Store Export for SEO/CRO Review ===');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(path.join(OUTPUT_DIR, 'theme-files'))) {
    fs.mkdirSync(path.join(OUTPUT_DIR, 'theme-files'), { recursive: true });
  }

  await exportProducts();
  await exportCollections();
  await exportPages();
  await exportBlogs();
  await exportNavigation();
  await exportThemeFiles();
  await exportRedirects();
  await exportStoreInfo();

  console.log('\n=== Export complete! ===');
  console.log(`All files saved to ${OUTPUT_DIR}`);
  console.log('The SEO review agent can now read these files.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
