const jobRepository = require('../database/repositories/jobRepository');
const queryService = require('./queryService');
const reportService = require('./reportService');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Service for managing asynchronous jobs
 */
const jobService = {
  /**
   * Get all jobs with pagination and filtering
   */
  async getAllJobs(options = {}) {
    return jobRepository.findAll(options);
  },

  /**
   * Get a job by ID
   */
  async getJobById(id) {
    return jobRepository.findById(id);
  },

  /**
   * Create a new job
   */
  async createJob(jobData) {
    const job = await jobRepository.create({
      ...jobData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Start processing if worker is enabled
    if (config.jobWorker.enabled) {
      this._processNextJob().catch(error => {
        logger.error('Error processing next job:', error);
      });
    }

    return job;
  },

  /**
   * Cancel a job
   */
  async cancelJob(id) {
    return jobRepository.updateStatus(id, 'cancelled');
  },

  /**
   * Get job result
   */
  async getJobResult(id) {
    const job = await this.getJobById(id);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'completed') {
      return job.result;
    }

    if (job.status === 'failed') {
      throw new Error(job.error);
    }

    return null;
  },

  /**
   * Process next job in queue
   */
  async processNextJob() {
    const job = await jobRepository.claimNextJob();
    if (!job) {
      return;
    }

    try {
      await jobRepository.updateStatus(job._id, 'processing');

      let result;
      switch (job.type) {
        case 'query':
          result = await queryService.executeQuery(job.queryId, job.parameters);
          break;
        case 'report':
          result = await reportService.generateReport(job.reportId, job.parameters);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      await jobRepository.completeJob(job._id, result);
    } catch (error) {
      logger.error('Job processing error:', error);
      await jobRepository.failJob(job._id, error.message);

      // Schedule retry if max retries not reached
      if (job.retryCount < config.jobWorker.maxRetries) {
        await jobRepository.scheduleRetry(job._id);
      }
    } finally {
      // Process next job
      this._processNextJob().catch(error => {
        logger.error('Error processing next job:', error);
      });
    }
  },

  /**
   * Cleanup old jobs
   */
  async cleanupJobs() {
    const thresholdDate = new Date();
    thresholdDate.setSeconds(thresholdDate.getSeconds() - config.jobWorker.retentionPeriod);

    await jobRepository.deleteOldJobs(thresholdDate);
  }
};

module.exports = jobService; 