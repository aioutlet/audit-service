/**
 * User Event Handlers Tests
 */

import { EventMessage } from '../../src/shared/messaging/messageBroker.js';
import * as userHandlers from '../../src/handlers/user.handler.js';
import { createMockRawMessage } from '../helpers.js';

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

describe('User Event Handlers', () => {
  const mockMessage = createMockRawMessage();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleUserCreated', () => {
    it('should log user created event', async () => {
      const event: EventMessage = {
        eventId: 'evt-201',
        eventType: 'user.user.created',
        timestamp: '2025-10-13T13:00:00Z',
        source: 'user-service',
        data: {
          userId: 'user-456',
          email: 'newuser@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'customer',
          isActive: true,
        },
        metadata: {
          correlationId: 'corr-201',
          version: '1.0',
        },
      };

      await userHandlers.handleUserCreated(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'USER_CREATED',
        expect.objectContaining({
          eventId: 'evt-201',
          userId: 'user-456',
          email: 'newuser@example.com',
          role: 'customer',
          severity: 'medium',
          complianceTags: ['user', 'user-management', 'user-activity'],
        })
      );
    });
  });

  describe('handleUserUpdated', () => {
    it('should log user updated event', async () => {
      const event: EventMessage = {
        eventId: 'evt-202',
        eventType: 'user.user.updated',
        timestamp: '2025-10-13T13:05:00Z',
        source: 'user-service',
        data: {
          userId: 'user-456',
          updatedFields: ['firstName', 'lastName'],
          updatedBy: 'admin-123',
        },
        metadata: {
          correlationId: 'corr-202',
          version: '1.0',
        },
      };

      await userHandlers.handleUserUpdated(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'USER_UPDATED',
        expect.objectContaining({
          eventId: 'evt-202',
          userId: 'user-456',
          updatedFields: ['firstName', 'lastName'],
          severity: 'low',
          complianceTags: ['user', 'user-management', 'user-activity'],
        })
      );
    });
  });

  describe('handleUserDeleted', () => {
    it('should log user deleted event', async () => {
      const event: EventMessage = {
        eventId: 'evt-203',
        eventType: 'user.user.deleted',
        timestamp: '2025-10-13T13:10:00Z',
        source: 'user-service',
        data: {
          userId: 'user-456',
          deletedBy: 'admin-123',
          reason: 'User requested account deletion',
        },
        metadata: {
          correlationId: 'corr-203',
          version: '1.0',
        },
      };

      await userHandlers.handleUserDeleted(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.security).toHaveBeenCalledWith(
        'USER_DELETED',
        expect.objectContaining({
          eventId: 'evt-203',
          userId: 'user-456',
          deletedBy: 'admin-123',
          reason: 'User requested account deletion',
          severity: 'high',
          complianceTags: ['user', 'user-management', 'user-deletion', 'security', 'compliance'],
        })
      );
    });
  });

  describe('handleEmailVerified', () => {
    it('should log email verified event', async () => {
      const event: EventMessage = {
        eventId: 'evt-204',
        eventType: 'user.email.verified',
        timestamp: '2025-10-13T13:15:00Z',
        source: 'user-service',
        data: {
          userId: 'user-456',
          email: 'newuser@example.com',
          verifiedAt: '2025-10-13T13:15:00Z',
        },
        metadata: {
          correlationId: 'corr-204',
          version: '1.0',
        },
      };

      await userHandlers.handleEmailVerified(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'EMAIL_VERIFIED',
        expect.objectContaining({
          eventId: 'evt-204',
          userId: 'user-456',
          email: 'newuser@example.com',
          severity: 'low',
          complianceTags: ['user', 'email-verification', 'user-activity'],
        })
      );
    });
  });

  describe('handlePasswordChanged', () => {
    it('should log password changed event', async () => {
      const event: EventMessage = {
        eventId: 'evt-205',
        eventType: 'user.password.changed',
        timestamp: '2025-10-13T13:20:00Z',
        source: 'user-service',
        data: {
          userId: 'user-456',
          changedAt: '2025-10-13T13:20:00Z',
          changedBy: 'user-456',
          ipAddress: '192.168.1.1',
        },
        metadata: {
          correlationId: 'corr-205',
          version: '1.0',
        },
      };

      await userHandlers.handlePasswordChanged(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.security).toHaveBeenCalledWith(
        'PASSWORD_CHANGED',
        expect.objectContaining({
          eventId: 'evt-205',
          userId: 'user-456',
          changedBy: 'user-456',
          ipAddress: '192.168.1.1',
          severity: 'high',
          complianceTags: ['user', 'password-change', 'security', 'user-activity'],
        })
      );
    });
  });
});
