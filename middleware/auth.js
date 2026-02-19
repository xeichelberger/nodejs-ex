const config = require('../config');

/**
 * Simple API key authentication middleware.
 * Checks for API key in header: X-API-Key or query param: ?api_key=...
 */
function requireAuth(req, res, next) {
  // Skip auth in development if no API key is set
  if (!config.apiKey) {
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized. Provide a valid API key via X-API-Key header.' });
  }

  next();
}

module.exports = { requireAuth };
