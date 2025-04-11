const express = require('express');
const queryController = require('../controllers/queryController');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const validateQuery = require('../middleware/validation').validateQuery;
const validateParams = require('../middleware/validation').validateParams;

const router = express.Router();

// Apply authentication if enabled
const authMiddleware = require('../../config').auth.enabled ? auth : (req, res, next) => next();

// Apply rate limiting if enabled
const rateLimitMiddleware = require('../../config').rateLimit.enabled ? rateLimit : (req, res, next) => next();

// Routes for query operations
router.get('/', authMiddleware, rateLimitMiddleware, queryController.getAllQueries);
router.get('/:id', authMiddleware, rateLimitMiddleware, queryController.getQueryById);
router.post('/', authMiddleware, rateLimitMiddleware, validateQuery, queryController.createQuery);
router.put('/:id', authMiddleware, rateLimitMiddleware, validateQuery, queryController.updateQuery);
router.delete('/:id', authMiddleware, rateLimitMiddleware, queryController.deleteQuery);
router.post('/:id/execute', authMiddleware, rateLimitMiddleware, validateParams, queryController.executeQuery);
router.post('/batch/execute', authMiddleware, rateLimitMiddleware, validateParams, queryController.executeBatchQueries);
router.post('/:id/execute/async', authMiddleware, rateLimitMiddleware, validateParams, queryController.executeQueryAsync);

module.exports = router; 