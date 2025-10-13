/**
 * Test Helpers and Utilities
 */

import { EventMessage } from '../src/shared/messaging/messageBroker.js';

/**
 * Create a mock event message for testing
 */
export function createMockEvent(
  eventType: string,
  data: any,
  options: {
    eventId?: string;
    source?: string;
    correlationId?: string;
    timestamp?: string;
  } = {}
): EventMessage {
  return {
    eventId: options.eventId || `evt-${Date.now()}`,
    eventType,
    timestamp: options.timestamp || new Date().toISOString(),
    source: options.source || 'test-service',
    data,
    metadata: {
      correlationId: options.correlationId || `corr-${Date.now()}`,
      version: '1.0',
    },
  };
}

/**
 * Create a mock raw message (second parameter to handlers)
 */
export function createMockRawMessage() {
  return {
    content: Buffer.from('mock content'),
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test-exchange',
      routingKey: 'test.routing.key',
    },
    properties: {
      contentType: 'application/json',
      headers: {},
    },
  };
}
