/**
 * Message Broker Factory
 * Creates the appropriate message broker instance based on configuration
 */

import { IMessageBroker } from './IMessageBroker.js';
import { RabbitMQBroker } from './brokers/RabbitMQBroker.js';
import logger from '../observability/logging/index.js';

export type MessageBrokerType = 'rabbitmq' | 'kafka' | 'sqs';

export class MessageBrokerFactory {
  static create(): IMessageBroker {
    const brokerType = (process.env.MESSAGE_BROKER_TYPE || 'rabbitmq').toLowerCase() as MessageBrokerType;
    const brokerUrl =
      process.env.MESSAGE_BROKER_URL || process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672/';
    const queueName = process.env.MESSAGE_BROKER_QUEUE || 'audit-service.queue';

    logger.info(`🏭 Creating message broker: ${brokerType}`);

    switch (brokerType) {
      case 'rabbitmq':
        return new RabbitMQBroker(brokerUrl, queueName);

      case 'kafka':
        throw new Error('Kafka broker not yet implemented');

      case 'sqs':
        throw new Error('AWS SQS broker not yet implemented');

      default:
        throw new Error(`Unsupported message broker type: ${brokerType}`);
    }
  }
}
