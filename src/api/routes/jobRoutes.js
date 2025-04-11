const express = require('express');
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

// Apply authentication if enabled
const authMiddleware = require('../../config').auth.enabled ? auth : (req, res, next) => next();

// Routes for job operations
router.get('/', authMiddleware, jobController.getAllJobs);
router.get('/:id', authMiddleware, jobController.getJobById);
router.post('/:id/cancel', authMiddleware, jobController.cancelJob);
router.get('/:id/result', authMiddleware, jobController.getJobResult);

module.exports = router; 