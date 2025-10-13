/**
 * User Event Handlers
 * Handles all user-related events for audit logging
 */

import { EventMessage, EventHandler } from '../messageBroker.js';
import { databaseService } from '../../services/index.js';
import { CreateAuditLogRequest } from '../../types/index.js';
import logger from '@/observability/logging';

/**
 * Handle user created events
 */
export const handleUserCreated: EventHandler = async (event: EventMessage) => {
  logger.info('Processing user.user.created event', {
    eventId: event.eventId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'user-service',
      actionType: 'USER_CREATED',
      userId: event.data.userId,
      userType: event.data.role || 'customer',
      resourceType: 'user',
      resourceId: event.data.userId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        name: event.data.name,
        role: event.data.role,
        createdAt: event.data.createdAt || event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'medium',
      complianceTags: ['user', 'create', 'user-data', 'privacy'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('User created audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save user created audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle user updated events
 */
export const handleUserUpdated: EventHandler = async (event: EventMessage) => {
  logger.info('Processing user.user.updated event', {
    eventId: event.eventId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'user-service',
      actionType: 'USER_UPDATED',
      userId: event.data.userId,
      userType: event.data.role || 'customer',
      resourceType: 'user',
      resourceId: event.data.userId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        updatedFields: event.data.updatedFields,
        updatedAt: event.data.updatedAt || event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'low',
      complianceTags: ['user', 'update', 'user-data', 'privacy'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('User updated audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save user updated audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle user deleted events
 */
export const handleUserDeleted: EventHandler = async (event: EventMessage) => {
  logger.info('Processing user.user.deleted event', {
    eventId: event.eventId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'user-service',
      actionType: 'USER_DELETED',
      userId: event.data.userId,
      userType: event.data.role || 'customer',
      resourceType: 'user',
      resourceId: event.data.userId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        deletedBy: event.data.deletedBy,
        deletedAt: event.data.deletedAt || event.timestamp,
        reason: event.data.reason,
        eventId: event.eventId,
      },
      success: true,
      severity: 'critical', // User deletion is critical
      complianceTags: ['user', 'delete', 'user-data', 'privacy', 'sensitive'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('User deleted audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save user deleted audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle email verified events
 */
export const handleEmailVerified: EventHandler = async (event: EventMessage) => {
  logger.info('Processing user.email.verified event', {
    eventId: event.eventId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'user-service',
      actionType: 'EMAIL_VERIFIED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'email',
      resourceId: event.data.email,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        verifiedAt: event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'medium',
      complianceTags: ['user', 'email-verification', 'security'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Email verified audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save email verified audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle password changed events
 */
export const handlePasswordChanged: EventHandler = async (event: EventMessage) => {
  logger.info('Processing user.password.changed event', {
    eventId: event.eventId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'user-service',
      actionType: 'PASSWORD_CHANGED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'auth',
      resourceId: event.data.userId,
      ipAddress: event.data.ipAddress,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        changedAt: event.timestamp,
        changeMethod: event.data.changeMethod || 'manual',
        eventId: event.eventId,
      },
      success: true,
      severity: 'high', // Password change is security-sensitive
      complianceTags: ['user', 'password-change', 'security', 'user-activity'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Password changed audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save password changed audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};
