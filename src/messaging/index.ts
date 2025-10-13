/**
 * Message Broker Initialization
 * Initializes the message broker connection and registers event handlers
 */

import messageBroker from './messageBroker.js';
import * as handlers from './handlers/index.js';
import logger from '@/observability/logging';

/**
 * Initialize message broker and start consuming events
 */
export async function initializeMessageBroker(): Promise<void> {
  // Skip message broker initialization if not configured
  // Audit service should use HTTP endpoints to receive audit events instead
  const brokerUrl = process.env.MESSAGE_BROKER_URL || process.env.RABBITMQ_URL;

  if (!brokerUrl) {
    logger.warn('⚠️  Message broker not configured - skipping initialization');
    logger.info('💡 Audit service will receive events via HTTP endpoints');
    return;
  }

  try {
    logger.info('🔌 Initializing message broker connection...');

    // Connect to the message broker
    await messageBroker.connect();
    logger.info('✅ Message broker connected successfully');

    // Register specific event handlers following single responsibility principle
    // Auth event handlers
    messageBroker.registerEventHandler('auth.user.registered', handlers.handleUserRegistered);
    messageBroker.registerEventHandler('auth.login', handlers.handleUserLogin);
    messageBroker.registerEventHandler('auth.email.verification.requested', handlers.handleEmailVerificationRequested);
    messageBroker.registerEventHandler('auth.password.reset.requested', handlers.handlePasswordResetRequested);
    messageBroker.registerEventHandler('auth.password.reset.completed', handlers.handlePasswordResetCompleted);
    messageBroker.registerEventHandler(
      'auth.account.reactivation.requested',
      handlers.handleAccountReactivationRequested
    );

    // User event handlers
    messageBroker.registerEventHandler('user.user.created', handlers.handleUserCreated);
    messageBroker.registerEventHandler('user.user.updated', handlers.handleUserUpdated);
    messageBroker.registerEventHandler('user.user.deleted', handlers.handleUserDeleted);
    messageBroker.registerEventHandler('user.email.verified', handlers.handleEmailVerified);
    messageBroker.registerEventHandler('user.password.changed', handlers.handlePasswordChanged);

    // Order and Payment event handlers
    messageBroker.registerEventHandler('order.placed', handlers.handleOrderPlaced);
    messageBroker.registerEventHandler('order.cancelled', handlers.handleOrderCancelled);
    messageBroker.registerEventHandler('order.delivered', handlers.handleOrderDelivered);
    messageBroker.registerEventHandler('payment.received', handlers.handlePaymentReceived);
    messageBroker.registerEventHandler('payment.failed', handlers.handlePaymentFailed);

    logger.info('📝 Specific event handlers registered successfully');
    logger.info('📋 Registered handlers: auth (6), user (5), order (3), payment (2)');

    // Start consuming messages
    await messageBroker.startConsuming();
    logger.info('👂 Message broker started consuming events');
    logger.info('🚀 Audit service is now listening for events...');
  } catch (error) {
    logger.error('❌ Failed to initialize message broker:', error);
    throw error;
  }
}

/**
 * Close message broker connection gracefully
 */
export async function closeMessageBroker(): Promise<void> {
  try {
    logger.info('🔌 Closing message broker connection...');
    await messageBroker.close();
    logger.info('✅ Message broker connection closed successfully');
  } catch (error) {
    logger.error('❌ Error closing message broker connection:', error);
    throw error;
  }
}

export { messageBroker };
