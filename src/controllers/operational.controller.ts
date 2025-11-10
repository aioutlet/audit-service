/**
 * Operational Controller
 * Handles health, readiness, liveness, and metrics endpoints
 */

import { Response } from 'express';
import { RequestWithTraceContext } from '../middleware/traceContext.middleware.js';
import { config } from '../config/index.js';
import { consumerState } from '../app.js';
import logger from '../core/logger.js';

/**
 * Health check endpoint
 * Returns overall health status of the service
 */
export const health = (req: RequestWithTraceContext, res: Response): void => {
  const { traceId, spanId } = req;
  const isHealthy = consumerState.connected && consumerState.consuming;

  logger.info('Health check requested', { traceId, spanId, isHealthy });

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: config.service.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    messagesProcessed: consumerState.messagesProcessed,
    lastMessageAt: consumerState.lastMessageAt,
    traceId,
  });
};

/**
 * Readiness check endpoint
 * Indicates if service is ready to handle requests
 */
export const readiness = (req: RequestWithTraceContext, res: Response): void => {
  const { traceId, spanId } = req;

  if (consumerState.connected && consumerState.consuming) {
    logger.info('Readiness check: ready', { traceId, spanId });
    res.json({
      status: 'ready',
      service: config.service.name,
      timestamp: new Date().toISOString(),
      checks: {
        dapr: { status: 'healthy' },
        database: { status: 'healthy' },
        eventConsumer: { status: 'consuming' },
      },
      traceId,
    });
  } else {
    logger.warn('Readiness check: not ready', { traceId, spanId });
    res.status(503).json({
      status: 'not_ready',
      service: config.service.name,
      timestamp: new Date().toISOString(),
      checks: {
        dapr: { status: consumerState.connected ? 'healthy' : 'unhealthy' },
        database: { status: consumerState.connected ? 'healthy' : 'unhealthy' },
        eventConsumer: { status: consumerState.consuming ? 'consuming' : 'stopped' },
      },
      traceId,
    });
  }
};

/**
 * Liveness check endpoint
 * Indicates if service is alive (process is running)
 */
export const liveness = (req: RequestWithTraceContext, res: Response): void => {
  const { traceId } = req;
  res.json({
    status: 'alive',
    service: config.service.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    traceId,
  });
};

/**
 * Metrics endpoint
 * Returns service metrics for monitoring
 */
export const metrics = (req: RequestWithTraceContext, res: Response): void => {
  const { traceId } = req;
  const memoryUsage = process.memoryUsage();

  res.json({
    service: config.service.name,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    consumer: {
      messagesProcessed: consumerState.messagesProcessed,
      lastMessageAt: consumerState.lastMessageAt,
      startedAt: consumerState.startedAt,
      isConsuming: consumerState.consuming,
    },
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      heapUsedPercentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
    },
    process: {
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid,
    },
    traceId,
  });
};
