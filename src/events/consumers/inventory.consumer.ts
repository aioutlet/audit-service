/**
 * Inventory Event Consumer
 * Subscribes to inventory-related events via Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'event-bus';

/**
 * Register all inventory event subscriptions
 */
export function registerInventorySubscriptions(server: DaprServer): void {
  // Inventory stock updated event
  server.pubsub.subscribe(PUBSUB_NAME, 'inventory.stock.updated', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('INVENTORY_STOCK_UPDATED', {
        eventId: event.eventId,
        productId: event.data?.productId,
        previousStock: event.data?.previousStock,
        newStock: event.data?.newStock,
        change: event.data?.change,
        source: event.source || 'inventory-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'inventory',
        resourceId: event.data?.productId,
        severity: 'low',
        complianceTags: ['inventory', 'stock-management'],
      });
    } catch (error) {
      logger.error('Error handling inventory.stock.updated event', { error, event });
      throw error;
    }
  });

  // Inventory restock event
  server.pubsub.subscribe(PUBSUB_NAME, 'inventory.restock', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('INVENTORY_RESTOCK', {
        eventId: event.eventId,
        productId: event.data?.productId,
        quantity: event.data?.quantity,
        newStock: event.data?.newStock,
        restockedBy: event.data?.restockedBy,
        source: event.source || 'inventory-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'inventory',
        resourceId: event.data?.productId,
        severity: 'medium',
        complianceTags: ['inventory', 'stock-management', 'restock'],
      });
    } catch (error) {
      logger.error('Error handling inventory.restock event', { error, event });
      throw error;
    }
  });

  // Inventory low stock alert event
  server.pubsub.subscribe(PUBSUB_NAME, 'inventory.low.stock.alert', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('INVENTORY_LOW_STOCK_ALERT', {
        eventId: event.eventId,
        productId: event.data?.productId,
        currentStock: event.data?.currentStock,
        threshold: event.data?.threshold,
        source: event.source || 'inventory-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'inventory',
        resourceId: event.data?.productId,
        severity: 'high',
        complianceTags: ['inventory', 'stock-management', 'alert', 'low-stock'],
      });
    } catch (error) {
      logger.error('Error handling inventory.low.stock.alert event', { error, event });
      throw error;
    }
  });

  // Inventory reserved event
  server.pubsub.subscribe(PUBSUB_NAME, 'inventory.reserved', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('INVENTORY_RESERVED', {
        eventId: event.eventId,
        productId: event.data?.productId,
        quantity: event.data?.quantity,
        orderId: event.data?.orderId,
        reservedUntil: event.data?.reservedUntil,
        source: event.source || 'inventory-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'inventory',
        resourceId: event.data?.productId,
        severity: 'medium',
        complianceTags: ['inventory', 'stock-management', 'reservation'],
      });
    } catch (error) {
      logger.error('Error handling inventory.reserved event', { error, event });
      throw error;
    }
  });
}
