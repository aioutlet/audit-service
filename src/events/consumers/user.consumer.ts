/**
 * User Event Consumer
 * Handles user-related events from Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import auditLogService from '../../services/auditLog.service.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'event-bus';

/**
 * Register user event subscriptions with Dapr
 */
export function registerUserSubscriptions(server: DaprServer): void {
  // User Created
  server.pubsub.subscribe(PUBSUB_NAME, 'user.created', async (event: any) => {
    try {
      trackMessageProcessed();
      await auditLogService.writeAuditLogFromEvent('user', 'created', event, {
        resourceType: 'user',
        resourceId: event.data?.userId,
        userId: event.data?.createdBy || null,
        ipAddress: event.data?.ipAddress || null,
        userAgent: event.data?.userAgent || null,
        eventData: {
          email: event.data?.email,
          firstName: event.data?.firstName,
          lastName: event.data?.lastName,
          phoneNumber: event.data?.phoneNumber,
          isEmailVerified: event.data?.isEmailVerified,
          tier: event.data?.tier,
        },
      });

      logger.business('USER_CREATED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        firstName: event.data?.firstName,
        lastName: event.data?.lastName,
        role: event.data?.role,
        isActive: event.data?.isActive,
        source: event.source || 'user-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'user',
        resourceId: event.data?.userId,
        severity: 'medium',
        complianceTags: ['user', 'user-management', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling user.created event', {
        eventId: event.eventId,
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        error,
      });
      throw error;
    }
  });

  // User Updated
  server.pubsub.subscribe(PUBSUB_NAME, 'user.updated', async (event: any) => {
    try {
      trackMessageProcessed();
      await auditLogService.writeAuditLogFromEvent('user', 'updated', event, {
        resourceType: 'user',
        resourceId: event.data?.userId,
        userId: event.data?.updatedBy || null,
        ipAddress: event.data?.ipAddress || null,
        userAgent: event.data?.userAgent || null,
        eventData: {
          updatedFields: event.data?.updatedFields,
          updatedBy: event.data?.updatedBy,
        },
      });

      logger.business('USER_UPDATED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        updatedFields: event.data?.updatedFields,
        updatedBy: event.data?.updatedBy,
        source: event.source || 'user-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'user',
        resourceId: event.data?.userId,
        severity: 'low',
        complianceTags: ['user', 'user-management', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling user.updated event', {
        eventId: event.eventId,
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        error,
      });
      throw error;
    }
  });

  // User Deleted
  server.pubsub.subscribe(PUBSUB_NAME, 'user.deleted', async (event: any) => {
    try {
      trackMessageProcessed();
      await auditLogService.writeAuditLogFromEvent('user', 'deleted', event, {
        resourceType: 'user',
        resourceId: event.data?.userId,
        userId: event.data?.deletedBy || null,
        eventData: {
          deletedBy: event.data?.deletedBy,
          reason: event.data?.reason,
        },
      });

      logger.security('USER_DELETED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        deletedBy: event.data?.deletedBy,
        reason: event.data?.reason,
        source: event.source || 'user-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'user',
        resourceId: event.data?.userId,
        severity: 'high',
        complianceTags: ['user', 'user-management', 'user-deletion', 'security', 'compliance'],
      });
    } catch (error) {
      logger.error('Error handling user.deleted event', {
        eventId: event.eventId,
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        error,
      });
      throw error;
    }
  });

  // Email Verified
  server.pubsub.subscribe(PUBSUB_NAME, 'email.verified', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('EMAIL_VERIFIED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        verifiedAt: event.data?.verifiedAt || event.timestamp,
        source: event.source || 'user-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'email',
        resourceId: event.data?.email,
        severity: 'low',
        complianceTags: ['user', 'email-verification', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling email.verified event', { error, event });
      throw error;
    }
  });

  // Password Changed
  server.pubsub.subscribe(PUBSUB_NAME, 'password.changed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('PASSWORD_CHANGED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        changedAt: event.data?.changedAt || event.timestamp,
        changedBy: event.data?.changedBy,
        ipAddress: event.data?.ipAddress,
        source: event.source || 'user-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'auth',
        resourceId: event.data?.userId,
        severity: 'high',
        complianceTags: ['user', 'password-change', 'security', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling password.changed event', { error, event });
      throw error;
    }
  });
}
