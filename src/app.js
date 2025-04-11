const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { connectToDatabase, closeDatabaseConnection } = require('./database/connection');
const { startJobWorker, stopJobWorker } = require('./workers/jobWorker');
const logger = require('./utils/logger');
const config = require('./config');

// Import routes
const queryRoutes = require('./api/routes/queryRoutes');
const reportRoutes = require('./api/routes/reportRoutes');
const jobRoutes = require('./api/routes/jobRoutes');

// Import middleware
const auth = require('./api/middleware/auth');
const validation = require('./api/middleware/validation');
const rateLimit = require('./api/middleware/rateLimit');
const errorHandler = require('./api/middleware/errorHandler');

// Create Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger.middleware);

// Apply rate limiting if enabled
if (config.rateLimit.enabled) {
  app.use(rateLimit);
}

// Apply authentication if enabled
if (config.auth.enabled) {
  app.use(auth);
}

// Apply validation middleware
app.use(validation);

// Register routes
app.use('/api/queries', queryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/jobs', jobRoutes);

// Apply error handling middleware
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectToDatabase();

    // Start job worker
    startJobWorker();

    // Start server
    const server = app.listen(config.server.port, () => {
      logger.info(`Server listening on port ${config.server.port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    async function gracefulShutdown() {
      logger.info('Received shutdown signal, initiating graceful shutdown');

      // Stop accepting new connections
      server.close(() => {
        logger.info('Server stopped accepting new connections');
      });

      // Stop job worker
      await stopJobWorker();

      // Close database connection
      await closeDatabaseConnection();

      // Force shutdown after timeout
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, config.server.shutdownTimeout);

      // Exit process
      process.exit(0);
    }
  } catch (error) {
    logger.error('Error starting server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  logger.error('Fatal error during server startup', { error: error.message });
  process.exit(1);
}); 