/**
 * RabbitMQ Message Broker Implementation
 */

import * as amqp from 'amqplib';
import { IMessageBroker, EventMessage, EventHandler } from '../IMessageBroker.js';
import logger from '../../observability/logging/index.js';

export class RabbitMQBroker implements IMessageBroker {
  private connection: any = null;
  private channel: any = null;
  private isConnected: boolean = false;
  private eventHandlers: Map<string, EventHandler> = new Map();
  private brokerUrl: string;
  private queueName: string;

  constructor(brokerUrl: string, queueName: string) {
    this.brokerUrl = brokerUrl;
    this.queueName = queueName;
  }

  async connect(): Promise<void> {
    try {
      logger.info('🔌 Connecting to RabbitMQ: ' + this.brokerUrl.replace(/\/\/.*@/, '//***@'));

      this.connection = await amqp.connect(this.brokerUrl);
      this.channel = await this.connection.createChannel();

      // Setup connection error handlers
      this.connection.on('error', (err: any) => {
        logger.error('❌ RabbitMQ connection error: ' + err.message, { error: err });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.info('🔌 RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.isConnected = true;
      logger.info('✅ Connected to RabbitMQ successfully');

      // Setup exchanges and queues
      await this.setupInfrastructure();
    } catch (error) {
      logger.error('❌ Failed to connect to RabbitMQ: ' + (error as Error).message, { error });
      this.isConnected = false;
      throw error;
    }
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      // Ensure the events exchange exists (should already exist from infrastructure setup)
      await this.channel.assertExchange('aioutlet.events', 'topic', { durable: true });

      // Ensure audit service queue exists (should already exist from infrastructure setup)
      await this.channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'aioutlet.dlx',
          'x-message-ttl': 300000, // 5 minutes
        },
      });

      // Note: Queue bindings are already set up by infrastructure scripts
      // audit-service.queue is bound to '#' (all events)

      logger.info('✅ RabbitMQ infrastructure ready');
    } catch (error) {
      logger.error('❌ Failed to setup RabbitMQ infrastructure: ' + (error as Error).message, { error });
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      // Set prefetch count for better load distribution
      await this.channel.prefetch(10);

      // Start consuming from audit-service queue (receives all events via '#' binding)
      await this.channel.consume(
        this.queueName,
        async (message: any) => {
          if (!message) return;

          try {
            const eventData: EventMessage = JSON.parse(message.content.toString());
            logger.debug(`📨 Received event: ${eventData.eventType}`, {
              eventId: eventData.eventId,
              source: eventData.source,
            });

            // Process the event
            await this.processEvent(eventData, message);

            // Acknowledge the message
            this.channel!.ack(message);
          } catch (error) {
            logger.error('❌ Error processing message: ' + (error as Error).message, { error });

            // Reject and requeue the message (could implement retry logic)
            this.channel!.nack(message, false, false);
          }
        },
        {
          noAck: false, // Manual acknowledgment
        }
      );

      logger.info(`👂 Audit service listening for events on queue: ${this.queueName}`);
    } catch (error) {
      logger.error('❌ Failed to start consuming: ' + (error as Error).message, { error });
      throw error;
    }
  }

  private async processEvent(event: EventMessage, message: any): Promise<void> {
    // Check for specific event type handler first
    let handler = this.eventHandlers.get(event.eventType);

    // If no specific handler, check for wildcard handler
    if (!handler) {
      handler = this.eventHandlers.get('*');
    }

    if (handler) {
      await handler(event, message);
    } else {
      // Default processing - log to audit trail
      await this.defaultEventHandler(event);
    }
  }

  private async defaultEventHandler(event: EventMessage): Promise<void> {
    // Default audit logging
    const auditEntry = {
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      source: event.source,
      data: event.data,
      correlationId: event.metadata.correlationId,
      processedAt: new Date().toISOString(),
      processor: 'audit-service',
    };

    // Here you would typically save to your audit database
    logger.debug('📝 Audit entry created', { auditEntry });

    // TODO: Save to database
    // await this.auditRepository.save(auditEntry);
  }

  registerEventHandler(eventType: string, handler: EventHandler): void {
    this.eventHandlers.set(eventType, handler);
    logger.info(`✅ Event handler registered for: ${eventType}`);
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      logger.info('👋 RabbitMQ connection closed gracefully');
    } catch (error) {
      logger.error('❌ Error closing RabbitMQ connection: ' + (error as Error).message, { error });
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.channel !== null;
  }
}
