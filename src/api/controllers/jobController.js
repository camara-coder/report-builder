const jobService = require('../../services/jobService');
const logger = require('../../utils/logger');

class JobController {
  async getAllJobs(req, res, next) {
    try {
      const jobs = await jobService.getAllJobs(req.query);
      res.json(jobs);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await jobService.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async cancelJob(req, res, next) {
    try {
      const job = await jobService.cancelJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      next(error);
    }
  }

  async getJobResult(req, res, next) {
    try {
      const result = await jobService.getJobResult(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Job result not found' });
      }
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController(); 