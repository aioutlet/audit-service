/**
 * Auth Event Consumer
 * Handles authentication-related events from Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

// Shared event bus for all services
const PUBSUB_NAME = 'event-bus';

/**
 * Register auth event subscriptions with Dapr
 */
export function registerAuthSubscriptions(server: DaprServer): void {
  // User Registration
  server.pubsub.subscribe(PUBSUB_NAME, 'auth.user.registered', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('USER_REGISTERED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        firstName: event.data?.firstName,
        lastName: event.data?.lastName,
        ipAddress: event.data?.ipAddress,
        userAgent: event.data?.userAgent,
        registeredAt: event.data?.registeredAt || event.timestamp,
        source: event.source || 'auth-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'user',
        resourceId: event.data?.userId,
        severity: 'medium',
        complianceTags: ['auth', 'user-registration', 'user-activity', 'security'],
      });
    } catch (error) {
      logger.error('Error handling user.registered event', { error, event });
      throw error;
    }
  });

  // User Login
  server.pubsub.subscribe(PUBSUB_NAME, 'auth.login', async (event: any) => {
    try {
      trackMessageProcessed();
      
      logger.info('Received user login event', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        success: event.data?.success,
        timestamp: event.timestamp,
      });

      const success = event.data?.success !== false;
      const severity = success ? 'medium' : 'high';

      if (success) {
        logger.info('Processing successful login event', {
          userId: event.data?.userId,
          email: event.data?.email,
          sessionId: event.data?.sessionId,
          loginMethod: event.data?.loginMethod,
        });

        logger.business('USER_LOGIN', {
          eventId: event.eventId,
          userId: event.data?.userId,
          email: event.data?.email,
          sessionId: event.data?.sessionId,
          loginMethod: event.data?.loginMethod || 'password',
          ipAddress: event.data?.ipAddress,
          userAgent: event.data?.userAgent,
          source: event.source || 'auth-service',
          traceId: event.metadata?.traceId,
          spanId: event.metadata?.spanId,
          resourceType: 'auth',
          resourceId: event.data?.userId,
          severity,
          complianceTags: ['auth', 'login', 'user-activity', 'security'],
        });
        
        logger.info('Successfully logged user login event', {
          userId: event.data?.userId,
          email: event.data?.email,
        });
      } else {
        logger.warn('Processing failed login attempt', {
          userId: event.data?.userId,
          email: event.data?.email,
          errorMessage: event.data?.errorMessage,
          ipAddress: event.data?.ipAddress,
        });

        logger.security('USER_LOGIN_FAILED', {
          eventId: event.eventId,
          userId: event.data?.userId,
          email: event.data?.email,
          errorMessage: event.data?.errorMessage,
          ipAddress: event.data?.ipAddress,
          userAgent: event.data?.userAgent,
          source: event.source || 'auth-service',
          traceId: event.metadata?.traceId,
          spanId: event.metadata?.spanId,
          resourceType: 'auth',
          resourceId: event.data?.userId,
          severity,
          complianceTags: ['auth', 'login-failed', 'security', 'alert'],
        });
        
        logger.warn('Successfully logged failed login attempt', {
          userId: event.data?.userId,
          email: event.data?.email,
        });
      }
    } catch (error) {
      logger.error('Error handling user.login event', { error, event });
      throw error;
    }
  });

  // Email Verification Request
  server.pubsub.subscribe(PUBSUB_NAME, 'auth.email.verification.requested', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('EMAIL_VERIFICATION_REQUESTED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        expiresAt: event.data?.expiresAt,
        ipAddress: event.data?.ipAddress,
        source: event.source || 'auth-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'email',
        resourceId: event.data?.email,
        severity: 'low',
        complianceTags: ['auth', 'email-verification', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling email.verification.requested event', { error, event });
      throw error;
    }
  });

  // Password Reset Request
  server.pubsub.subscribe(PUBSUB_NAME, 'auth.password.reset.requested', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('PASSWORD_RESET_REQUESTED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        expiresAt: event.data?.expiresAt,
        ipAddress: event.data?.requestIp,
        source: event.source || 'auth-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'auth',
        resourceId: event.data?.userId,
        severity: 'high',
        complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling password.reset.requested event', { error, event });
      throw error;
    }
  });

  // Password Reset Completed
  server.pubsub.subscribe(PUBSUB_NAME, 'auth.password.reset.completed', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('PASSWORD_RESET_COMPLETED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        changedAt: event.data?.changedAt,
        ipAddress: event.data?.changedIp,
        source: event.source || 'auth-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'auth',
        resourceId: event.data?.userId,
        severity: 'critical',
        complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling password.reset.completed event', { error, event });
      throw error;
    }
  });

  // Account Reactivation Request
  server.pubsub.subscribe(PUBSUB_NAME, 'auth.account.reactivation.requested', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('ACCOUNT_REACTIVATION_REQUESTED', {
        eventId: event.eventId,
        userId: event.data?.userId,
        email: event.data?.email,
        expiresAt: event.data?.expiresAt,
        source: event.source || 'auth-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'user',
        resourceId: event.data?.userId,
        severity: 'medium',
        complianceTags: ['auth', 'account-reactivation', 'user-activity'],
      });
    } catch (error) {
      logger.error('Error handling account.reactivation.requested event', { error, event });
      throw error;
    }
  });
}
