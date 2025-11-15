/**
 * Notification Event Consumer
 * Subscribes to notification-related events via Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'event-bus';

/**
 * Register all notification event subscriptions
 */
export function registerNotificationSubscriptions(server: DaprServer): void {
  // Notification sent event
  server.pubsub.subscribe(PUBSUB_NAME, 'notification.sent', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('NOTIFICATION_SENT', {
        eventId: event.eventId,
        notificationId: event.data?.notificationId,
        userId: event.data?.userId,
        type: event.data?.type,
        channel: event.data?.channel,
        source: event.source || 'notification-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'notification',
        resourceId: event.data?.notificationId,
        severity: 'low',
        complianceTags: ['notification', 'messaging'],
      });
    } catch (error) {
      logger.error('Error handling notification.sent event', { error, event });
      throw error;
    }
  });

  // Notification delivered event
  server.pubsub.subscribe(PUBSUB_NAME, 'notification.delivered', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('NOTIFICATION_DELIVERED', {
        eventId: event.eventId,
        notificationId: event.data?.notificationId,
        userId: event.data?.userId,
        deliveredAt: event.data?.deliveredAt || event.timestamp,
        source: event.source || 'notification-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'notification',
        resourceId: event.data?.notificationId,
        severity: 'low',
        complianceTags: ['notification', 'messaging', 'delivery'],
      });
    } catch (error) {
      logger.error('Error handling notification.delivered event', { error, event });
      throw error;
    }
  });

  // Notification failed event
  server.pubsub.subscribe(PUBSUB_NAME, 'notification.failed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('NOTIFICATION_FAILED', {
        eventId: event.eventId,
        notificationId: event.data?.notificationId,
        userId: event.data?.userId,
        errorCode: event.data?.errorCode,
        errorMessage: event.data?.errorMessage,
        source: event.source || 'notification-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'notification',
        resourceId: event.data?.notificationId,
        severity: 'high',
        complianceTags: ['notification', 'messaging', 'failure', 'alert'],
      });
    } catch (error) {
      logger.error('Error handling notification.failed event', { error, event });
      throw error;
    }
  });

  // Notification opened event
  server.pubsub.subscribe(PUBSUB_NAME, 'notification.opened', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('NOTIFICATION_OPENED', {
        eventId: event.eventId,
        notificationId: event.data?.notificationId,
        userId: event.data?.userId,
        openedAt: event.data?.openedAt || event.timestamp,
        source: event.source || 'notification-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'notification',
        resourceId: event.data?.notificationId,
        severity: 'low',
        complianceTags: ['notification', 'messaging', 'engagement'],
      });
    } catch (error) {
      logger.error('Error handling notification.opened event', { error, event });
      throw error;
    }
  });
}
