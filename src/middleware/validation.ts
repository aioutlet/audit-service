import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/utils/logger';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      logger.warn('Validation error:', { error: errorMessage, body: req.body });
      res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      logger.warn('Query validation error:', { error: errorMessage, query: req.query });
      res.status(400).json({
        error: 'Query validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      logger.warn('Params validation error:', { error: errorMessage, params: req.params });
      res.status(400).json({
        error: 'Parameter validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
      return;
    }

    req.params = value;
    next();
  };
};

// Common validation schemas
export const auditLogSchema = Joi.object({
  actionType: Joi.string().required().max(100),
  resourceType: Joi.string().required().max(50),
  resourceId: Joi.string().optional().max(255),
  userId: Joi.string().optional().max(255),
  userType: Joi.string().valid('customer', 'admin', 'system', 'guest').default('customer'),
  sessionId: Joi.string().optional().max(255),
  serviceName: Joi.string().optional().max(50),
  endpoint: Joi.string().optional().max(500),
  httpMethod: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD').optional(),
  correlationId: Joi.string().optional().max(255),
  businessContext: Joi.object().optional(),
  success: Joi.boolean().default(true),
  errorMessage: Joi.string().optional().max(1000),
  durationMs: Joi.number().integer().min(0).optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  complianceTags: Joi.array().items(Joi.string().max(50)).optional(),
  ipAddress: Joi.string().ip().optional(),
  userAgent: Joi.string().optional().max(500),
});

export const searchQuerySchema = Joi.object({
  serviceName: Joi.string().optional(),
  actionType: Joi.string().optional(),
  userId: Joi.string().optional(),
  userType: Joi.string().valid('customer', 'admin', 'system', 'guest').optional(),
  resourceType: Joi.string().optional(),
  resourceId: Joi.string().optional(),
  correlationId: Joi.string().optional(),
  success: Joi.boolean().optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
  sortBy: Joi.string().valid('occurredAt', 'severity', 'serviceName').default('occurredAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const bulkAuditSchema = Joi.object({
  logs: Joi.array().items(auditLogSchema).min(1).max(1000).required(),
});
