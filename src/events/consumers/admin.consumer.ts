/**
 * Admin Event Consumer
 * Subscribes to admin-related events via Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'event-bus';

/**
 * Register all admin event subscriptions
 */
export function registerAdminSubscriptions(server: DaprServer): void {
  // Admin action performed event
  server.pubsub.subscribe(PUBSUB_NAME, 'admin.action.performed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('ADMIN_ACTION_PERFORMED', {
        eventId: event.eventId,
        adminId: event.data?.adminId,
        action: event.data?.action,
        targetResource: event.data?.targetResource,
        targetId: event.data?.targetId,
        ipAddress: event.data?.ipAddress,
        source: event.source || 'admin-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'admin',
        resourceId: event.data?.adminId,
        severity: 'critical',
        complianceTags: ['admin', 'security', 'privileged-access', 'audit'],
      });
    } catch (error) {
      logger.error('Error handling admin.action.performed event', { error, event });
      throw error;
    }
  });

  // Admin user created event
  server.pubsub.subscribe(PUBSUB_NAME, 'admin.user.created', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('ADMIN_USER_CREATED', {
        eventId: event.eventId,
        adminId: event.data?.adminId,
        newUserId: event.data?.newUserId,
        email: event.data?.email,
        role: event.data?.role,
        createdBy: event.data?.createdBy,
        source: event.source || 'admin-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'admin',
        resourceId: event.data?.newUserId,
        severity: 'critical',
        complianceTags: ['admin', 'user-management', 'security', 'privileged-access'],
      });
    } catch (error) {
      logger.error('Error handling admin.user.created event', { error, event });
      throw error;
    }
  });

  // Admin config changed event
  server.pubsub.subscribe(PUBSUB_NAME, 'admin.config.changed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('ADMIN_CONFIG_CHANGED', {
        eventId: event.eventId,
        adminId: event.data?.adminId,
        configKey: event.data?.configKey,
        oldValue: event.data?.oldValue,
        newValue: event.data?.newValue,
        changedBy: event.data?.changedBy,
        source: event.source || 'admin-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'config',
        resourceId: event.data?.configKey,
        severity: 'critical',
        complianceTags: ['admin', 'configuration', 'security', 'system-change'],
      });
    } catch (error) {
      logger.error('Error handling admin.config.changed event', { error, event });
      throw error;
    }
  });
}
