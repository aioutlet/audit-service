/**
 * Order and Payment Event Handlers
 * Handles order and payment-related events for audit logging
 */

import { EventMessage, EventHandler } from '../messageBroker.js';
import { databaseService } from '../../services/index.js';
import { CreateAuditLogRequest } from '../../types/index.js';
import logger from '@/observability/logging';

/**
 * Handle order placed events
 */
export const handleOrderPlaced: EventHandler = async (event: EventMessage) => {
  logger.info('Processing order.placed event', {
    eventId: event.eventId,
    orderId: event.data.orderId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'order-service',
      actionType: 'ORDER_PLACED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'order',
      resourceId: event.data.orderId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        orderId: event.data.orderId,
        orderNumber: event.data.orderNumber,
        amount: event.data.amount,
        items: event.data.items,
        timestamp: event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'medium',
      complianceTags: ['order', 'transaction', 'commerce', 'financial'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Order placed audit entry saved', {
      auditId: savedAuditLog.id,
      orderId: event.data.orderId,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save order placed audit entry', {
      eventId: event.eventId,
      orderId: event.data.orderId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle order cancelled events
 */
export const handleOrderCancelled: EventHandler = async (event: EventMessage) => {
  logger.info('Processing order.cancelled event', {
    eventId: event.eventId,
    orderId: event.data.orderId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'order-service',
      actionType: 'ORDER_CANCELLED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'order',
      resourceId: event.data.orderId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        orderId: event.data.orderId,
        orderNumber: event.data.orderNumber,
        reason: event.data.reason,
        cancelledAt: event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'medium',
      complianceTags: ['order', 'cancellation', 'commerce', 'transaction'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Order cancelled audit entry saved', {
      auditId: savedAuditLog.id,
      orderId: event.data.orderId,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save order cancelled audit entry', {
      eventId: event.eventId,
      orderId: event.data.orderId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle order delivered events
 */
export const handleOrderDelivered: EventHandler = async (event: EventMessage) => {
  logger.info('Processing order.delivered event', {
    eventId: event.eventId,
    orderId: event.data.orderId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'order-service',
      actionType: 'ORDER_DELIVERED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'order',
      resourceId: event.data.orderId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        orderId: event.data.orderId,
        orderNumber: event.data.orderNumber,
        deliveredAt: event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'low',
      complianceTags: ['order', 'delivery', 'commerce', 'fulfillment'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Order delivered audit entry saved', {
      auditId: savedAuditLog.id,
      orderId: event.data.orderId,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save order delivered audit entry', {
      eventId: event.eventId,
      orderId: event.data.orderId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle payment received events
 */
export const handlePaymentReceived: EventHandler = async (event: EventMessage) => {
  logger.info('Processing payment.received event', {
    eventId: event.eventId,
    paymentId: event.data.paymentId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'payment-service',
      actionType: 'PAYMENT_RECEIVED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'payment',
      resourceId: event.data.paymentId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        paymentId: event.data.paymentId,
        orderId: event.data.orderId,
        amount: event.data.amount,
        receivedAt: event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'high', // Payment is financially sensitive
      complianceTags: ['payment', 'transaction', 'financial', 'commerce'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Payment received audit entry saved', {
      auditId: savedAuditLog.id,
      paymentId: event.data.paymentId,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save payment received audit entry', {
      eventId: event.eventId,
      paymentId: event.data.paymentId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle payment failed events
 */
export const handlePaymentFailed: EventHandler = async (event: EventMessage) => {
  logger.info('Processing payment.failed event', {
    eventId: event.eventId,
    paymentId: event.data.paymentId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'payment-service',
      actionType: 'PAYMENT_FAILED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'payment',
      resourceId: event.data.paymentId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        paymentId: event.data.paymentId,
        orderId: event.data.orderId,
        amount: event.data.amount,
        reason: event.data.reason,
        failedAt: event.timestamp,
        eventId: event.eventId,
      },
      success: false,
      errorMessage: event.data.reason,
      severity: 'critical', // Failed payment is critical
      complianceTags: ['payment', 'transaction', 'financial', 'commerce', 'failure'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Payment failed audit entry saved', {
      auditId: savedAuditLog.id,
      paymentId: event.data.paymentId,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save payment failed audit entry', {
      eventId: event.eventId,
      paymentId: event.data.paymentId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};
