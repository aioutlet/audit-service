/**
 * User Event Handlers
 * Handles user-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../shared/messaging/messageBroker.js';
import logger from '../shared/observability/logging/index.js';
import { trackMessageProcessed } from '../consumer.js';

/**
 * Handle user created events
 */
export const handleUserCreated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

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
};

/**
 * Handle user updated events
 */
export const handleUserUpdated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

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
};

/**
 * Handle user deleted events
 */
export const handleUserDeleted: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

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
