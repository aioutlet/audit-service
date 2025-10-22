/**
 * Notification Event Handlers
 * Handles notification-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle notification sent events
 */
export const handleNotificationSent: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('notification', 'sent', event, {
      resourceType: 'notification',
      resourceId: event.data.notificationId || event.data.id,
      userId: event.data.userId || event.data.recipientId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        type: event.data.type,
        channel: event.data.channel,
        template: event.data.template,
        subject: event.data.subject,
        recipient: event.data.recipient,
        priority: event.data.priority,
        campaignId: event.data.campaignId,
      },
    });

    logger.business('NOTIFICATION_SENT', {
      eventId: event.eventId,
      notificationId: event.data.notificationId || event.data.id,
      userId: event.data.userId,
      type: event.data.type,
      channel: event.data.channel,
      recipient: event.data.recipient,
      priority: event.data.priority,
      source: event.source || 'notification-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'notification',
      severity: 'low',
      complianceTags: ['notification', 'communication', 'user-engagement'],
    });
  } catch (error) {
    logger.error('❌ Failed to process notification.sent event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle notification delivered events
 */
export const handleNotificationDelivered: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('notification', 'delivered', event, {
      resourceType: 'notification',
      resourceId: event.data.notificationId || event.data.id,
      userId: event.data.userId || event.data.recipientId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        channel: event.data.channel,
        deliveredAt: event.data.deliveredAt,
        deliveryTime: event.data.deliveryTime,
        provider: event.data.provider,
        messageId: event.data.messageId,
      },
    });

    logger.business('NOTIFICATION_DELIVERED', {
      eventId: event.eventId,
      notificationId: event.data.notificationId || event.data.id,
      userId: event.data.userId,
      channel: event.data.channel,
      deliveredAt: event.data.deliveredAt,
      deliveryTime: event.data.deliveryTime,
      provider: event.data.provider,
      source: event.source || 'notification-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'notification',
      severity: 'low',
      complianceTags: ['notification', 'delivery-confirmation', 'communication'],
    });
  } catch (error) {
    logger.error('❌ Failed to process notification.delivered event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle notification failed events
 */
export const handleNotificationFailed: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('notification', 'failed', event, {
      resourceType: 'notification',
      resourceId: event.data.notificationId || event.data.id,
      userId: event.data.userId || event.data.recipientId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        channel: event.data.channel,
        failureReason: event.data.failureReason,
        errorCode: event.data.errorCode,
        provider: event.data.provider,
        retryCount: event.data.retryCount,
        willRetry: event.data.willRetry,
      },
    });

    logger.security('NOTIFICATION_FAILED', {
      eventId: event.eventId,
      notificationId: event.data.notificationId || event.data.id,
      userId: event.data.userId,
      channel: event.data.channel,
      failureReason: event.data.failureReason,
      errorCode: event.data.errorCode,
      retryCount: event.data.retryCount,
      source: event.source || 'notification-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'notification',
      severity: 'medium',
      complianceTags: ['notification', 'delivery-failure', 'system-reliability'],
    });
  } catch (error) {
    logger.error('❌ Failed to process notification.failed event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle notification opened events
 */
export const handleNotificationOpened: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('notification', 'opened', event, {
      resourceType: 'notification',
      resourceId: event.data.notificationId || event.data.id,
      userId: event.data.userId || event.data.recipientId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        channel: event.data.channel,
        openedAt: event.data.openedAt,
        device: event.data.device,
        location: event.data.location,
        clickedLink: event.data.clickedLink,
        campaignId: event.data.campaignId,
      },
    });

    logger.business('NOTIFICATION_OPENED', {
      eventId: event.eventId,
      notificationId: event.data.notificationId || event.data.id,
      userId: event.data.userId,
      channel: event.data.channel,
      openedAt: event.data.openedAt,
      device: event.data.device,
      clickedLink: event.data.clickedLink,
      source: event.source || 'notification-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'notification',
      severity: 'low',
      complianceTags: ['notification', 'user-engagement', 'analytics', 'interaction-tracking'],
    });
  } catch (error) {
    logger.error('❌ Failed to process notification.opened event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
