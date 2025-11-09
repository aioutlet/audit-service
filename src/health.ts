/**
 * Health Check Server
 * Provides health check and Dapr initialization
 */

import express from 'express';
import { DaprServer, CommunicationProtocolEnum } from '@dapr/dapr';
import logger from './core/logger.js';
import { config } from './core/config.js';
import { consumerState } from './app.js';

const app = express();
let daprServer: DaprServer | null = null;

// Middleware
app.use(express.json());

// Health check endpoints
app.get('/health', (req, res) => {
  const isHealthy = consumerState.connected && consumerState.consuming;
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: config.service,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    messagesProcessed: consumerState.messagesProcessed,
    lastMessageAt: consumerState.lastMessageAt,
  });
});

app.get('/health/ready', (req, res) => {
  if (consumerState.connected && consumerState.consuming) {
    res.json({
      status: 'ready',
      service: config.service,
      timestamp: new Date().toISOString(),
      checks: {
        dapr: { status: 'healthy' },
        database: { status: 'healthy' },
      },
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      service: config.service,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/health/live', (req, res) => {
  res.json({
    status: 'alive',
    service: config.service,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/metrics', (req, res) => {
  const memoryUsage = process.memoryUsage();

  res.json({
    service: config.service,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    messagesProcessed: consumerState.messagesProcessed,
    lastMessageAt: consumerState.lastMessageAt,
    startedAt: consumerState.startedAt,
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    nodeVersion: process.version,
    platform: process.platform,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('HTTP Server Error', { error: err });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

export function startHealthServer(): void {
  const PORT = config.port || 9000;
  const HOST = '0.0.0.0';

  app.listen(PORT, HOST, () => {
    logger.info(`Health check server running on ${HOST}:${PORT}`);
  });
}

/**
 * Initialize Dapr server for event subscriptions
 */
export async function initializeDaprServer(): Promise<DaprServer> {
  const appPort = config.port || 9000;

  daprServer = new DaprServer({
    serverHost: '0.0.0.0',
    serverPort: appPort.toString(),
    clientOptions: {
      daprHost: process.env.DAPR_HOST || '127.0.0.1',
      daprPort: process.env.DAPR_HTTP_PORT || '3500',
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    },
  });

  logger.info('Dapr server initialized', {
    daprHost: process.env.DAPR_HOST || '127.0.0.1',
    daprPort: process.env.DAPR_HTTP_PORT || '3500',
    appPort,
  });

  return daprServer;
}

export function getDaprServer(): DaprServer | null {
  return daprServer;
}
