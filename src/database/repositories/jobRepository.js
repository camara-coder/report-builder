const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../connection');
const logger = require('../../utils/logger');
const config = require('../../config');

/**
 * Repository for job operations
 */
const jobRepository = {
  /**
   * Find all jobs with pagination and filtering
   */
  async findAll(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status,
        type,
        sort = { createdAt: -1 }
      } = options;

      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');

      const query = {};
      
      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const skip = (page - 1) * limit;
      const cursor = collection.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const jobs = await cursor.toArray();
      const total = await collection.countDocuments(query);

      return {
        jobs,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in jobRepository.findAll', { options, error: error.message });
      throw error;
    }
  },

  /**
   * Find a job by ID
   */
  async findById(id) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      return await collection.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      logger.error('Error in jobRepository.findById', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Create a new job
   */
  async create(jobData) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const job = {
        ...jobData,
        status: 'pending',
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(job);
      return { ...job, _id: result.insertedId };
    } catch (error) {
      logger.error('Error in jobRepository.create', { jobData, error: error.message });
      throw error;
    }
  },

  /**
   * Claim the next job for processing
   */
  async claimNextJob() {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const result = await collection.findOneAndUpdate(
        { 
          status: 'pending',
          $or: [
            { scheduledFor: { $exists: false } },
            { scheduledFor: { $lte: new Date() } }
          ]
        },
        { 
          $set: { 
            status: 'processing',
            startedAt: new Date(),
            updatedAt: new Date()
          }
        },
        { 
          sort: { priority: -1, createdAt: 1 },
          returnDocument: 'after'
        }
      );

      return result.value;
    } catch (error) {
      logger.error('Error in jobRepository.claimNextJob', { error: error.message });
      throw error;
    }
  },

  /**
   * Update job progress
   */
  async updateProgress(id, progress) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            progress,
            updatedAt: new Date()
          }
        },
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Error in jobRepository.updateProgress', { id, progress, error: error.message });
      throw error;
    }
  },

  /**
   * Complete a job
   */
  async completeJob(id, result) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const update = {
        $set: {
          status: 'completed',
          result,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      };

      const job = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        update,
        { returnDocument: 'after' }
      );

      return job.value;
    } catch (error) {
      logger.error('Error in jobRepository.completeJob', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Fail a job
   */
  async failJob(id, errorMessage) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const update = {
        $set: {
          status: 'failed',
          error: errorMessage,
          failedAt: new Date(),
          updatedAt: new Date()
        }
      };

      const job = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        update,
        { returnDocument: 'after' }
      );

      return job.value;
    } catch (error) {
      logger.error('Error in jobRepository.failJob', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Schedule a job for retry
   */
  async scheduleRetry(id) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const job = await this.findById(id);
      if (!job) {
        throw new Error('Job not found');
      }

      const retryDelay = Math.min(
        config.jobWorker.retryDelay * Math.pow(2, job.retryCount),
        config.jobWorker.maxRetryDelay
      );

      const update = {
        $set: {
          status: 'pending',
          retryCount: job.retryCount + 1,
          scheduledFor: new Date(Date.now() + retryDelay),
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
      logger.error('Error in jobRepository.scheduleRetry', { id, error: error.message });
      throw error;
    }
  },

  /**
   * Update job status
   */
  async updateStatus(id, status, additionalData = {}) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const update = {
        $set: {
          status,
          updatedAt: new Date(),
          ...additionalData
        }
      };

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        update,
        { returnDocument: 'after' }
      );

      return result.value;
    } catch (error) {
      logger.error('Error in jobRepository.updateStatus', { id, status, error: error.message });
      throw error;
    }
  },

  /**
   * Delete old jobs
   */
  async deleteOldJobs(thresholdDate) {
    try {
      const client = await connectToDatabase();
      const collection = client.db(config.mongodb.database).collection('jobs');
      
      const result = await collection.deleteMany({
        $or: [
          { status: 'completed', completedAt: { $lt: thresholdDate } },
          { status: 'failed', failedAt: { $lt: thresholdDate } },
          { status: 'cancelled', updatedAt: { $lt: thresholdDate } }
        ]
      });

      return result.deletedCount;
    } catch (error) {
      logger.error('Error in jobRepository.deleteOldJobs', { thresholdDate, error: error.message });
      throw error;
    }
  }
};

module.exports = jobRepository; 