/**
 * Product Event Handlers
 * Handles product-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle product created events
 */
export const handleProductCreated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('product', 'created', event, {
      resourceType: 'product',
      resourceId: event.data.productId || event.data.id,
      userId: event.data.createdBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        name: event.data.name,
        description: event.data.description,
        price: event.data.price,
        category: event.data.category,
        sku: event.data.sku,
        status: event.data.status,
      },
    });

    logger.business('PRODUCT_CREATED', {
      eventId: event.eventId,
      productId: event.data.productId || event.data.id,
      name: event.data.name,
      price: event.data.price,
      category: event.data.category,
      sku: event.data.sku,
      createdBy: event.data.createdBy,
      source: event.source || 'product-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'product',
      severity: 'medium',
      complianceTags: ['product', 'catalog-management', 'inventory'],
    });
  } catch (error) {
    logger.error('❌ Failed to process product.created event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle product updated events
 */
export const handleProductUpdated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('product', 'updated', event, {
      resourceType: 'product',
      resourceId: event.data.productId || event.data.id,
      userId: event.data.updatedBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        updatedFields: event.data.updatedFields,
        previousValues: event.data.previousValues,
        newValues: event.data.newValues,
      },
    });

    logger.business('PRODUCT_UPDATED', {
      eventId: event.eventId,
      productId: event.data.productId || event.data.id,
      updatedFields: event.data.updatedFields,
      updatedBy: event.data.updatedBy,
      source: event.source || 'product-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'product',
      severity: 'low',
      complianceTags: ['product', 'catalog-management', 'product-modification'],
    });
  } catch (error) {
    logger.error('❌ Failed to process product.updated event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle product deleted events
 */
export const handleProductDeleted: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('product', 'deleted', event, {
      resourceType: 'product',
      resourceId: event.data.productId || event.data.id,
      userId: event.data.deletedBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        deletedBy: event.data.deletedBy,
        reason: event.data.reason,
        productData: event.data.productData,
      },
    });

    logger.security('PRODUCT_DELETED', {
      eventId: event.eventId,
      productId: event.data.productId || event.data.id,
      deletedBy: event.data.deletedBy,
      reason: event.data.reason,
      source: event.source || 'product-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'product',
      severity: 'high',
      complianceTags: ['product', 'catalog-management', 'product-deletion', 'security'],
    });
  } catch (error) {
    logger.error('❌ Failed to process product.deleted event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle product price changed events
 */
export const handleProductPriceChanged: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('product', 'price_changed', event, {
      resourceType: 'product',
      resourceId: event.data.productId || event.data.id,
      userId: event.data.changedBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        previousPrice: event.data.previousPrice,
        newPrice: event.data.newPrice,
        priceChange: event.data.priceChange,
        reason: event.data.reason,
      },
    });

    logger.business('PRODUCT_PRICE_CHANGED', {
      eventId: event.eventId,
      productId: event.data.productId || event.data.id,
      previousPrice: event.data.previousPrice,
      newPrice: event.data.newPrice,
      priceChange: event.data.priceChange,
      changedBy: event.data.changedBy,
      source: event.source || 'product-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'product',
      severity: 'medium',
      complianceTags: ['product', 'pricing', 'financial', 'catalog-management'],
    });
  } catch (error) {
    logger.error('❌ Failed to process product.price.changed event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
