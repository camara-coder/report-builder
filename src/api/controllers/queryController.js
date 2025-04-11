const queryService = require('../../services/queryService');
const jobService = require('../../services/jobService');
const logger = require('../../utils/logger');

class QueryController {
  async getAllQueries(req, res, next) {
    try {
      const queries = await queryService.getAllQueries(req.query);
      res.json(queries);
    } catch (error) {
      next(error);
    }
  }

  async getQueryById(req, res, next) {
    try {
      const query = await queryService.getQueryById(req.params.id);
      if (!query) {
        return res.status(404).json({ error: 'Query not found' });
      }
      res.json(query);
    } catch (error) {
      next(error);
    }
  }

  async createQuery(req, res, next) {
    try {
      const query = await queryService.createQuery(req.body);
      res.status(201).json(query);
    } catch (error) {
      next(error);
    }
  }

  async updateQuery(req, res, next) {
    try {
      const query = await queryService.updateQuery(req.params.id, req.body);
      if (!query) {
        return res.status(404).json({ error: 'Query not found' });
      }
      res.json(query);
    } catch (error) {
      next(error);
    }
  }

  async deleteQuery(req, res, next) {
    try {
      const result = await queryService.deleteQuery(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Query not found' });
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async executeQuery(req, res, next) {
    try {
      const result = await queryService.executeQuery(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async executeBatchQueries(req, res, next) {
    try {
      const results = await queryService.executeBatchQueries(req.body.queries, req.body.options);
      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  async executeQueryAsync(req, res, next) {
    try {
      const job = await jobService.createJob({
        type: 'query',
        queryId: req.params.id,
        parameters: req.body
      });
      res.status(202).json({ jobId: job._id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QueryController(); 