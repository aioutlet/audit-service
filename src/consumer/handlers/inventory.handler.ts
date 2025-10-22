/**
 * Inventory Event Handlers
 * Handles inventory-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle inventory stock updated events
 */
export const handleInventoryStockUpdated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('inventory', 'stock_updated', event, {
      resourceType: 'inventory',
      resourceId: event.data.productId || event.data.sku,
      userId: event.data.updatedBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        sku: event.data.sku,
        previousStock: event.data.previousStock,
        newStock: event.data.newStock,
        stockChange: event.data.stockChange,
        reason: event.data.reason,
        location: event.data.location,
      },
    });

    logger.business('INVENTORY_STOCK_UPDATED', {
      eventId: event.eventId,
      productId: event.data.productId,
      sku: event.data.sku,
      previousStock: event.data.previousStock,
      newStock: event.data.newStock,
      stockChange: event.data.stockChange,
      reason: event.data.reason,
      updatedBy: event.data.updatedBy,
      source: event.source || 'inventory-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'inventory',
      severity: 'medium',
      complianceTags: ['inventory', 'stock-management', 'supply-chain'],
    });
  } catch (error) {
    logger.error('❌ Failed to process inventory.stock.updated event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle inventory restock events
 */
export const handleInventoryRestock: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('inventory', 'restocked', event, {
      resourceType: 'inventory',
      resourceId: event.data.productId || event.data.sku,
      userId: event.data.restockedBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        sku: event.data.sku,
        quantity: event.data.quantity,
        supplier: event.data.supplier,
        cost: event.data.cost,
        batchNumber: event.data.batchNumber,
        expiryDate: event.data.expiryDate,
      },
    });

    logger.business('INVENTORY_RESTOCKED', {
      eventId: event.eventId,
      productId: event.data.productId,
      sku: event.data.sku,
      quantity: event.data.quantity,
      supplier: event.data.supplier,
      cost: event.data.cost,
      restockedBy: event.data.restockedBy,
      source: event.source || 'inventory-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'inventory',
      severity: 'medium',
      complianceTags: ['inventory', 'restock', 'supply-chain', 'procurement'],
    });
  } catch (error) {
    logger.error('❌ Failed to process inventory.restock event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle inventory low stock alert events
 */
export const handleInventoryLowStockAlert: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('inventory', 'low_stock_alert', event, {
      resourceType: 'inventory',
      resourceId: event.data.productId || event.data.sku,
      userId: undefined, // System-generated alert
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        sku: event.data.sku,
        currentStock: event.data.currentStock,
        threshold: event.data.threshold,
        alertLevel: event.data.alertLevel,
        location: event.data.location,
      },
    });

    logger.security('INVENTORY_LOW_STOCK_ALERT', {
      eventId: event.eventId,
      productId: event.data.productId,
      sku: event.data.sku,
      currentStock: event.data.currentStock,
      threshold: event.data.threshold,
      alertLevel: event.data.alertLevel,
      source: event.source || 'inventory-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'inventory',
      severity: 'high',
      complianceTags: ['inventory', 'alerts', 'stock-monitoring', 'supply-chain'],
    });
  } catch (error) {
    logger.error('❌ Failed to process inventory.low.stock.alert event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle inventory reserved events
 */
export const handleInventoryReserved: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('inventory', 'reserved', event, {
      resourceType: 'inventory',
      resourceId: event.data.productId || event.data.sku,
      userId: event.data.reservedBy || event.data.userId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        sku: event.data.sku,
        quantity: event.data.quantity,
        orderId: event.data.orderId,
        reservationId: event.data.reservationId,
        expiresAt: event.data.expiresAt,
      },
    });

    logger.business('INVENTORY_RESERVED', {
      eventId: event.eventId,
      productId: event.data.productId,
      sku: event.data.sku,
      quantity: event.data.quantity,
      orderId: event.data.orderId,
      reservationId: event.data.reservationId,
      reservedBy: event.data.reservedBy || event.data.userId,
      source: event.source || 'inventory-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'inventory',
      severity: 'medium',
      complianceTags: ['inventory', 'reservation', 'order-processing'],
    });
  } catch (error) {
    logger.error('❌ Failed to process inventory.reserved event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
