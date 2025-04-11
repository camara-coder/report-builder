const path = require('path');

/**
 * Application configuration
 */
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    shutdownTimeout: parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '10000', 10)
  },

  // MongoDB configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    database: process.env.MONGODB_DATABASE || 'query_manager',
    useTLS: process.env.MONGODB_USE_TLS === 'true',
    tlsAllowInvalidCertificates: process.env.MONGODB_TLS_ALLOW_INVALID_CERTIFICATES === 'true',
    tlsAllowInvalidHostnames: process.env.MONGODB_TLS_ALLOW_INVALID_HOSTNAMES === 'true',
    user: process.env.MONGODB_USER || '',
    password: process.env.MONGODB_PASSWORD || '',
    authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
    maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5', 10),
    maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '60000', 10),
    connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000', 10),
    socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000', 10)
  },

  // Authentication configuration
  auth: {
    enabled: process.env.AUTH_ENABLED === 'true',
    apiKey: process.env.API_KEY || 'your-secure-api-key-here',
    tokenExpiration: parseInt(process.env.TOKEN_EXPIRATION || '3600', 10)
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 86400
  },

  // Query configuration
  query: {
    enabledOperations: (process.env.ENABLED_QUERY_OPERATIONS || 'find,aggregate,count,distinct').split(','),
    enableParallelQueries: process.env.ENABLE_PARALLEL_QUERIES === 'true',
    defaultBatchSize: parseInt(process.env.DEFAULT_BATCH_SIZE || '100', 10),
    maxQueryLimit: parseInt(process.env.MAX_QUERY_LIMIT || '10000', 10),
    queryTimeout: parseInt(process.env.QUERY_TIMEOUT_MS || '30000', 10)
  },

  // Report configuration
  report: {
    outputDir: process.env.REPORT_OUTPUT_DIR || 'reports',
    formats: (process.env.REPORT_FORMATS || 'json,csv,html').split(','),
    publicPath: process.env.REPORT_PUBLIC_PATH || '/reports',
    maxAgeDays: parseInt(process.env.REPORT_MAX_AGE_DAYS || '30', 10)
  },

  // Job worker configuration
  jobWorker: {
    enabled: process.env.JOB_WORKER_ENABLED === 'true',
    pollingInterval: parseInt(process.env.JOB_WORKER_POLLING_INTERVAL || '5000', 10),
    concurrency: parseInt(process.env.JOB_WORKER_CONCURRENCY || '5', 10),
    maxRetries: parseInt(process.env.JOB_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.JOB_RETRY_DELAY || '5000', 10),
    maxRetryDelay: parseInt(process.env.JOB_MAX_RETRY_DELAY || '300000', 10),
    retentionPeriod: parseInt(process.env.JOB_RETENTION_PERIOD || '604800', 10)
  },

  // Rate limiting configuration
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    toFile: process.env.LOG_TO_FILE === 'true',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '7', 10),
    format: process.env.LOG_FORMAT || 'json'
  }
};

module.exports = config; 