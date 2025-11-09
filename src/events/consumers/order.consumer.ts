/**
 * Order Event Consumer
 * Handles order-related events from Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'audit-pubsub';

/**
 * Register order event subscriptions with Dapr
 */
export function registerOrderSubscriptions(server: DaprServer): void {
  // Order Placed
  server.pubsub.subscribe(PUBSUB_NAME, 'order.placed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('ORDER_PLACED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        orderId: event.data?.orderId,
        orderTotal: event.data?.orderTotal,
        itemCount: event.data?.itemCount,
        paymentMethod: event.data?.paymentMethod,
        source: event.source || 'order-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'order',
        resourceId: event.data?.orderId,
        severity: 'medium',
        complianceTags: ['order', 'e-commerce', 'transaction'],
      });
    } catch (error) {
      logger.error('Error handling order.placed event', { error, event });
      throw error;
    }
  });

  // Order Cancelled
  server.pubsub.subscribe(PUBSUB_NAME, 'order.cancelled', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('ORDER_CANCELLED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        orderId: event.data?.orderId,
        cancelledBy: event.data?.cancelledBy,
        reason: event.data?.reason,
        refundAmount: event.data?.refundAmount,
        source: event.source || 'order-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'order',
        resourceId: event.data?.orderId,
        severity: 'medium',
        complianceTags: ['order', 'e-commerce', 'order-cancellation'],
      });
    } catch (error) {
      logger.error('Error handling order.cancelled event', { error, event });
      throw error;
    }
  });

  // Order Delivered
  server.pubsub.subscribe(PUBSUB_NAME, 'order.delivered', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('ORDER_DELIVERED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        orderId: event.data?.orderId,
        deliveredAt: event.data?.deliveredAt || event.timestamp,
        trackingNumber: event.data?.trackingNumber,
        source: event.source || 'order-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'order',
        resourceId: event.data?.orderId,
        severity: 'low',
        complianceTags: ['order', 'e-commerce', 'delivery'],
      });
    } catch (error) {
      logger.error('Error handling order.delivered event', { error, event });
      throw error;
    }
  });

  // Payment Received
  server.pubsub.subscribe(PUBSUB_NAME, 'payment.received', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('PAYMENT_RECEIVED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        paymentId: event.data?.paymentId,
        orderId: event.data?.orderId,
        amount: event.data?.amount,
        currency: event.data?.currency,
        paymentMethod: event.data?.paymentMethod,
        transactionId: event.data?.transactionId,
        source: event.source || 'payment-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'payment',
        resourceId: event.data?.paymentId,
        severity: 'high',
        complianceTags: ['payment', 'e-commerce', 'transaction', 'financial', 'pci-dss'],
      });
    } catch (error) {
      logger.error('Error handling payment.received event', { error, event });
      throw error;
    }
  });

  // Payment Failed
  server.pubsub.subscribe(PUBSUB_NAME, 'payment.failed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('PAYMENT_FAILED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        paymentId: event.data?.paymentId,
        orderId: event.data?.orderId,
        amount: event.data?.amount,
        currency: event.data?.currency,
        paymentMethod: event.data?.paymentMethod,
        errorCode: event.data?.errorCode,
        errorMessage: event.data?.errorMessage,
        source: event.source || 'payment-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'payment',
        resourceId: event.data?.paymentId,
        severity: 'high',
        complianceTags: ['payment', 'e-commerce', 'payment-failed', 'financial', 'alert'],
      });
    } catch (error) {
      logger.error('Error handling payment.failed event', { error, event });
      throw error;
    }
  });

  logger.info('✅ Order event subscriptions registered');
}
