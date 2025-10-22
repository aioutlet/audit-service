/**
 * Admin Event Handlers
 * Handles admin-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle admin action performed events
 */
export const handleAdminActionPerformed: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('admin', 'action_performed', event, {
      resourceType: event.data.resourceType || 'admin',
      resourceId: event.data.resourceId || event.data.targetId,
      userId: event.data.adminId || event.data.performedBy,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        action: event.data.action,
        targetType: event.data.targetType,
        targetId: event.data.targetId,
        parameters: event.data.parameters,
        previousState: event.data.previousState,
        newState: event.data.newState,
        reason: event.data.reason,
      },
    });

    logger.security('ADMIN_ACTION_PERFORMED', {
      eventId: event.eventId,
      adminId: event.data.adminId,
      action: event.data.action,
      targetType: event.data.targetType,
      targetId: event.data.targetId,
      parameters: event.data.parameters,
      reason: event.data.reason,
      source: event.source || 'admin-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'admin',
      severity: 'high',
      complianceTags: ['admin', 'privileged-access', 'security', 'compliance'],
    });
  } catch (error) {
    logger.error('❌ Failed to process admin.action.performed event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle admin user created events
 */
export const handleAdminUserCreated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('admin', 'user_created', event, {
      resourceType: 'user',
      resourceId: event.data.userId || event.data.newUserId,
      userId: event.data.createdBy || event.data.adminId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        email: event.data.email,
        roles: event.data.roles,
        permissions: event.data.permissions,
        department: event.data.department,
        temporaryPassword: event.data.temporaryPassword,
        mustChangePassword: event.data.mustChangePassword,
      },
    });

    logger.security('ADMIN_USER_CREATED', {
      eventId: event.eventId,
      adminId: event.data.createdBy || event.data.adminId,
      userId: event.data.userId,
      email: event.data.email,
      roles: event.data.roles,
      department: event.data.department,
      source: event.source || 'admin-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'user',
      severity: 'high',
      complianceTags: ['admin', 'user-management', 'privileged-access', 'security'],
    });
  } catch (error) {
    logger.error('❌ Failed to process admin.user.created event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle admin configuration changed events
 */
export const handleAdminConfigChanged: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('admin', 'config_changed', event, {
      resourceType: 'configuration',
      resourceId: event.data.configKey || event.data.component,
      userId: event.data.changedBy || event.data.adminId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        configKey: event.data.configKey,
        component: event.data.component,
        previousValue: event.data.previousValue,
        newValue: event.data.newValue,
        environment: event.data.environment,
        reason: event.data.reason,
        approved: event.data.approved,
        approvedBy: event.data.approvedBy,
      },
    });

    logger.security('ADMIN_CONFIG_CHANGED', {
      eventId: event.eventId,
      adminId: event.data.changedBy || event.data.adminId,
      configKey: event.data.configKey,
      component: event.data.component,
      environment: event.data.environment,
      previousValue: event.data.previousValue,
      newValue: event.data.newValue,
      reason: event.data.reason,
      approved: event.data.approved,
      source: event.source || 'admin-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'configuration',
      severity: 'critical',
      complianceTags: ['admin', 'configuration', 'system-changes', 'security', 'compliance'],
    });
  } catch (error) {
    logger.error('❌ Failed to process admin.config.changed event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
