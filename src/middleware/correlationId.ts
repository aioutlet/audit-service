import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config';

export interface RequestWithCorrelationId extends Request {
  correlationId?: string;
}

export const correlationIdMiddleware = (req: RequestWithCorrelationId, res: Response, next: NextFunction): void => {
  // Get correlation ID from header or generate a new one
  const correlationId =
    (req.headers[config.service.correlationIdHeader] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    uuidv4();

  // Add correlation ID to request
  req.correlationId = correlationId;

  // Add correlation ID to response headers
  res.setHeader('x-correlation-id', correlationId);

  next();
};
