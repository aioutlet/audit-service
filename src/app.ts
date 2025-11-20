/**
 * Audit Service - Consumer Application
 * Subscribes to audit events from other services via Dapr pub/sub
 */

import express from 'express';
import { config, validateConfig } from './config/index.js';
import { initializeDatabase, closeDatabaseConnections } from './db/index.js';
import logger from './core/logger.js';
import { traceContextMiddleware } from './middleware/traceContext.middleware.js';
import { errorMiddleware, notFoundHandler } from './middleware/error.middleware.js';
import homeRoutes from './routes/home.routes.js';
import operationalRoutes from './routes/operational.routes.js';
import eventRoutes from './routes/events.routes.js';

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
 * Initialize and start Express server
 */
function startExpressServer(): void {
  const app = express();
  const PORT = config.port || 9012;
  const HOST = '0.0.0.0';

  // Middleware
  app.use(express.json());
  app.use(traceContextMiddleware as any); // W3C Trace Context

  // Routes
  app.use('/', homeRoutes);
  app.use('/', operationalRoutes);
  app.use('/', eventRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorMiddleware as any);

  app.listen(PORT, HOST, () => {
    logger.info(`Audit Service running on ${HOST}:${PORT}`);
    logger.info(`Ready to receive events from Dapr subscriptions`);
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

    // Start Express server with event routes
    startExpressServer();
    consumerState.consuming = true;
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
