/**
 * Message Broker Service
 * Main entry point for message broker functionality
 * Provides a singleton instance of the configured message broker
 */

import { IMessageBroker } from './IMessageBroker.js';
import { MessageBrokerFactory } from './MessageBrokerFactory.js';

// Create singleton instance using factory
const messageBroker: IMessageBroker = MessageBrokerFactory.create();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('⚠️  Received SIGINT, closing message broker connection...');
  await messageBroker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('⚠️  Received SIGTERM, closing message broker connection...');
  await messageBroker.close();
  process.exit(0);
});

// Export the singleton instance
export default messageBroker;

// Also export types for convenience
export type { EventMessage, EventHandler, IMessageBroker } from './IMessageBroker.js';
export { MessageBrokerFactory } from './MessageBrokerFactory.js';
