import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle correlation IDs for distributed tracing
 */
const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Get correlation ID from header or generate new one
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

  // Set correlation ID in request object for use in controllers/services
  (req as any).correlationId = correlationId;

  // Add correlation ID to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Add to locals for access in templates/views if needed
  res.locals.correlationId = correlationId;

  console.log(`[${correlationId}] ${req.method} ${req.path} - Processing request`);

  next();
};

export default correlationIdMiddleware;
