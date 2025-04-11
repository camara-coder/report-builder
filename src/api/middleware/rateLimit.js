const rateLimit = require('express-rate-limit');
const config = require('../../config');

// Create rate limiter
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = limiter; 