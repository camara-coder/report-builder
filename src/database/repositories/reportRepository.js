const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../connection');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Repository for report operations
 */
const reportRepository = {
  /**
   * Find all reports with pagination and filtering
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
      const collection = client.db(config.mongodb.database).collection('reports');

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

      const reports = await cursor.toArray();
      const total = await collection.countDocuments(query);

      return {
        reports,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in reportRepository.findAll', { options, error: error.message });
      throw error;
    }
  },

  /**
   * Find a report by ID
   */
  async findById(id) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('reports');
      
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      logger.error('Error in reportRepository.findById', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new report
   */
  async create(reportData) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('reports');
      
      const report = {
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(report);
      return { ...report, _id: result.insertedId };
    } catch (error) {
      logger.error('Error in reportRepository.create', { reportData, error: error.message });
      throw error;
    }
  },

  /**
   * Update a report
   */
  async update(id, updateData) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('reports');
      
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
      logger.error('Error in reportRepository.update', { id, updateData, error: error.message });
      throw error;
    }
  },

  /**
   * Delete a report
   */
  async delete(id) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('reports');
      
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Error in reportRepository.delete', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Add a generation record to a report
   */
  async addGenerationRecord(id, recordData) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('reports');
      
      const record = {
        ...recordData,
        timestamp: new Date()
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
          $push: { generationRecords: record },
          $set: { updatedAt: new Date() }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Error in reportRepository.addGenerationRecord', { id, recordData, error: error.message });
      throw error;
    }
  },

  /**
   * Get the latest generation record for a report
   */
  async getLatestGenerationRecord(id, format) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('reports');
      
      const query = { _id: new ObjectId(id) };
      if (format) {
        query['generationRecords.format'] = format;
      }

      const report = await collection.findOne(query, {
        projection: {
          generationRecords: {
            $filter: {
              input: '$generationRecords',
              as: 'record',
              cond: format ? { $eq: ['$$record.format', format] } : true
            }
          }
        }
      });

      if (!report || !report.generationRecords || report.generationRecords.length === 0) {
        return null;
      }

      return report.generationRecords[report.generationRecords.length - 1];
    } catch (error) {
      logger.error('Error in reportRepository.getLatestGenerationRecord', { id, format, error: error.message });
      throw error;
    }
  }
};

module.exports = reportRepository; 