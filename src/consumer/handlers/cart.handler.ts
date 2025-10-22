/**
 * Cart Event Handlers
 * Handles cart-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle cart item added events
 */
export const handleCartItemAdded: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('cart', 'item_added', event, {
      resourceType: 'cart',
      resourceId: event.data.cartId || event.data.userId,
      userId: event.data.userId || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        quantity: event.data.quantity,
        price: event.data.price,
        productName: event.data.productName,
      },
    });

    logger.business('CART_ITEM_ADDED', {
      eventId: event.eventId,
      userId: event.data.userId,
      cartId: event.data.cartId,
      productId: event.data.productId,
      quantity: event.data.quantity,
      price: event.data.price,
      source: event.source || 'cart-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'cart',
      severity: 'low',
      complianceTags: ['cart', 'e-commerce', 'user-activity'],
    });
  } catch (error) {
    logger.error('❌ Failed to process cart.item.added event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle cart item removed events
 */
export const handleCartItemRemoved: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('cart', 'item_removed', event, {
      resourceType: 'cart',
      resourceId: event.data.cartId || event.data.userId,
      userId: event.data.userId || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        quantity: event.data.quantity,
        reason: event.data.reason,
      },
    });

    logger.business('CART_ITEM_REMOVED', {
      eventId: event.eventId,
      userId: event.data.userId,
      cartId: event.data.cartId,
      productId: event.data.productId,
      quantity: event.data.quantity,
      reason: event.data.reason,
      source: event.source || 'cart-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'cart',
      severity: 'low',
      complianceTags: ['cart', 'e-commerce', 'user-activity'],
    });
  } catch (error) {
    logger.error('❌ Failed to process cart.item.removed event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle cart cleared events
 */
export const handleCartCleared: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('cart', 'cleared', event, {
      resourceType: 'cart',
      resourceId: event.data.cartId || event.data.userId,
      userId: event.data.userId || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        itemCount: event.data.itemCount,
        totalValue: event.data.totalValue,
        reason: event.data.reason,
      },
    });

    logger.business('CART_CLEARED', {
      eventId: event.eventId,
      userId: event.data.userId,
      cartId: event.data.cartId,
      itemCount: event.data.itemCount,
      totalValue: event.data.totalValue,
      reason: event.data.reason,
      source: event.source || 'cart-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'cart',
      severity: 'medium',
      complianceTags: ['cart', 'e-commerce', 'user-activity'],
    });
  } catch (error) {
    logger.error('❌ Failed to process cart.cleared event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle cart abandoned events
 */
export const handleCartAbandoned: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('cart', 'abandoned', event, {
      resourceType: 'cart',
      resourceId: event.data.cartId || event.data.userId,
      userId: event.data.userId || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        itemCount: event.data.itemCount,
        totalValue: event.data.totalValue,
        abandonedAt: event.data.abandonedAt,
        sessionDuration: event.data.sessionDuration,
      },
    });

    logger.business('CART_ABANDONED', {
      eventId: event.eventId,
      userId: event.data.userId,
      cartId: event.data.cartId,
      itemCount: event.data.itemCount,
      totalValue: event.data.totalValue,
      abandonedAt: event.data.abandonedAt,
      sessionDuration: event.data.sessionDuration,
      source: event.source || 'cart-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'cart',
      severity: 'low',
      complianceTags: ['cart', 'e-commerce', 'user-behavior', 'analytics'],
    });
  } catch (error) {
    logger.error('❌ Failed to process cart.abandoned event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
