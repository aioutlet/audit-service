/**
 * Auth Event Handlers Tests
 */

import * as authHandlers from '../../src/handlers/auth.handler.js';
import { createMockEvent, createMockRawMessage } from '../helpers.js';
import { EventMessage } from '../../src/shared/messaging/IMessageBroker.js';

// Mock logger with proper return value
jest.mock('../../src/shared/observability/logging/index.js', () => ({
  __esModule: true,
  default: {
    business: jest.fn().mockReturnValue(undefined),
    security: jest.fn().mockReturnValue(undefined),
    info: jest.fn().mockReturnValue(undefined),
    error: jest.fn().mockReturnValue(undefined),
  },
}));

// Mock trackMessageProcessed
jest.mock('../../src/consumer.js', () => ({
  trackMessageProcessed: jest.fn(),
}));

import logger from '../../src/shared/observability/logging/index.js';
import { trackMessageProcessed } from '../../src/consumer.js';

describe('Auth Event Handlers', () => {
  const mockMessage = createMockRawMessage();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleUserRegistered', () => {
    it('should log user registration event', async () => {
      const event = createMockEvent(
        'auth.user.registered',
        {
          userId: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          registeredAt: '2025-10-13T12:00:00Z',
        },
        {
          eventId: 'evt-123',
          source: 'auth-service',
          correlationId: 'corr-123',
        }
      );

      await authHandlers.handleUserRegistered(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'USER_REGISTERED',
        expect.objectContaining({
          eventId: 'evt-123',
          userId: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          severity: 'medium',
          complianceTags: ['auth', 'user-registration', 'user-activity', 'security'],
        })
      );
    });
  });

  describe('handleUserLogin', () => {
    it('should log successful user login event', async () => {
      const event: EventMessage = {
        eventId: 'evt-124',
        eventType: 'auth.login',
        timestamp: '2025-10-13T12:05:00Z',
        source: 'auth-service',
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          sessionId: 'sess-456',
          loginMethod: 'password',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          success: true,
        },
        metadata: {
          correlationId: 'corr-124',
          version: '1.0',
        },
      };

      await authHandlers.handleUserLogin(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'USER_LOGIN',
        expect.objectContaining({
          eventId: 'evt-124',
          userId: 'user-123',
          email: 'test@example.com',
          sessionId: 'sess-456',
          loginMethod: 'password',
          severity: 'medium',
          complianceTags: ['auth', 'login', 'user-activity', 'security'],
        })
      );
    });

    it('should log failed user login event', async () => {
      const event: EventMessage = {
        eventId: 'evt-125',
        eventType: 'auth.login',
        timestamp: '2025-10-13T12:06:00Z',
        source: 'auth-service',
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          success: false,
          errorMessage: 'Invalid credentials',
        },
        metadata: {
          correlationId: 'corr-125',
          version: '1.0',
        },
      };

      await authHandlers.handleUserLogin(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.security).toHaveBeenCalledWith(
        'USER_LOGIN_FAILED',
        expect.objectContaining({
          eventId: 'evt-125',
          userId: 'user-123',
          errorMessage: 'Invalid credentials',
          severity: 'high',
          complianceTags: ['auth', 'login-failed', 'security', 'alert'],
        })
      );
    });
  });

  describe('handleEmailVerificationRequested', () => {
    it('should log email verification request event', async () => {
      const event: EventMessage = {
        eventId: 'evt-126',
        eventType: 'auth.email.verification.requested',
        timestamp: '2025-10-13T12:10:00Z',
        source: 'auth-service',
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          expiresAt: '2025-10-14T12:10:00Z',
          ipAddress: '192.168.1.1',
        },
        metadata: {
          correlationId: 'corr-126',
          version: '1.0',
        },
      };

      await authHandlers.handleEmailVerificationRequested(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'EMAIL_VERIFICATION_REQUESTED',
        expect.objectContaining({
          eventId: 'evt-126',
          userId: 'user-123',
          email: 'test@example.com',
          severity: 'low',
          complianceTags: ['auth', 'email-verification', 'user-activity'],
        })
      );
    });
  });

  describe('handlePasswordResetRequested', () => {
    it('should log password reset request event', async () => {
      const event: EventMessage = {
        eventId: 'evt-127',
        eventType: 'auth.password.reset.requested',
        timestamp: '2025-10-13T12:15:00Z',
        source: 'auth-service',
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          expiresAt: '2025-10-13T13:15:00Z',
          requestIp: '192.168.1.1',
        },
        metadata: {
          correlationId: 'corr-127',
          version: '1.0',
        },
      };

      await authHandlers.handlePasswordResetRequested(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.security).toHaveBeenCalledWith(
        'PASSWORD_RESET_REQUESTED',
        expect.objectContaining({
          eventId: 'evt-127',
          userId: 'user-123',
          email: 'test@example.com',
          severity: 'high',
          complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
        })
      );
    });
  });

  describe('handlePasswordResetCompleted', () => {
    it('should log password reset completion event', async () => {
      const event: EventMessage = {
        eventId: 'evt-128',
        eventType: 'auth.password.reset.completed',
        timestamp: '2025-10-13T12:20:00Z',
        source: 'auth-service',
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          changedAt: '2025-10-13T12:20:00Z',
          changedIp: '192.168.1.1',
        },
        metadata: {
          correlationId: 'corr-128',
          version: '1.0',
        },
      };

      await authHandlers.handlePasswordResetCompleted(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.security).toHaveBeenCalledWith(
        'PASSWORD_RESET_COMPLETED',
        expect.objectContaining({
          eventId: 'evt-128',
          userId: 'user-123',
          email: 'test@example.com',
          severity: 'critical',
          complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
        })
      );
    });
  });

  describe('handleAccountReactivationRequested', () => {
    it('should log account reactivation request event', async () => {
      const event: EventMessage = {
        eventId: 'evt-129',
        eventType: 'auth.account.reactivation.requested',
        timestamp: '2025-10-13T12:25:00Z',
        source: 'auth-service',
        data: {
          userId: 'user-123',
          email: 'test@example.com',
          expiresAt: '2025-10-14T12:25:00Z',
        },
        metadata: {
          correlationId: 'corr-129',
          version: '1.0',
        },
      };

      await authHandlers.handleAccountReactivationRequested(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'ACCOUNT_REACTIVATION_REQUESTED',
        expect.objectContaining({
          eventId: 'evt-129',
          userId: 'user-123',
          email: 'test@example.com',
          severity: 'medium',
          complianceTags: ['auth', 'account-reactivation', 'user-activity'],
        })
      );
    });
  });
});
