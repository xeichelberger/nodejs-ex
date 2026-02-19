const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const router = express.Router();

const SCOPES = [
  'read_products',
  'write_products',
  'read_content',
  'write_content',
  'read_themes',
  'read_script_tags',
  'write_script_tags',
].join(',');

/**
 * GET /auth/shopify
 * Starts the OAuth flow — redirects the store owner to Shopify to approve.
 */
router.get('/shopify', (req, res) => {
  const { clientId, storeDomain } = config.shopify;
  if (!clientId || !storeDomain) {
    return res.status(400).send(
      'Missing SHOPIFY_CLIENT_ID or SHOPIFY_STORE_DOMAIN in .env'
    );
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  // Store nonce in memory (fine for one-time install)
  router._oauthNonce = nonce;

  const redirectUri = `${_callbackBase(req)}/auth/shopify/callback`;
  const domain = storeDomain.replace(/\/$/, '');
  const installUrl =
    `https://${domain}/admin/oauth/authorize` +
    `?client_id=${clientId}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${nonce}`;

  console.log('[Shopify OAuth] Redirecting to:', installUrl);
  res.redirect(installUrl);
});

/**
 * GET /auth/shopify/callback
 * Shopify redirects here with ?code=…&state=…&hmac=…
 * We exchange the code for a permanent access token.
 */
router.get('/shopify/callback', async (req, res) => {
  try {
    const { code, state, hmac, shop } = req.query;
    const { clientId, clientSecret, storeDomain } = config.shopify;

    // Verify state/nonce
    if (!router._oauthNonce || state !== router._oauthNonce) {
      return res.status(403).send('Invalid state parameter. Try starting over at /auth/shopify');
    }
    router._oauthNonce = null;

    // Verify HMAC
    if (hmac && clientSecret) {
      const params = { ...req.query };
      delete params.hmac;
      const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
      const computed = crypto.createHmac('sha256', clientSecret).update(sorted).digest('hex');
      if (computed !== hmac) {
        return res.status(403).send('HMAC validation failed');
      }
    }

    // Exchange code for permanent access token
    const domain = (shop || storeDomain).replace(/\/$/, '');
    const tokenRes = await axios.post(`https://${domain}/admin/oauth/access_token`, {
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }, { timeout: 15000 });

    const accessToken = tokenRes.data.access_token;
    console.log('[Shopify OAuth] Got access token:', accessToken.slice(0, 8) + '...');

    // Persist token to .env
    _saveTokenToEnv(accessToken);

    // Hot-reload into the running shopify service
    const shopifyService = require('../services/shopify');
    shopifyService._accessToken = accessToken;
    shopifyService._useClientCredentials = false;

    res.send(`
      <html><body style="font-family:sans-serif;max-width:600px;margin:40px auto;text-align:center;">
        <h1>Shopify Connected!</h1>
        <p>Access token saved to <code>.env</code>.</p>
        <p>Token: <code>${accessToken.slice(0, 8)}…</code></p>
        <p>You can now close this tab and use the SEO Bot.</p>
        <a href="/">Go to Dashboard</a>
      </body></html>
    `);
  } catch (err) {
    console.error('[Shopify OAuth] Error:', err.response?.data || err.message);
    res.status(500).send(`OAuth error: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
  }
});

/** Build the base URL for the callback (handles localhost vs deployed). */
function _callbackBase(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

/** Append or replace SHOPIFY_ACCESS_TOKEN in .env */
function _saveTokenToEnv(token) {
  const envPath = path.join(__dirname, '..', '.env');
  try {
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf-8');
    }

    if (content.match(/^SHOPIFY_ACCESS_TOKEN=/m)) {
      content = content.replace(/^SHOPIFY_ACCESS_TOKEN=.*$/m, `SHOPIFY_ACCESS_TOKEN=${token}`);
    } else {
      content += `\nSHOPIFY_ACCESS_TOKEN=${token}\n`;
    }

    fs.writeFileSync(envPath, content, 'utf-8');
    console.log('[Shopify OAuth] Token saved to .env');
  } catch (err) {
    console.error('[Shopify OAuth] Could not write .env:', err.message);
    console.log('[Shopify OAuth] Manually set: SHOPIFY_ACCESS_TOKEN=' + token);
  }
}

module.exports = router;
