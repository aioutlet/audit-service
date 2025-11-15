/**
 * Audit Service - Consumer Application
 * Subscribes to audit events from other services via Dapr pub/sub
 */

import express from 'express';
import { config, validateConfig } from './config/index.js';
import { initializeDatabase, closeDatabaseConnections } from './db/index.js';
import logger from './core/logger.js';
import { registerAllSubscriptions } from './events/consumers/index.js';
import daprServerService from './clients/dapr.server.js';
import { traceContextMiddleware } from './middleware/traceContext.middleware.js';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware.js';
import operationalRoutes from './routes/operational.routes.js';
import apiRoutes from './routes/index.js';

// Consumer state tracking
export const consumerState = {
  connected: false,
  consuming: false,
  messagesProcessed: 0,
  lastMessageAt: null as Date | null,
  startedAt: new Date(),
};

export function trackMessageProcessed() {
  consumerState.messagesProcessed++;
  consumerState.lastMessageAt = new Date();
}

/**
 * Initialize and start Express server for health/metrics on different port
 */
function startExpressServer(): void {
  const app = express();
  const PORT = 9012; // Different port from Dapr server
  const HOST = '0.0.0.0';

  // Middleware
  app.use(express.json());
  app.use(traceContextMiddleware as any); // W3C Trace Context

  // Operational routes only (health, metrics, etc.)
  app.use('/', operationalRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorMiddleware as any);

  app.listen(PORT, HOST, () => {
    logger.info(`Express server (health/metrics) running on ${HOST}:${PORT}`);
  });
}

/**
 * Start the consumer service
 */
export async function startConsumer() {
  try {
    logger.info('Starting Audit Service Consumer...');

    // Validate configuration
    validateConfig();
    logger.info('Configuration validated');

    // Initialize database
    await initializeDatabase();
    consumerState.connected = true;
    logger.info('Database initialized');

    // Initialize Dapr server (it includes HTTP server)
    const daprServer = await daprServerService.initialize();
    logger.info('Dapr server initialized');

    // Register all event subscriptions
    registerAllSubscriptions(daprServer);
    logger.info('Event subscriptions registered');

    // Start Dapr server (starts internal HTTP server)
    await daprServerService.start();
    consumerState.consuming = true;
    logger.info('Dapr server started - consuming events');

    // Start Express server on different port for health/metrics
    startExpressServer();
    logger.info('Express server started');

    logger.info('Audit Service Consumer started successfully');
  } catch (error) {
    logger.error('Failed to start consumer:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    consumerState.consuming = false;

    // Stop Dapr server
    await daprServerService.stop();
    logger.info('Dapr server stopped');

    // Close database connections
    await closeDatabaseConnections();
    consumerState.connected = false;

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

// Error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection', { promise, reason });
  gracefulShutdown('unhandledRejection');
});

// Start the consumer only when this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startConsumer();
}
