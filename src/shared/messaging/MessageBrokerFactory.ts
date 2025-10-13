/**
 * Message Broker Factory
 * Creates the appropriate message broker instance based on configuration
 */

import { IMessageBroker } from './IMessageBroker.js';
import { RabbitMQBroker } from './brokers/RabbitMQBroker.js';
import { KafkaBroker } from './brokers/KafkaBroker.js';
import logger from '../observability/logging/index.js';

export type MessageBrokerType = 'rabbitmq' | 'kafka' | 'sqs';

export class MessageBrokerFactory {
  static create(): IMessageBroker {
    const brokerType = (process.env.MESSAGE_BROKER_TYPE || 'rabbitmq').toLowerCase() as MessageBrokerType;

    logger.info(`🏭 Creating message broker: ${brokerType}`);

    switch (brokerType) {
      case 'rabbitmq': {
        const brokerUrl =
          process.env.MESSAGE_BROKER_URL || process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672/';
        const queueName = process.env.MESSAGE_BROKER_QUEUE || 'audit-service.queue';
        return new RabbitMQBroker(brokerUrl, queueName);
      }

      case 'kafka': {
        const brokers = process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'];
        const topic = process.env.KAFKA_TOPIC || 'aioutlet.events';
        const groupId = process.env.KAFKA_GROUP_ID || 'audit-service';

        logger.info(`🔧 Kafka config - brokers: ${brokers.join(', ')}, topic: ${topic}, groupId: ${groupId}`);
        return new KafkaBroker(brokers, topic, groupId);
      }

      case 'sqs':
        throw new Error(
          'AWS SQS broker not yet implemented. To add support, create an SQSBroker class implementing IMessageBroker'
        );

      default:
        throw new Error(`Unsupported message broker type: ${brokerType}. Supported types: rabbitmq, kafka`);
    }
  }
}
