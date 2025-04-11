const { MongoClient } = require('mongodb');
const logger = require('../utils/logger');
const config = require('../config');

let client = null;

/**
 * Connect to MongoDB database
 */
async function connectToDatabase() {
  if (client && client.isConnected()) {
    return client;
  }

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: config.mongodb.maxPoolSize,
      minPoolSize: config.mongodb.minPoolSize,
      maxIdleTimeMS: config.mongodb.maxIdleTimeMS,
      connectTimeoutMS: config.mongodb.connectTimeoutMS,
      socketTimeoutMS: config.mongodb.socketTimeoutMS
    };

    if (config.mongodb.useTLS) {
      options.tls = true;
      options.tlsAllowInvalidCertificates = config.mongodb.tlsAllowInvalidCertificates;
      options.tlsAllowInvalidHostnames = config.mongodb.tlsAllowInvalidHostnames;
    }

    if (config.mongodb.user && config.mongodb.password) {
      options.auth = {
        user: config.mongodb.user,
        password: config.mongodb.password,
        authSource: config.mongodb.authSource
      };
    }

    client = new MongoClient(config.mongodb.uri, options);
    await client.connect();

    logger.info('Connected to MongoDB database');
    return client;
  } catch (error) {
    logger.error('Error connecting to MongoDB database', { error: error.message });
    throw error;
  }
}

/**
 * Close MongoDB connection
 */
async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
      client = null;
      logger.info('Closed MongoDB database connection');
    } catch (error) {
      logger.error('Error closing MongoDB database connection', { error: error.message });
      throw error;
    }
  }
}

module.exports = {
  connectToDatabase,
  closeDatabaseConnection
}; 