const jobService = require('../services/jobService');
const logger = require('../utils/logger');
const config = require('../config');

// Store for worker state
let workerRunning = false;
let workerInterval = null;

/**
 * Start the job worker
 */
function startJobWorker() {
  if (workerRunning) {
    logger.warn('Job worker is already running');
    return;
  }

  if (!config.jobWorker.enabled) {
    logger.info('Job worker is disabled');
    return;
  }

  workerRunning = true;
  logger.info('Starting job worker');

  // Process jobs immediately
  processJobs().catch(error => {
    logger.error('Error in initial job processing', { error: error.message });
  });

  // Set up interval for processing jobs
  workerInterval = setInterval(() => {
    processJobs().catch(error => {
      logger.error('Error in job processing', { error: error.message });
    });
  }, config.jobWorker.pollingInterval);
}

/**
 * Stop the job worker
 */
async function stopJobWorker() {
  if (!workerRunning) {
    logger.warn('Job worker is not running');
    return;
  }

  workerRunning = false;
  logger.info('Stopping job worker');

  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }

  // Wait for any in-progress jobs to complete
  await new Promise(resolve => setTimeout(resolve, config.jobWorker.pollingInterval));
}

/**
 * Process jobs
 */
async function processJobs() {
  if (!workerRunning) {
    return;
  }

  try {
    // Process jobs up to concurrency limit
    const jobs = [];
    for (let i = 0; i < config.jobWorker.concurrency; i++) {
      jobs.push(processJob());
    }

    await Promise.all(jobs);
  } catch (error) {
    logger.error('Error in job processing', { error: error.message });
  }
}

/**
 * Process a single job
 */
async function processJob() {
  try {
    await jobService.processNextJob();
  } catch (error) {
    logger.error('Error processing job', { error: error.message });
  }
}

/**
 * Cleanup old jobs
 */
async function cleanupJobs() {
  try {
    const thresholdDate = new Date();
    thresholdDate.setSeconds(thresholdDate.getSeconds() - config.jobWorker.retentionPeriod);

    const deletedCount = await jobService.cleanupJobs(thresholdDate);
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old jobs`);
    }
  } catch (error) {
    logger.error('Error cleaning up jobs', { error: error.message });
  }
}

module.exports = {
  startJobWorker,
  stopJobWorker,
  cleanupJobs
}; 