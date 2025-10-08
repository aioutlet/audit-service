import { Request, Response, NextFunction } from 'express';
import logger from '@/observability/logging';

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  logger.error('Unhandled error:', {
    error: error.message,
    stack: isDevelopment ? error.stack : 'Stack trace hidden in production',
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    correlationId: req.headers['x-correlation-id'],
    environment: process.env.NODE_ENV,
  });

  if (error.status) {
    res.status(error.status).json({
      success: false,
      error: error.message,
      ...(isDevelopment && { stack: error.stack }),
    });
  } else {
    res.status(500).json({
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      ...(isDevelopment && { stack: error.stack }),
    });
  }
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`,
  });
};
