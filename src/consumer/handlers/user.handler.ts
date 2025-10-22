/**
 * User Event Handlers
 * Handles user-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle user created events
 */
export const handleUserCreated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    // Write structured audit log to database
    await auditLogService.writeAuditLogFromEvent('user', 'created', event, {
      resourceType: 'user',
      resourceId: event.data.userId, // Clean, consistent access
      userId: event.data.createdBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        email: event.data.email,
        firstName: event.data.firstName,
        lastName: event.data.lastName,
        phoneNumber: event.data.phoneNumber,
        isEmailVerified: event.data.isEmailVerified,
        tier: event.data.tier,
      },
    });

    // Also log to file for immediate visibility
    logger.business('USER_CREATED', {
      eventId: event.eventId,
      userId: event.data.userId,
      email: event.data.email,
      firstName: event.data.firstName,
      lastName: event.data.lastName,
      role: event.data.role,
      isActive: event.data.isActive,
      source: event.source || 'user-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'user',
      resourceId: event.data.userId,
      severity: 'medium',
      complianceTags: ['user', 'user-management', 'user-activity'],
    });
  } catch (error) {
    logger.error('❌ Failed to process user.created event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle user updated events
 */
export const handleUserUpdated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    // Extract the user ID consistently
    const userId = event.data.userId;

    // Write structured audit log to database
    await auditLogService.writeAuditLogFromEvent('user', 'updated', event, {
      resourceType: 'user',
      resourceId: userId,
      userId: event.data.updatedBy || null,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        updatedFields: event.data.updatedFields,
        updatedBy: event.data.updatedBy,
      },
    }); // Also log to file for immediate visibility
    logger.business('USER_UPDATED', {
      eventId: event.eventId,
      userId: event.data.userId,
      updatedFields: event.data.updatedFields,
      updatedBy: event.data.updatedBy,
      source: event.source || 'user-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'user',
      resourceId: event.data.userId,
      severity: 'low',
      complianceTags: ['user', 'user-management', 'user-activity'],
    });
  } catch (error) {
    logger.error('❌ Failed to process user.updated event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle user deleted events
 */
export const handleUserDeleted: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    // Extract the user ID consistently
    const userId = event.data.userId;

    // Write structured audit log to database
    await auditLogService.writeAuditLogFromEvent('user', 'deleted', event, {
      resourceType: 'user',
      resourceId: userId,
      userId: event.data.deletedBy || null,
      eventData: {
        deletedBy: event.data.deletedBy,
        reason: event.data.reason,
      },
    }); // Also log to file for immediate visibility
    logger.security('USER_DELETED', {
      eventId: event.eventId,
      userId: event.data.userId,
      deletedBy: event.data.deletedBy,
      reason: event.data.reason,
      source: event.source || 'user-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'user',
      resourceId: event.data.userId,
      severity: 'high',
      complianceTags: ['user', 'user-management', 'user-deletion', 'security', 'compliance'],
    });
  } catch (error) {
    logger.error('❌ Failed to process user.deleted event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle email verified events
 */
export const handleEmailVerified: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('EMAIL_VERIFIED', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    verifiedAt: event.data.verifiedAt || event.timestamp,
    source: event.source || 'user-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'email',
    resourceId: event.data.email,
    severity: 'low',
    complianceTags: ['user', 'email-verification', 'user-activity'],
  });
};

/**
 * Handle password changed events
 */
export const handlePasswordChanged: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.security('PASSWORD_CHANGED', {
    eventId: event.eventId,
    userId: event.data.userId,
    changedAt: event.data.changedAt || event.timestamp,
    changedBy: event.data.changedBy,
    ipAddress: event.data.ipAddress,
    source: event.source || 'user-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'auth',
    resourceId: event.data.userId,
    severity: 'high',
    complianceTags: ['user', 'password-change', 'security', 'user-activity'],
  });
};
