/**
 * Authentication middleware — disabled for development.
 * Re-enable API key checks for production deployment.
 */
function requireAuth(req, res, next) {
  return next();
}

module.exports = { requireAuth };
