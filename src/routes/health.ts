import { Router, Request, Response } from 'express';
import { DatabaseService } from '@/services/database';
import { RedisService } from '@/services/redis';
import { config } from '@/config';

const router = Router();
const dbService = new DatabaseService();
const redisService = new RedisService();

router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    // Check database health
    const dbHealth = await dbService.healthCheck();

    // Check Redis health
    const redisHealth = await redisService.healthCheck();

    const responseTime = Date.now() - startTime;

    const healthStatus = {
      status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service: config.service.name,
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
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        cpu: process.cpuUsage(),
        pid: process.pid,
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
      timestamp: new Date().toISOString(),
      service: config.service.name,
      version: config.service.version,
      responseTime: `${responseTime}ms`,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await dbService.healthCheck();
    const redisHealth = await redisService.healthCheck();

    if (dbHealth && redisHealth) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        dependencies: {
          database: dbHealth,
          redis: redisHealth,
        },
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as healthRoutes };
