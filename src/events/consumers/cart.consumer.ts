/**
 * Cart Event Consumer
 * Subscribes to cart-related events via Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'event-bus';

/**
 * Register all cart event subscriptions
 */
export function registerCartSubscriptions(server: DaprServer): void {
  // Cart item added event
  server.pubsub.subscribe(PUBSUB_NAME, 'cart.item.added', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('CART_ITEM_ADDED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        cartId: event.data?.cartId,
        productId: event.data?.productId,
        quantity: event.data?.quantity,
        price: event.data?.price,
        source: event.source || 'cart-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'cart',
        resourceId: event.data?.cartId,
        severity: 'low',
        complianceTags: ['cart', 'e-commerce', 'shopping'],
      });
    } catch (error) {
      logger.error('Error handling cart.item.added event', { error, event });
      throw error;
    }
  });

  // Cart item removed event
  server.pubsub.subscribe(PUBSUB_NAME, 'cart.item.removed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('CART_ITEM_REMOVED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        cartId: event.data?.cartId,
        productId: event.data?.productId,
        quantity: event.data?.quantity,
        source: event.source || 'cart-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'cart',
        resourceId: event.data?.cartId,
        severity: 'low',
        complianceTags: ['cart', 'e-commerce', 'shopping'],
      });
    } catch (error) {
      logger.error('Error handling cart.item.removed event', { error, event });
      throw error;
    }
  });

  // Cart cleared event
  server.pubsub.subscribe(PUBSUB_NAME, 'cart.cleared', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('CART_CLEARED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        cartId: event.data?.cartId,
        source: event.source || 'cart-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'cart',
        resourceId: event.data?.cartId,
        severity: 'low',
        complianceTags: ['cart', 'e-commerce', 'shopping'],
      });
    } catch (error) {
      logger.error('Error handling cart.cleared event', { error, event });
      throw error;
    }
  });

  // Cart abandoned event
  server.pubsub.subscribe(PUBSUB_NAME, 'cart.abandoned', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('CART_ABANDONED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        cartId: event.data?.cartId,
        itemCount: event.data?.itemCount,
        totalValue: event.data?.totalValue,
        abandonedAt: event.data?.abandonedAt || event.timestamp,
        source: event.source || 'cart-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'cart',
        resourceId: event.data?.cartId,
        severity: 'medium',
        complianceTags: ['cart', 'e-commerce', 'cart-abandonment', 'analytics'],
      });
    } catch (error) {
      logger.error('Error handling cart.abandoned event', { error, event });
      throw error;
    }
  });

  logger.info('✅ Cart event subscriptions registered');
}
