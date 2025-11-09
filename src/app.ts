/**
 * Audit Service Application
 * Main application logic for consuming and processing audit events via Dapr
 */

import logger from './core/logger.js';
import { config } from './core/config.js';
import { startHealthServer, initializeDaprServer } from './health.js';
import { registerAllSubscriptions } from './events/consumers/index.js';
import { initializeDatabase, closeDatabaseConnections } from './database/index.js';
import validateConfig from './validators/config.validator.js';

let isShuttingDown = false;

// Track consumer state
export const consumerState = {
  connected: false,
  consuming: false,
  messagesProcessed: 0,
  lastMessageAt: null as string | null,
  startedAt: new Date().toISOString(),
};

export function trackMessageProcessed(): void {
  consumerState.messagesProcessed++;
  consumerState.lastMessageAt = new Date().toISOString();
}

/**
 * Start the audit consumer
 */
export const startConsumer = async (): Promise<void> => {
  try {
    logger.info('Starting Audit Service Consumer', {
      service: config.service,
      port: config.port,
    });

    // Validate configuration
    validateConfig();

    // Initialize database
    logger.info('Initializing database connection');
    await initializeDatabase();

    // Start health check server (required for Dapr subscriptions)
    startHealthServer();

    // Initialize Dapr for event-driven communication
    logger.info('Initializing Dapr server');
    const daprServer = await initializeDaprServer();

    // Register all event subscriptions
    logger.info('Registering event subscriptions');
    registerAllSubscriptions(daprServer);

    // Start Dapr server
    await daprServer.start();

    consumerState.connected = true;
    consumerState.consuming = true;

    logger.info('Audit Service ready - processing events via Dapr pub/sub', {
      messagesProcessed: consumerState.messagesProcessed,
      startedAt: consumerState.startedAt,
    });
  } catch (error) {
    logger.error('Failed to start audit consumer', { error });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress - forcing exit');
    process.exit(1);
  }

  isShuttingDown = true;
  consumerState.consuming = false;

  logger.info('Starting graceful shutdown', {
    signal,
    messagesProcessed: consumerState.messagesProcessed,
  });

  try {
    // Close database connections
    logger.info('Closing database connections');
    await closeDatabaseConnections();

    logger.info('Dapr server shutdown handled by Dapr runtime');
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error });
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Start the consumer
startConsumer();
