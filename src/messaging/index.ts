/**
 * Message Broker Initialization
 * Initializes the message broker connection and registers event handlers
 */

import messageBroker from './messageBroker.js';
import { handleAuditEvent } from './eventHandlers.js';
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

    // Register the generic event handler for ALL event types
    // Using '*' or a wildcard pattern to handle all events
    messageBroker.registerEventHandler('*', handleAuditEvent);
    logger.info('📝 Generic audit event handler registered for all event types');

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
