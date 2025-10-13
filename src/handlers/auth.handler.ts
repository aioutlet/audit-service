/**
 * Auth Event Handlers
 * Handles authentication-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../shared/messaging/messageBroker.js';
import logger from '../shared/observability/logging/index.js';
import { trackMessageProcessed } from '../consumer.js';

/**
 * Handle user registration events
 */
export const handleUserRegistered: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('USER_REGISTERED', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    firstName: event.data.firstName,
    lastName: event.data.lastName,
    ipAddress: event.data.ipAddress,
    userAgent: event.data.userAgent,
    registeredAt: event.data.registeredAt || event.timestamp,
    source: event.source || 'auth-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'user',
    resourceId: event.data.userId,
    severity: 'medium',
    complianceTags: ['auth', 'user-registration', 'user-activity', 'security'],
  });
};

/**
 * Handle user login events
 */
export const handleUserLogin: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  const success = event.data.success !== false;
  const severity = success ? 'medium' : 'high';

  if (success) {
    logger.business('USER_LOGIN', {
      eventId: event.eventId,
      userId: event.data.userId,
      email: event.data.email,
      sessionId: event.data.sessionId,
      loginMethod: event.data.loginMethod || 'password',
      ipAddress: event.data.ipAddress,
      userAgent: event.data.userAgent,
      source: event.source || 'auth-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'auth',
      resourceId: event.data.userId,
      severity,
      complianceTags: ['auth', 'login', 'user-activity', 'security'],
    });
  } else {
    logger.security('USER_LOGIN_FAILED', {
      eventId: event.eventId,
      userId: event.data.userId,
      email: event.data.email,
      errorMessage: event.data.errorMessage,
      ipAddress: event.data.ipAddress,
      userAgent: event.data.userAgent,
      source: event.source || 'auth-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'auth',
      resourceId: event.data.userId,
      severity,
      complianceTags: ['auth', 'login-failed', 'security', 'alert'],
    });
  }
};

/**
 * Handle email verification request events
 */
export const handleEmailVerificationRequested: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('EMAIL_VERIFICATION_REQUESTED', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    expiresAt: event.data.expiresAt,
    ipAddress: event.data.ipAddress,
    source: event.source || 'auth-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'email',
    resourceId: event.data.email,
    severity: 'low',
    complianceTags: ['auth', 'email-verification', 'user-activity'],
  });
};

/**
 * Handle password reset request events
 */
export const handlePasswordResetRequested: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.security('PASSWORD_RESET_REQUESTED', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    expiresAt: event.data.expiresAt,
    ipAddress: event.data.requestIp,
    source: event.source || 'auth-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'auth',
    resourceId: event.data.userId,
    severity: 'high',
    complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
  });
};

/**
 * Handle password reset completed events
 */
export const handlePasswordResetCompleted: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.security('PASSWORD_RESET_COMPLETED', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    changedAt: event.data.changedAt,
    ipAddress: event.data.changedIp,
    source: event.source || 'auth-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'auth',
    resourceId: event.data.userId,
    severity: 'critical',
    complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
  });
};

/**
 * Handle account reactivation request events
 */
export const handleAccountReactivationRequested: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  logger.business('ACCOUNT_REACTIVATION_REQUESTED', {
    eventId: event.eventId,
    userId: event.data.userId,
    email: event.data.email,
    expiresAt: event.data.expiresAt,
    source: event.source || 'auth-service',
    correlationId: event.metadata?.correlationId,
    resourceType: 'user',
    resourceId: event.data.userId,
    severity: 'medium',
    complianceTags: ['auth', 'account-reactivation', 'user-activity'],
  });
};
