/**
 * Home Controller
 * Handles service information and version endpoints
 */

import { Request, Response } from 'express';
import { config } from '../config/index.js';

/**
 * Service information endpoint
 */
export const info = (_req: Request, res: Response): void => {
  res.json({
    message: 'Welcome to the Audit Service',
    service: config.service.name,
    description: 'Event-driven audit logging service for AIOutlet platform',
    version: config.service.version,
    environment: config.env,
    capabilities: [
      'Event consumption via Dapr pub/sub',
      'Audit log persistence to PostgreSQL',
      'Cross-service audit trail tracking',
      'W3C Trace Context propagation',
    ],
  });
};

/**
 * Service version endpoint
 */
export const version = (_req: Request, res: Response): void => {
  res.json({
    service: config.service.name,
    version: config.service.version,
    environment: config.env,
    nodeVersion: process.version,
  });
};
