/**
 * Order and Payment Event Handlers Tests
 */

import { EventMessage } from '../../src/shared/messaging/messageBroker.js';
import * as orderHandlers from '../../src/handlers/order.handler.js';
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

describe('Order and Payment Event Handlers', () => {
  const mockMessage = createMockRawMessage();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOrderPlaced', () => {
    it('should log order placed event', async () => {
      const event: EventMessage = {
        eventId: 'evt-301',
        eventType: 'order.placed',
        timestamp: '2025-10-13T14:00:00Z',
        source: 'order-service',
        data: {
          userId: 'user-789',
          orderId: 'order-101',
          orderTotal: 129.99,
          itemCount: 3,
          paymentMethod: 'credit_card',
        },
        metadata: {
          correlationId: 'corr-301',
          version: '1.0',
        },
      };

      await orderHandlers.handleOrderPlaced(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'ORDER_PLACED',
        expect.objectContaining({
          eventId: 'evt-301',
          userId: 'user-789',
          orderId: 'order-101',
          orderTotal: 129.99,
          itemCount: 3,
          severity: 'medium',
          complianceTags: ['order', 'e-commerce', 'transaction'],
        })
      );
    });
  });

  describe('handleOrderCancelled', () => {
    it('should log order cancelled event', async () => {
      const event: EventMessage = {
        eventId: 'evt-302',
        eventType: 'order.cancelled',
        timestamp: '2025-10-13T14:05:00Z',
        source: 'order-service',
        data: {
          userId: 'user-789',
          orderId: 'order-101',
          cancelledBy: 'user-789',
          reason: 'Changed mind',
          refundAmount: 129.99,
        },
        metadata: {
          correlationId: 'corr-302',
          version: '1.0',
        },
      };

      await orderHandlers.handleOrderCancelled(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'ORDER_CANCELLED',
        expect.objectContaining({
          eventId: 'evt-302',
          userId: 'user-789',
          orderId: 'order-101',
          cancelledBy: 'user-789',
          reason: 'Changed mind',
          refundAmount: 129.99,
          severity: 'medium',
          complianceTags: ['order', 'e-commerce', 'order-cancellation'],
        })
      );
    });
  });

  describe('handleOrderDelivered', () => {
    it('should log order delivered event', async () => {
      const event: EventMessage = {
        eventId: 'evt-303',
        eventType: 'order.delivered',
        timestamp: '2025-10-13T14:10:00Z',
        source: 'order-service',
        data: {
          userId: 'user-789',
          orderId: 'order-102',
          deliveredAt: '2025-10-13T14:10:00Z',
          trackingNumber: 'TRACK123456',
        },
        metadata: {
          correlationId: 'corr-303',
          version: '1.0',
        },
      };

      await orderHandlers.handleOrderDelivered(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'ORDER_DELIVERED',
        expect.objectContaining({
          eventId: 'evt-303',
          userId: 'user-789',
          orderId: 'order-102',
          deliveredAt: '2025-10-13T14:10:00Z',
          trackingNumber: 'TRACK123456',
          severity: 'low',
          complianceTags: ['order', 'e-commerce', 'delivery'],
        })
      );
    });
  });

  describe('handlePaymentReceived', () => {
    it('should log payment received event', async () => {
      const event: EventMessage = {
        eventId: 'evt-304',
        eventType: 'payment.received',
        timestamp: '2025-10-13T14:15:00Z',
        source: 'payment-service',
        data: {
          userId: 'user-789',
          paymentId: 'pay-555',
          orderId: 'order-103',
          amount: 249.99,
          currency: 'USD',
          paymentMethod: 'credit_card',
          transactionId: 'txn-abc123',
        },
        metadata: {
          correlationId: 'corr-304',
          version: '1.0',
        },
      };

      await orderHandlers.handlePaymentReceived(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'PAYMENT_RECEIVED',
        expect.objectContaining({
          eventId: 'evt-304',
          userId: 'user-789',
          paymentId: 'pay-555',
          orderId: 'order-103',
          amount: 249.99,
          currency: 'USD',
          severity: 'high',
          complianceTags: ['payment', 'e-commerce', 'transaction', 'financial', 'pci-dss'],
        })
      );
    });
  });

  describe('handlePaymentFailed', () => {
    it('should log payment failed event', async () => {
      const event: EventMessage = {
        eventId: 'evt-305',
        eventType: 'payment.failed',
        timestamp: '2025-10-13T14:20:00Z',
        source: 'payment-service',
        data: {
          userId: 'user-789',
          paymentId: 'pay-556',
          orderId: 'order-104',
          amount: 99.99,
          currency: 'USD',
          paymentMethod: 'credit_card',
          errorCode: 'INSUFFICIENT_FUNDS',
          errorMessage: 'Card declined - insufficient funds',
        },
        metadata: {
          correlationId: 'corr-305',
          version: '1.0',
        },
      };

      await orderHandlers.handlePaymentFailed(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.security).toHaveBeenCalledWith(
        'PAYMENT_FAILED',
        expect.objectContaining({
          eventId: 'evt-305',
          userId: 'user-789',
          paymentId: 'pay-556',
          orderId: 'order-104',
          errorCode: 'INSUFFICIENT_FUNDS',
          errorMessage: 'Card declined - insufficient funds',
          severity: 'high',
          complianceTags: ['payment', 'e-commerce', 'payment-failed', 'financial', 'alert'],
        })
      );
    });
  });
});
