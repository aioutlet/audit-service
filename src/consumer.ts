/**
 * Audit Service - Consumer Only
 *
 * This service consumes events from the message broker and writes structured audit logs.
 * Logs are written to stdout and collected by centralized logging systems (Splunk/ELK/Grafana).
 *
 * Architecture:
 * - Minimal health server for container orchestration
 * - Message broker consumer with event handlers
 * - Structured logging via Winston
 * - Metrics via Prometheus client
 * - Distributed tracing via OpenTelemetry
 */

import express from 'express';
import './shared/observability/logging/logger.js';
import './shared/observability/tracing/setup.js';
import logger from './shared/observability/logging/index.js';
import { config } from './shared/config/index.js';
import messageBroker from './shared/messaging/messageBroker.js';
import * as handlers from './handlers/index.js';

// Consumer state tracking
const consumerState = {
  connected: false,
  consuming: false,
  messagesProcessed: 0,
  lastMessageAt: null as string | null,
  startedAt: new Date().toISOString(),
  handlers: [] as string[],
};

/**
 * Initialize minimal health server
 */
function initializeHealthServer(): void {
  const healthApp = express();
  const HEALTH_PORT = config.port || 9000;

  // Parse JSON for any health checks that might need it
  healthApp.use(express.json());

  /**
   * Liveness probe - Is the process alive?
   * Used by K8s to restart dead containers
   */
  healthApp.get('/health/live', (req, res) => {
    res.json({
      status: 'alive',
      service: 'audit-service',
      type: 'consumer',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  /**
   * Readiness probe - Is the consumer ready to process messages?
   * Used by K8s to know when service is ready
   */
  healthApp.get('/health/ready', (req, res) => {
    if (consumerState.connected && consumerState.consuming) {
      res.json({
        status: 'ready',
        service: 'audit-service',
        type: 'consumer',
        timestamp: new Date().toISOString(),
        consumer: consumerState,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        service: 'audit-service',
        type: 'consumer',
        timestamp: new Date().toISOString(),
        error: 'Consumer not connected or not consuming',
        consumer: consumerState,
      });
    }
  });

  /**
   * Overall health check - Comprehensive status
   */
  healthApp.get('/health', (req, res) => {
    const isHealthy = consumerState.connected && consumerState.consuming;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'audit-service',
      type: 'consumer',
      version: config.service.version,
      environment: config.env,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      consumer: consumerState,
    });
  });

  // Start health server
  healthApp.listen(HEALTH_PORT, () => {
    logger.info(`🏥 Health server listening on port ${HEALTH_PORT}`);
    logger.info(`   GET /health       - Overall health status`);
    logger.info(`   GET /health/live  - Liveness probe (K8s)`);
    logger.info(`   GET /health/ready - Readiness probe (K8s)`);
  });
}

/**
 * Initialize message broker and register event handlers
 */
async function initializeMessageBroker(): Promise<void> {
  const brokerUrl = process.env.MESSAGE_BROKER_URL || process.env.RABBITMQ_URL;

  if (!brokerUrl) {
    logger.warn('⚠️  Message broker not configured - consumer cannot start');
    logger.info('💡 Set MESSAGE_BROKER_URL or RABBITMQ_URL environment variable');
    return;
  }

  try {
    logger.info('🔌 Connecting to message broker...');

    // Connect to message broker
    await messageBroker.connect();
    consumerState.connected = true;
    logger.info('✅ Message broker connected successfully');

    // Register auth event handlers
    messageBroker.registerEventHandler('auth.user.registered', handlers.handleUserRegistered);
    messageBroker.registerEventHandler('auth.login', handlers.handleUserLogin);
    messageBroker.registerEventHandler('auth.email.verification.requested', handlers.handleEmailVerificationRequested);
    messageBroker.registerEventHandler('auth.password.reset.requested', handlers.handlePasswordResetRequested);
    messageBroker.registerEventHandler('auth.password.reset.completed', handlers.handlePasswordResetCompleted);
    messageBroker.registerEventHandler(
      'auth.account.reactivation.requested',
      handlers.handleAccountReactivationRequested
    );

    consumerState.handlers.push(
      'auth.user.registered',
      'auth.login',
      'auth.email.verification.requested',
      'auth.password.reset.requested',
      'auth.password.reset.completed',
      'auth.account.reactivation.requested'
    );

    // Register user event handlers
    messageBroker.registerEventHandler('user.user.created', handlers.handleUserCreated);
    messageBroker.registerEventHandler('user.user.updated', handlers.handleUserUpdated);
    messageBroker.registerEventHandler('user.user.deleted', handlers.handleUserDeleted);
    messageBroker.registerEventHandler('user.email.verified', handlers.handleEmailVerified);
    messageBroker.registerEventHandler('user.password.changed', handlers.handlePasswordChanged);

    consumerState.handlers.push(
      'user.user.created',
      'user.user.updated',
      'user.user.deleted',
      'user.email.verified',
      'user.password.changed'
    );

    // Register order and payment event handlers
    messageBroker.registerEventHandler('order.placed', handlers.handleOrderPlaced);
    messageBroker.registerEventHandler('order.cancelled', handlers.handleOrderCancelled);
    messageBroker.registerEventHandler('order.delivered', handlers.handleOrderDelivered);
    messageBroker.registerEventHandler('payment.received', handlers.handlePaymentReceived);
    messageBroker.registerEventHandler('payment.failed', handlers.handlePaymentFailed);

    consumerState.handlers.push(
      'order.placed',
      'order.cancelled',
      'order.delivered',
      'payment.received',
      'payment.failed'
    );

    logger.info('📝 Event handlers registered successfully');
    logger.info(`📋 Registered ${consumerState.handlers.length} handlers: auth (6), user (5), order (3), payment (2)`);

    // Start consuming messages
    await messageBroker.startConsuming();
    consumerState.consuming = true;
    logger.info('👂 Message broker started consuming events');
    logger.info('🚀 Audit consumer is now listening for events...');
  } catch (error) {
    consumerState.connected = false;
    consumerState.consuming = false;
    logger.error('❌ Failed to initialize message broker:', { error });
    logger.warn('⚠️  Consumer will continue running with health endpoints only');
    logger.info('💡 Fix message broker configuration and restart to enable event processing');
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, starting graceful shutdown...`);

  try {
    // Stop consuming new messages
    consumerState.consuming = false;
    logger.info('Stopped consuming new messages');

    // Close message broker connection
    if (consumerState.connected) {
      await messageBroker.close();
      consumerState.connected = false;
      logger.info('Message broker connection closed');
    }

    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', { error });
    process.exit(1);
  }
}

/**
 * Start the audit consumer
 */
async function startConsumer(): Promise<void> {
  try {
    logger.info('🚀 Starting Audit Service Consumer...');
    logger.info(`📊 Environment: ${config.env}`);
    logger.info(`📦 Version: ${config.service.version}`);
    logger.info(`📝 Service: ${config.service.name}`);

    // Initialize health server (always needed for container orchestration)
    initializeHealthServer();

    // Initialize message broker and start consuming (non-blocking)
    try {
      await initializeMessageBroker();
    } catch (error) {
      logger.error('Message broker initialization failed, but health server will continue running');
    }

    // Register graceful shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Log final status
    logger.info('✅ Audit consumer started successfully');
    logger.business('audit.consumer.started', {
      environment: config.env,
      version: config.service.version,
      handlers: consumerState.handlers.length,
    });
  } catch (error) {
    logger.error('❌ Failed to start audit consumer:', { error });
    process.exit(1);
  }
}

// Update message count and last message time when handlers process events
export function trackMessageProcessed(): void {
  consumerState.messagesProcessed++;
  consumerState.lastMessageAt = new Date().toISOString();
}

// Start the consumer
startConsumer();
