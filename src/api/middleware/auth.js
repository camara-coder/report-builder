const config = require('../../config');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token or API key from request headers
 */
function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const apiKey = req.headers['x-api-key'];

    if (!token && !apiKey) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, config.auth.jwtSecret);
        req.user = decoded;
      } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } else if (apiKey) {
      if (apiKey !== config.auth.apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = auth; 