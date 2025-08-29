/**
 * Operational/Infrastructure endpoints
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import { Request, Response } from 'express';
import { DatabaseService } from '@/services/database';
import { RedisService } from '@/services/redis';
import { config } from '@/config';

// Services will be injected from the app
let dbService: DatabaseService;
let redisService: RedisService;

export function setServices(database: DatabaseService, redis: RedisService) {
  dbService = database;
  redisService = redis;
}

export async function health(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // Check database health
    const dbHealth = await dbService.healthCheck();

    // Check Redis health
    const redisHealth = await redisService.healthCheck();

    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
      service: 'audit-service',
      timestamp: new Date().toISOString(),
      version: config.service.version,
      uptime: process.uptime(),
      environment: config.env,
      responseTime: `${responseTime}ms`,
      dependencies: {
        database: {
          status: dbHealth ? 'healthy' : 'unhealthy',
          type: 'postgresql',
        },
        redis: {
          status: redisHealth ? 'healthy' : 'unhealthy',
          type: 'redis',
        },
      },
    };

    if (healthStatus.status === 'healthy') {
      res.status(200).json(healthStatus);
    } else {
      res.status(503).json(healthStatus);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    res.status(503).json({
      status: 'unhealthy',
      service: 'audit-service',
      timestamp: new Date().toISOString(),
      version: config.service.version,
      responseTime: `${responseTime}ms`,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function readiness(req: Request, res: Response) {
  try {
    const dbHealth = await dbService.healthCheck();
    const redisHealth = await redisService.healthCheck();

    if (dbHealth && redisHealth) {
      res.status(200).json({
        status: 'ready',
        service: 'audit-service',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'connected',
          redis: 'connected',
        },
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'audit-service',
        timestamp: new Date().toISOString(),
        error: 'Service dependencies not available',
        checks: {
          database: dbHealth ? 'connected' : 'disconnected',
          redis: redisHealth ? 'connected' : 'disconnected',
        },
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      service: 'audit-service',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Service dependencies not available',
    });
  }
}

export function liveness(req: Request, res: Response) {
  // Liveness probe - just check if the app is running
  res.json({
    status: 'alive',
    service: 'audit-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

export function metrics(req: Request, res: Response) {
  // Basic metrics endpoint (could be extended with prometheus metrics)
  res.json({
    service: 'audit-service',
    timestamp: new Date().toISOString(),
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      version: process.version,
      environment: config.env,
    },
  });
}
