import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import logger from '@/observability/logging';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    service?: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt:', { token: token.substring(0, 10) + '...' });
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const authenticateServiceToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['x-service-token'] || req.headers['authorization'];
  const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : '';

  if (!token) {
    res.status(401).json({ error: 'Service token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.auth.serviceSecret) as any;
    req.user = {
      id: decoded.serviceId,
      email: decoded.serviceName,
      role: 'service',
      service: decoded.serviceName,
    };
    next();
  } catch (error) {
    logger.warn('Invalid service token attempt:', {
      service: req.headers['x-service-name'] || 'unknown',
      ip: req.ip,
    });
    res.status(403).json({ error: 'Invalid service token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as any;
    req.user = decoded;
  } catch (error) {
    // Token is invalid but we continue without user info
    logger.debug('Optional auth failed, continuing without user');
  }

  next();
};
