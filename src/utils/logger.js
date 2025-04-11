const winston = require('winston');
const path = require('path');
const config = require('../config');

const { format } = winston;
const { combine, timestamp, json, prettyPrint, colorize, printf } = format;

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), config.logging.dir);
require('fs').mkdirSync(logsDir, { recursive: true });

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        consoleFormat
      )
    })
  ]
});

// Add file transport if enabled
if (config.logging.toFile) {
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: combine(
      timestamp(),
      json()
    )
  }));

  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    maxsize: config.logging.maxSize,
    maxFiles: config.logging.maxFiles,
    format: combine(
      timestamp(),
      json()
    )
  }));
}

// Add request logging middleware
logger.middleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request warning', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

module.exports = logger; 