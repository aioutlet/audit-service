import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../../shared/observability/logging/index.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
}

interface JWTPayload {
  id: string;
  email: string;
  roles: string[];
  exp: number;
  iat: number;
}

/**
 * JWT Authentication Middleware for Audit Service
 */
export class AuthMiddleware {
  /**
   * Main authentication middleware - requires valid JWT
   */
  static authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | null = null;

    // Extract token from Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    // Or from cookie
    else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      logger.warn('Authentication failed: No token provided', {
        ip: req.ip,
        path: req.path,
      });
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Configuration error',
        message: 'Authentication service misconfigured',
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

      req.user = {
        id: decoded.id,
        email: decoded.email,
        roles: decoded.roles || [],
      };

      logger.info('Authentication successful', {
        userId: decoded.id,
        roles: decoded.roles,
        ip: req.ip,
        path: req.path,
      });

      next();
    } catch (error) {
      logger.warn('Authentication failed: Invalid token', {
        ip: req.ip,
        path: req.path,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      const message = error instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid authentication token';

      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message,
      });
    }
  };

  /**
   * Require specific roles
   */
  static requireRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      const userRoles = req.user.roles || [];
      const hasRole = roles.some((role) => userRoles.includes(role));

      if (!hasRole) {
        logger.warn('Authorization failed: Insufficient roles', {
          userId: req.user.id,
          requiredRoles: roles,
          userRoles,
          ip: req.ip,
          path: req.path,
        });

        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Required roles: ${roles.join(' or ')}`,
        });
      }

      logger.info('Authorization successful', {
        userId: req.user.id,
        roles: userRoles,
        ip: req.ip,
        path: req.path,
      });

      next();
    };
  };

  /**
   * Require admin role
   */
  static requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    return AuthMiddleware.requireRoles('admin')(req, res, next);
  };

  /**
   * Optional authentication - doesn't require token but attaches user if present
   */
  static optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | null = null;

    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      req.user = undefined;
      return next();
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      req.user = undefined;
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        roles: decoded.roles || [],
      };
    } catch (error) {
      req.user = undefined;
    }

    next();
  };
}

// Export convenient aliases
export const authenticate = AuthMiddleware.authenticate;
export const requireRoles = AuthMiddleware.requireRoles;
export const requireAdmin = AuthMiddleware.requireAdmin;
export const optionalAuth = AuthMiddleware.optionalAuth;

export { AuthRequest };
export default AuthMiddleware;
