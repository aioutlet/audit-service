/**
 * Message Broker Interface
 * Abstract interface for different message broker implementations (RabbitMQ, Kafka, AWS SQS, etc.)
 */

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

export type EventHandler = (event: EventMessage, message: any) => Promise<void>;

export interface IMessageBroker {
  /**
   * Connect to the message broker
   */
  connect(): Promise<void>;

  /**
   * Start consuming messages from the queue
   */
  startConsuming(): Promise<void>;

  /**
   * Register a handler for a specific event type
   */
  registerEventHandler(eventType: string, handler: EventHandler): void;

  /**
   * Close the connection to the message broker
   */
  close(): Promise<void>;

  /**
   * Check if the broker connection is healthy
   */
  isHealthy(): boolean;
}
