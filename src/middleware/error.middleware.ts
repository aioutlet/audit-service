/**
 * Error Handling Middleware
 * Centralized error handling for Express application
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../core/logger.js';
import { RequestWithTraceContext } from './traceContext.middleware.js';

/**
 * Error handler middleware
 * Catches all errors and returns standardized error responses
 */
export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const traceContext = req as RequestWithTraceContext;
  const traceId = traceContext.traceId || 'unknown';
  const spanId = traceContext.spanId || 'unknown';

  // Log the error
  logger.error('Request error', {
    traceId,
    spanId,
    error: err.message || 'Unknown error',
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    statusCode: err.statusCode || 500,
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
      traceId,
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const traceContext = req as RequestWithTraceContext;
  const traceId = traceContext.traceId || 'unknown';

  logger.warn('Route not found', {
    traceId,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'The requested endpoint does not exist',
      statusCode: 404,
      path: req.originalUrl,
      traceId,
    },
  });
};
