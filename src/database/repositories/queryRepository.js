const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../connection');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Repository for query operations
 */
const queryRepository = {
  /**
   * Find all queries with pagination and filtering
   */
  async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        tags,
        search,
        sort = { createdAt: -1 }
      } = options;

      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('queries');

      const query = {};
      
      if (tags) {
        query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const cursor = collection.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const queries = await cursor.toArray();
      const total = await collection.countDocuments(query);

      return {
        queries,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in queryRepository.findAll', { options, error: error.message });
      throw error;
    }
  },

  /**
   * Find a query by ID
   */
  async findById(id) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('queries');
      
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      logger.error('Error in queryRepository.findById', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new query
   */
  async create(queryData) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('queries');
      
      const query = {
        ...queryData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(query);
      return { ...query, _id: result.insertedId };
    } catch (error) {
      logger.error('Error in queryRepository.create', { queryData, error: error.message });
      throw error;
    }
  },

  /**
   * Update a query
   */
  async update(id, updateData) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('queries');
      
      const update = {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        update,
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Error in queryRepository.update', { id, updateData, error: error.message });
      throw error;
    }
  },

  /**
   * Delete a query
   */
  async delete(id) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('queries');
      
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error in queryRepository.delete', { id, error: error.message });
      throw error;
    }
  }
};

module.exports = queryRepository; 