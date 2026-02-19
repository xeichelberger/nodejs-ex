const config = require('../config');

/**
 * Parse a cookie value from the raw Cookie header.
 */
function getCookie(req, name) {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Simple API key authentication middleware.
 * Checks for API key in header: X-API-Key, query param: ?api_key=...,
 * or session cookie (set when the dashboard loads).
 */
function requireAuth(req, res, next) {
  // Skip auth in development if no API key is set
  if (!config.apiKey) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key || getCookie(req, '_seo_auth');

  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized. Provide a valid API key via X-API-Key header.' });
  }

  next();
}

module.exports = { requireAuth };
