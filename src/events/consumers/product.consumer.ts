/**
 * Product Event Consumer
 * Subscribes to product-related events via Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'event-bus';

/**
 * Register all product event subscriptions
 */
export function registerProductSubscriptions(server: DaprServer): void {
  // Product created event
  server.pubsub.subscribe(PUBSUB_NAME, 'product.created', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('PRODUCT_CREATED', {
        eventId: event.eventId,
        productId: event.data?.productId,
        name: event.data?.name,
        category: event.data?.category,
        price: event.data?.price,
        createdBy: event.data?.createdBy,
        source: event.source || 'product-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'product',
        resourceId: event.data?.productId,
        severity: 'low',
        complianceTags: ['product', 'catalog', 'product-management'],
      });
    } catch (error) {
      logger.error('Error handling product.created event', { error, event });
      throw error;
    }
  });

  // Product updated event
  server.pubsub.subscribe(PUBSUB_NAME, 'product.updated', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('PRODUCT_UPDATED', {
        eventId: event.eventId,
        productId: event.data?.productId,
        updatedFields: event.data?.updatedFields,
        updatedBy: event.data?.updatedBy,
        source: event.source || 'product-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'product',
        resourceId: event.data?.productId,
        severity: 'low',
        complianceTags: ['product', 'catalog', 'product-management'],
      });
    } catch (error) {
      logger.error('Error handling product.updated event', { error, event });
      throw error;
    }
  });

  // Product deleted event
  server.pubsub.subscribe(PUBSUB_NAME, 'product.deleted', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('PRODUCT_DELETED', {
        eventId: event.eventId,
        productId: event.data?.productId,
        deletedBy: event.data?.deletedBy,
        reason: event.data?.reason,
        source: event.source || 'product-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'product',
        resourceId: event.data?.productId,
        severity: 'medium',
        complianceTags: ['product', 'catalog', 'product-deletion', 'security'],
      });
    } catch (error) {
      logger.error('Error handling product.deleted event', { error, event });
      throw error;
    }
  });

  // Product price changed event
  server.pubsub.subscribe(PUBSUB_NAME, 'product.price.changed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('PRODUCT_PRICE_CHANGED', {
        eventId: event.eventId,
        productId: event.data?.productId,
        oldPrice: event.data?.oldPrice,
        newPrice: event.data?.newPrice,
        changedBy: event.data?.changedBy,
        source: event.source || 'product-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'product',
        resourceId: event.data?.productId,
        severity: 'medium',
        complianceTags: ['product', 'pricing', 'product-management'],
      });
    } catch (error) {
      logger.error('Error handling product.price.changed event', { error, event });
      throw error;
    }
  });

  logger.info('✅ Product event subscriptions registered');
}
