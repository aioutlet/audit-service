/**
 * Order and Payment Event Handlers
 * Handles order and payment-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../shared/messaging/messageBroker.js';
import logger from '../shared/observability/logging/index.js';
import { trackMessageProcessed } from '../consumer.js';

/**
 * Handle order placed events
 */
export const handleOrderPlaced: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('ORDER_PLACED', {
    eventId: event.eventId,
    userId: event.data.userId,
    orderId: event.data.orderId,
    orderTotal: event.data.orderTotal,
    itemCount: event.data.itemCount,
    paymentMethod: event.data.paymentMethod,
    source: event.source || 'order-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'order',
    resourceId: event.data.orderId,
    severity: 'medium',
    complianceTags: ['order', 'e-commerce', 'transaction'],
  });
};

/**
 * Handle order cancelled events
 */
export const handleOrderCancelled: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('ORDER_CANCELLED', {
    eventId: event.eventId,
    userId: event.data.userId,
    orderId: event.data.orderId,
    cancelledBy: event.data.cancelledBy,
    reason: event.data.reason,
    refundAmount: event.data.refundAmount,
    source: event.source || 'order-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'order',
    resourceId: event.data.orderId,
    severity: 'medium',
    complianceTags: ['order', 'e-commerce', 'order-cancellation'],
  });
};

/**
 * Handle order delivered events
 */
export const handleOrderDelivered: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('ORDER_DELIVERED', {
    eventId: event.eventId,
    userId: event.data.userId,
    orderId: event.data.orderId,
    deliveredAt: event.data.deliveredAt || event.timestamp,
    trackingNumber: event.data.trackingNumber,
    source: event.source || 'order-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'order',
    resourceId: event.data.orderId,
    severity: 'low',
    complianceTags: ['order', 'e-commerce', 'delivery'],
  });
};

/**
 * Handle payment received events
 */
export const handlePaymentReceived: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('PAYMENT_RECEIVED', {
    eventId: event.eventId,
    userId: event.data.userId,
    paymentId: event.data.paymentId,
    orderId: event.data.orderId,
    amount: event.data.amount,
    currency: event.data.currency,
    paymentMethod: event.data.paymentMethod,
    transactionId: event.data.transactionId,
    source: event.source || 'payment-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'payment',
    resourceId: event.data.paymentId,
    severity: 'high',
    complianceTags: ['payment', 'e-commerce', 'transaction', 'financial', 'pci-dss'],
  });
};

/**
 * Handle payment failed events
 */
export const handlePaymentFailed: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.security('PAYMENT_FAILED', {
    eventId: event.eventId,
    userId: event.data.userId,
    paymentId: event.data.paymentId,
    orderId: event.data.orderId,
    amount: event.data.amount,
    currency: event.data.currency,
    paymentMethod: event.data.paymentMethod,
    errorCode: event.data.errorCode,
    errorMessage: event.data.errorMessage,
    source: event.source || 'payment-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'payment',
    resourceId: event.data.paymentId,
    severity: 'high',
    complianceTags: ['payment', 'e-commerce', 'payment-failed', 'financial', 'alert'],
  });
};
