import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import dotenv from 'dotenv';
import { databaseService, initializeServices } from '../services/index.js';

dotenv.config();

export interface EventMessage {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  data: any;
  metadata: {
    correlationId: string;
    version: string;
  };
}

export type EventHandler = (event: EventMessage, message: ConsumeMessage) => Promise<void>;

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnected: boolean = false;
  private eventHandlers: Map<string, EventHandler> = new Map();

  async connect(): Promise<void> {
    try {
      // Initialize database services first
      console.log('🔧 Initializing database services...');
      await initializeServices();
      console.log('✅ Database services initialized');

      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://admin:admin123@localhost:5672/';
      console.log('🔌 Connecting to RabbitMQ:', rabbitUrl.replace(/\/\/.*@/, '//***@'));

      this.connection = await amqp.connect(rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Setup connection error handlers
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        console.log('🔌 RabbitMQ connection closed');
        this.isConnected = false;
      });

      this.isConnected = true;
      console.log('✅ Connected to RabbitMQ successfully');

      // Setup exchanges and queues
      await this.setupInfrastructure();
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      throw error;
    }
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      // Ensure the events exchange exists
      await this.channel.assertExchange('aioutlet.events', 'topic', { durable: true });

      // Ensure audit events queue exists
      await this.channel.assertQueue('audit.events', {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'aioutlet.dead-letter',
          'x-message-ttl': 300000, // 5 minutes
        },
      });

      // Bind auth events to audit queue
      await this.channel.bindQueue('audit.events', 'aioutlet.events', 'auth.*');

      console.log('✅ Audit service infrastructure ready');
    } catch (error) {
      console.error('❌ Failed to setup infrastructure:', error);
      throw error;
    }
  }

  async startConsuming(): Promise<void> {
    if (!this.channel) throw new Error('Channel not initialized');

    try {
      // Set prefetch count for better load distribution
      await this.channel.prefetch(10);

      // Start consuming auth events
      await this.channel.consume(
        'audit.events',
        async (message) => {
          if (!message) return;

          try {
            const eventData: EventMessage = JSON.parse(message.content.toString());
            console.log(`��� Received event: ${eventData.eventType}`, {
              eventId: eventData.eventId,
              source: eventData.source,
            });

            // Process the event
            await this.processEvent(eventData, message);

            // Acknowledge the message
            this.channel!.ack(message);
          } catch (error) {
            console.error('❌ Error processing message:', error);

            // Reject and requeue the message (could implement retry logic)
            this.channel!.nack(message, false, false);
          }
        },
        {
          noAck: false, // Manual acknowledgment
        }
      );

      console.log('��� Audit service listening for events...');
    } catch (error) {
      console.error('❌ Failed to start consuming:', error);
      throw error;
    }
  }

  private async processEvent(event: EventMessage, message: ConsumeMessage): Promise<void> {
    const handler = this.eventHandlers.get(event.eventType);

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
    console.log('�� Audit entry created:', auditEntry);

    // TODO: Save to database
    // await this.auditRepository.save(auditEntry);
  }

  registerEventHandler(eventType: string, handler: EventHandler): void {
    this.eventHandlers.set(eventType, handler);
    console.log(`✅ Event handler registered for: ${eventType}`);
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
      console.log('��� RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.channel !== null && !this.channel.closing;
  }
}

// Create singleton instance
const rabbitMQService = new RabbitMQService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('��� Received SIGINT, closing RabbitMQ connection...');
  await rabbitMQService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('��� Received SIGTERM, closing RabbitMQ connection...');
  await rabbitMQService.close();
  process.exit(0);
});

export default rabbitMQService;
