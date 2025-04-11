const express = require('express');
const reportController = require('../controllers/reportController');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');
const validateReport = require('../middleware/validation').validateReport;
const validateParams = require('../middleware/validation').validateParams;

const router = express.Router();

// Apply authentication if enabled
const authMiddleware = require('../../config').auth.enabled ? auth : (req, res, next) => next();

// Apply rate limiting if enabled
const rateLimitMiddleware = require('../../config').rateLimit.enabled ? rateLimit : (req, res, next) => next();

// Routes for report operations
router.get('/', authMiddleware, rateLimitMiddleware, reportController.getAllReports);
router.get('/:id', authMiddleware, rateLimitMiddleware, reportController.getReportById);
router.post('/', authMiddleware, rateLimitMiddleware, validateReport, reportController.createReport);
router.put('/:id', authMiddleware, rateLimitMiddleware, validateReport, reportController.updateReport);
router.delete('/:id', authMiddleware, rateLimitMiddleware, reportController.deleteReport);
router.post('/:id/generate', authMiddleware, rateLimitMiddleware, validateParams, reportController.generateReport);
router.post('/:id/generate/async', authMiddleware, rateLimitMiddleware, validateParams, reportController.generateReportAsync);
router.get('/:id/download/:format', authMiddleware, rateLimitMiddleware, reportController.downloadReport);

module.exports = router; 