/**
 * Health Check Utilities
 * Provides standardized health checks for database and external services
 */

import { Pool, PoolClient } from 'pg';
import logger from '../observability/index.js';

// PostgreSQL connection pool (should be imported from your database config)
let pool: Pool | null = null;

// Initialize pool if not already done
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

/**
 * Check PostgreSQL database connectivity
 */
export const checkDatabaseHealth = async (): Promise<{
  status: string;
  message: string;
  details?: any;
}> => {
  try {
    const dbPool = getPool();

    // Get a client from the pool
    let client: PoolClient | null = null;

    try {
      client = await dbPool.connect();

      // Perform a simple query
      const result = await client.query('SELECT NOW() as current_time, version() as version');

      if (!result.rows || result.rows.length === 0) {
        return {
          status: 'unhealthy',
          message: 'PostgreSQL query returned no results',
          details: { query: 'SELECT NOW(), version()' },
        };
      }

      return {
        status: 'healthy',
        message: 'PostgreSQL connection is healthy',
        details: {
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version,
          poolTotalCount: dbPool.totalCount,
          poolIdleCount: dbPool.idleCount,
          poolWaitingCount: dbPool.waitingCount,
        },
      };
    } finally {
      if (client) {
        client.release();
      }
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `PostgreSQL health check failed: ${(error as Error).message}`,
      details: {
        error: (error as Error).message,
        code: (error as any).code,
      },
    };
  }
};

/**
 * Check external service connectivity
 */
export const checkExternalServiceHealth = async (
  serviceName: string,
  serviceUrl: string,
  timeout = 5000
): Promise<{
  status: string;
  message: string;
  responseTime: number;
  details?: any;
}> => {
  const startTime = Date.now();

  try {
    if (!serviceUrl) {
      return {
        status: 'skipped',
        message: `${serviceName} URL not configured`,
        responseTime: 0,
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${serviceUrl}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': 'audit-service-health-check/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const responseBody = await response.json().catch(() => ({}));
      return {
        status: 'healthy',
        message: `${serviceName} is healthy`,
        responseTime,
        details: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
        },
      };
    } else {
      return {
        status: 'unhealthy',
        message: `${serviceName} returned ${response.status}`,
        responseTime,
        details: {
          statusCode: response.status,
          statusText: response.statusText,
        },
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if ((error as Error).name === 'AbortError') {
      return {
        status: 'unhealthy',
        message: `${serviceName} health check timed out after ${timeout}ms`,
        responseTime,
        details: {
          error: 'timeout',
        },
      };
    }

    return {
      status: 'unhealthy',
      message: `${serviceName} health check failed: ${(error as Error).message}`,
      responseTime,
      details: {
        error: (error as Error).message,
        code: (error as any).code,
      },
    };
  }
};

/**
 * Perform comprehensive readiness check
 */
export const performReadinessCheck = async (): Promise<{
  status: string;
  timestamp: string;
  totalCheckTime: number;
  checks: Record<string, any>;
  error?: string;
}> => {
  const checks: Record<string, any> = {};
  let overallHealthy = true;
  const checkStartTime = Date.now();

  try {
    // Check database connectivity
    logger.debug('Performing database health check');
    checks.database = await checkDatabaseHealth();
    if (checks.database.status !== 'healthy') {
      overallHealthy = false;
    }

    // Check external services (audit service doesn't typically have many dependencies)
    const externalServices: Array<{ name: string; url: string }> = [
      // External services would go here when configured
    ];

    for (const service of externalServices) {
      if (service.url && service.url !== 'http://localhost:3007' && service.url !== 'http://localhost:3003') {
        logger.debug(`Performing ${service.name} service health check`);
        checks[service.name] = await checkExternalServiceHealth(service.name, service.url, 3000);

        // For readiness, external services must be healthy
        if (checks[service.name].status !== 'healthy' && checks[service.name].status !== 'skipped') {
          overallHealthy = false;
        }
      } else {
        checks[service.name] = {
          status: 'skipped',
          message: `${service.name} service check skipped (development/default URL)`,
          responseTime: 0,
        };
      }
    }

    const totalCheckTime = Date.now() - checkStartTime;

    return {
      status: overallHealthy ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      totalCheckTime,
      checks,
    };
  } catch (error) {
    logger.error('Readiness check failed', undefined, { error: (error as Error).message });

    return {
      status: 'not ready',
      timestamp: new Date().toISOString(),
      totalCheckTime: Date.now() - checkStartTime,
      error: (error as Error).message,
      checks,
    };
  }
};

/**
 * Perform liveness check (should be fast and not check external dependencies)
 */
export const performLivenessCheck = async (): Promise<{
  status: string;
  timestamp: string;
  uptime?: number;
  checks?: Record<string, any>;
  error?: string;
}> => {
  try {
    const memoryUsage = process.memoryUsage();

    // Check memory usage - if heap used is > 90% of total, consider unhealthy
    const memoryHealthy = memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9;

    // Check if the main event loop is not blocked (basic responsiveness check)
    const startTime = process.hrtime.bigint();
    await new Promise((resolve) => setImmediate(resolve));
    const eventLoopDelay = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds

    const eventLoopHealthy = eventLoopDelay < 100; // Less than 100ms delay is healthy

    const isHealthy = memoryHealthy && eventLoopHealthy;

    return {
      status: isHealthy ? 'alive' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: {
        memory: {
          healthy: memoryHealthy,
          usage: memoryUsage,
          percentUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
        },
        eventLoop: {
          healthy: eventLoopHealthy,
          delay: eventLoopDelay,
        },
        process: {
          pid: process.pid,
          nodeVersion: process.version,
          platform: process.platform,
        },
      },
    };
  } catch (error) {
    logger.error('Liveness check failed', undefined, { error: (error as Error).message });

    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    };
  }
};

/**
 * Get system metrics for monitoring
 */
export const getSystemMetrics = (): Record<string, any> => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      percentUsed: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    process: {
      pid: process.pid,
      ppid: process.ppid,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      versions: process.versions,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      version: process.env.API_VERSION || '1.0.0',
    },
  };
};
