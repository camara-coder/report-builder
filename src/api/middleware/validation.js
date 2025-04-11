const Joi = require('joi');
const config = require('../../config');
const logger = require('../../utils/logger');

// Schema for query parameters validation
const querySchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  collection: Joi.string().required(),
  type: Joi.string().valid('find', 'aggregate', 'count', 'distinct').required(),
  query: Joi.object().required(),
  options: Joi.object(),
  parameters: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      type: Joi.string().valid('string', 'number', 'boolean', 'date', 'array', 'object').required(),
      required: Joi.boolean(),
      default: Joi.any()
    })
  )
});

// Schema for report validation
const reportSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string(),
  queries: Joi.array().items(
    Joi.object({
      queryId: Joi.string().required(),
      parameters: Joi.object(),
      transformers: Joi.array().items(
        Joi.object({
          type: Joi.string().required(),
          options: Joi.object()
        })
      )
    })
  ).required(),
  format: Joi.string().valid('json', 'csv', 'html').required(),
  options: Joi.object()
});

// Schema for parameters validation
const parametersSchema = Joi.object().pattern(
  Joi.string(),
  Joi.any()
);

/**
 * Validate query data
 */
function validateQuery(req, res, next) {
  try {
    const { error } = querySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  } catch (error) {
    logger.error('Query validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Validate report data
 */
function validateReport(req, res, next) {
  try {
    const { error } = reportSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  } catch (error) {
    logger.error('Report validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Validate parameters
 */
function validateParams(req, res, next) {
  try {
    const { error } = parametersSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  } catch (error) {
    logger.error('Parameters validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  validateQuery,
  validateReport,
  validateParams
}; 