/**
 * Message Broker Factory
 * Creates the appropriate message broker instance based on configuration
 * Supports RabbitMQ, Kafka, and Azure Service Bus for loose coupling
 */

import { IMessageBroker } from './IMessageBroker.js';
import { RabbitMQBroker } from './brokers/RabbitMQBroker.js';
import { KafkaBroker } from './brokers/KafkaBroker.js';
// import { AzureServiceBusBroker } from './brokers/AzureServiceBusBroker.js';
import logger from '../observability/logging/index.js';

export type MessageBrokerType = 'rabbitmq' | 'kafka' | 'azure-service-bus';

export class MessageBrokerFactory {
  static create(): IMessageBroker {
    const brokerType = (process.env.MESSAGE_BROKER_TYPE || 'rabbitmq').toLowerCase() as MessageBrokerType;

    logger.info(`🏭 Creating message broker: ${brokerType}`);

    switch (brokerType) {
      case 'rabbitmq': {
        const brokerUrl = process.env.MESSAGE_BROKER_URL || process.env.RABBITMQ_URL;
        if (!brokerUrl) {
          throw new Error(
            'MESSAGE_BROKER_URL or RABBITMQ_URL environment variable is required when MESSAGE_BROKER_TYPE=rabbitmq'
          );
        }
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

      case 'azure-service-bus': {
        throw new Error(
          'Azure Service Bus broker not yet implemented. Please use RabbitMQ (MESSAGE_BROKER_TYPE=rabbitmq) or Kafka (MESSAGE_BROKER_TYPE=kafka)'
        );
      }

      default:
        throw new Error(
          `Unsupported message broker type: ${brokerType}. Supported types: rabbitmq, kafka, azure-service-bus`
        );
    }
  }
}
