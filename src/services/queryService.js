const { connectToDatabase } = require('../database/connection');
const logger = require('../utils/logger');
const config = require('../config');
const queryRepository = require('../database/repositories/queryRepository');

/**
 * Service for managing and executing queries
 */
const queryService = {
  /**
   * Get all queries with pagination and filtering
   */
  async getAllQueries(options = {}) {
    return queryRepository.findAll(options);
  },

  /**
   * Get a query by ID
   */
  async getQueryById(id) {
    return queryRepository.findById(id);
  },

  /**
   * Create a new query
   */
  async createQuery(queryData) {
    return queryRepository.create(queryData);
  },

  /**
   * Update an existing query
   */
  async updateQuery(id, queryData) {
    return queryRepository.update(id, queryData);
  },

  /**
   * Delete a query
   */
  async deleteQuery(id) {
    return queryRepository.delete(id);
  },

  /**
   * Execute a query with parameters
   */
  async executeQuery(id, parameters = {}, options = {}) {
    const query = await this.getQueryById(id);
    if (!query) {
      throw new Error('Query not found');
    }

    const client = await connectToDatabase();
    try {
      const preparedQuery = this._prepareQueryWithParameters(query, parameters);
      const result = await this._executeSingleQuery(client, preparedQuery);
      return result;
    } finally {
      await client.close();
    }
  },

  /**
   * Execute multiple queries in parallel or sequence
   */
  async executeBatchQueries(queries, options = {}) {
    const client = await connectToDatabase();
    try {
      const results = [];
      for (const query of queries) {
        const result = await this._executeSingleQuery(client, query);
        results.push(result);
      }
      return results;
    } finally {
      await client.close();
    }
  },

  /**
   * Execute a single query
   */
  async _executeSingleQuery(client, query) {
    const collection = client.db(config.mongodb.database).collection(query.collection);
    
    switch (query.type) {
      case 'find':
        return this._executeFindQuery(collection, query.query, query.options);
      case 'aggregate':
        return this._executeAggregateQuery(collection, query.query, query.options);
      case 'count':
        return this._executeCountQuery(collection, query.query, query.options);
      case 'distinct':
        return this._executeDistinctQuery(collection, query.query, query.options);
      default:
        throw new Error(`Unsupported query type: ${query.type}`);
    }
  },

  /**
   * Prepare query with parameters
   */
  _prepareQueryWithParameters(queryDef, parameters) {
    const query = { ...queryDef };
    
    // Replace parameter placeholders in query
    if (queryDef.parameters) {
      for (const param of queryDef.parameters) {
        const value = parameters[param.name] ?? param.default;
        if (param.required && value === undefined) {
          throw new Error(`Missing required parameter: ${param.name}`);
        }
        
        // Replace parameter in query string
        const queryStr = JSON.stringify(query.query);
        const regex = new RegExp(`\\$${param.name}`, 'g');
        query.query = JSON.parse(queryStr.replace(regex, JSON.stringify(value)));
      }
    }
    
    return query;
  },

  /**
   * Execute find query
   */
  async _executeFindQuery(collection, query, options) {
    return collection.find(query, options).toArray();
  },

  /**
   * Execute aggregate query
   */
  async _executeAggregateQuery(collection, pipeline, options) {
    return collection.aggregate(pipeline, options).toArray();
  },

  /**
   * Execute count query
   */
  async _executeCountQuery(collection, query, options) {
    return collection.countDocuments(query, options);
  },

  /**
   * Execute distinct query
   */
  async _executeDistinctQuery(collection, query, options) {
    return collection.distinct(query.field, query.query, options);
  }
};

module.exports = queryService; 