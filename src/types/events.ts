/**
 * Event Types
 * Defines common types for event handling in the audit service
 */

/**
 * Standard event message structure consumed from Dapr pub/sub
 */
export interface EventMessage {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  data: any;
  metadata?: {
    correlationId?: string;
    version?: string;
    [key: string]: any;
  };
}

/**
 * Event handler function signature
 */
export type EventHandler = (event: EventMessage | any) => Promise<void>;
