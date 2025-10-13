/**
 * Auth Event Handlers
 * Handles all authentication-related events for audit logging
 */

import { EventMessage, EventHandler } from '../messageBroker.js';
import { databaseService } from '../../services/index.js';
import { CreateAuditLogRequest } from '../../types/index.js';
import logger from '@/observability/logging';

/**
 * Handle user registration events
 */
export const handleUserRegistered: EventHandler = async (event: EventMessage) => {
  logger.info('Processing auth.user.registered event', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'auth-service',
      actionType: 'USER_REGISTERED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'user',
      resourceId: event.data.userId,
      ipAddress: event.data.ipAddress,
      userAgent: event.data.userAgent,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        firstName: event.data.firstName,
        lastName: event.data.lastName,
        registeredAt: event.data.registeredAt || event.timestamp,
        eventId: event.eventId,
      },
      success: true,
      severity: 'medium',
      complianceTags: ['auth', 'user-registration', 'user-activity', 'security'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('User registration audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      email: event.data.email,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save user registration audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle user login events
 */
export const handleUserLogin: EventHandler = async (event: EventMessage) => {
  logger.info('Processing auth.login event', {
    eventId: event.eventId,
    userId: event.data.userId,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const success = event.data.success !== false;

    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'auth-service',
      actionType: 'USER_LOGIN',
      userId: event.data.userId,
      userType: 'customer',
      sessionId: event.data.sessionId,
      resourceType: 'auth',
      resourceId: event.data.userId,
      ipAddress: event.data.ipAddress,
      userAgent: event.data.userAgent,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        loginMethod: event.data.loginMethod || 'password',
        timestamp: event.timestamp,
        eventId: event.eventId,
      },
      success: success,
      errorMessage: success ? undefined : event.data.errorMessage,
      severity: success ? 'medium' : 'high',
      complianceTags: ['auth', 'login', 'user-activity', 'security'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('User login audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      success: savedAuditLog.success,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save user login audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle email verification request events
 */
export const handleEmailVerificationRequested: EventHandler = async (event: EventMessage) => {
  logger.info('Processing auth.email.verification.requested event', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'auth-service',
      actionType: 'EMAIL_VERIFICATION_REQUESTED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'email',
      resourceId: event.data.email,
      ipAddress: event.data.ipAddress,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        verificationUrl: event.data.verificationUrl ? 'provided' : 'not-provided', // Don't log full URL
        expiresAt: event.data.expiresAt,
        eventId: event.eventId,
      },
      success: true,
      severity: 'low',
      complianceTags: ['auth', 'email-verification', 'user-activity'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Email verification request audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      email: event.data.email,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save email verification request audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle password reset request events
 */
export const handlePasswordResetRequested: EventHandler = async (event: EventMessage) => {
  logger.info('Processing auth.password.reset.requested event', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'auth-service',
      actionType: 'PASSWORD_RESET_REQUESTED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'auth',
      resourceId: event.data.userId,
      ipAddress: event.data.requestIp,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        expiresAt: event.data.expiresAt,
        eventId: event.eventId,
      },
      success: true,
      severity: 'high', // Password reset is a security-sensitive operation
      complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Password reset request audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      email: event.data.email,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save password reset request audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle password reset completed events
 */
export const handlePasswordResetCompleted: EventHandler = async (event: EventMessage) => {
  logger.info('Processing auth.password.reset.completed event', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'auth-service',
      actionType: 'PASSWORD_RESET_COMPLETED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'auth',
      resourceId: event.data.userId,
      ipAddress: event.data.changedIp,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        changedAt: event.data.changedAt,
        eventId: event.eventId,
      },
      success: true,
      severity: 'critical', // Completed password reset is critical security event
      complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Password reset completed audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      email: event.data.email,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save password reset completed audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};

/**
 * Handle account reactivation request events
 */
export const handleAccountReactivationRequested: EventHandler = async (event: EventMessage) => {
  logger.info('Processing auth.account.reactivation.requested event', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    correlationId: event.metadata?.correlationId,
  });

  try {
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'auth-service',
      actionType: 'ACCOUNT_REACTIVATION_REQUESTED',
      userId: event.data.userId,
      userType: 'customer',
      resourceType: 'user',
      resourceId: event.data.userId,
      correlationId: event.metadata?.correlationId,
      businessContext: {
        email: event.data.email,
        expiresAt: event.data.expiresAt,
        eventId: event.eventId,
      },
      success: true,
      severity: 'medium',
      complianceTags: ['auth', 'account-reactivation', 'user-activity'],
    };

    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);

    logger.info('Account reactivation request audit entry saved', {
      auditId: savedAuditLog.id,
      userId: savedAuditLog.userId,
      email: event.data.email,
      correlationId: event.metadata?.correlationId,
    });
  } catch (error) {
    logger.error('Failed to save account reactivation request audit entry', {
      eventId: event.eventId,
      userId: event.data.userId,
      error: error instanceof Error ? error.message : error,
      correlationId: event.metadata?.correlationId,
    });
    throw error;
  }
};
