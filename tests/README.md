# Audit Service Tests

This directory contains unit tests for the audit-service consumer.

## Test Structure

```
tests/
  ├── setup.ts                    # Test configuration and global mocks
  ├── helpers.ts                  # Test utilities and helper functions
  └── handlers/                   # Handler tests
      ├── auth.handler.test.ts    # Auth event handler tests (6 handlers)
      ├── user.handler.test.ts    # User event handler tests (5 handlers)
      └── order.handler.test.ts   # Order/Payment handler tests (5 handlers)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## Test Coverage

The tests cover all 16 event handlers:

### Auth Handlers (6)

- `handleUserRegistered` - User registration audit
- `handleUserLogin` - Successful/failed login audit
- `handleEmailVerificationRequested` - Email verification request
- `handlePasswordResetRequested` - Password reset request
- `handlePasswordResetCompleted` - Password reset completion
- `handleAccountReactivationRequested` - Account reactivation request

### User Handlers (5)

- `handleUserCreated` - User creation audit
- `handleUserUpdated` - User profile update audit
- `handleUserDeleted` - User deletion audit
- `handleEmailVerified` - Email verification completion
- `handlePasswordChanged` - Password change audit

### Order & Payment Handlers (5)

- `handleOrderPlaced` - Order placement audit
- `handleOrderCancelled` - Order cancellation audit
- `handleOrderDelivered` - Order delivery audit
- `handlePaymentReceived` - Successful payment audit
- `handlePaymentFailed` - Failed payment audit

## Test Helpers

### `createMockEvent(eventType, data, options)`

Creates a properly formatted EventMessage for testing.

**Parameters:**

- `eventType`: The event type string (e.g., 'auth.login')
- `data`: The event data payload
- `options`: Optional configuration
  - `eventId`: Custom event ID
  - `source`: Custom source service name
  - `correlationId`: Custom correlation ID
  - `timestamp`: Custom timestamp

**Example:**

```typescript
const event = createMockEvent(
  'auth.login',
  {
    userId: 'user-123',
    email: 'test@example.com',
    success: true,
  },
  {
    eventId: 'evt-123',
    source: 'auth-service',
    correlationId: 'corr-123',
  }
);
```

### `createMockRawMessage()`

Creates a mock raw message object (second parameter to event handlers).

## Writing New Tests

When adding new event handlers, follow this pattern:

```typescript
import * as handlers from '../../src/handlers/your.handler.js';
import { createMockEvent, createMockRawMessage } from '../helpers.js';

// Mock dependencies
jest.mock('../../src/shared/observability/logging/index.js', () => ({
  default: {
    business: jest.fn(),
    security: jest.fn(),
  },
}));

jest.mock('../../src/consumer.js', () => ({
  trackMessageProcessed: jest.fn(),
}));

import logger from '../../src/shared/observability/logging/index.js';
import { trackMessageProcessed } from '../../src/consumer.js';

describe('Your Event Handlers', () => {
  const mockMessage = createMockRawMessage();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleYourEvent', () => {
    it('should log your event', async () => {
      const event = createMockEvent('your.event', {
        /* data */
      });

      await handlers.handleYourEvent(event, mockMessage);

      expect(trackMessageProcessed).toHaveBeenCalled();
      expect(logger.business).toHaveBeenCalledWith(
        'YOUR_EVENT',
        expect.objectContaining({
          /* assertions */
        })
      );
    });
  });
});
```

## Mocked Dependencies

- **Logger**: All logger methods (business, security, info, error) are mocked
- **trackMessageProcessed**: Message counter is mocked
- **Console**: Console output is suppressed during tests

## Notes

- Tests run in `NODE_ENV=test` environment
- Logging is disabled during test execution
- All mocks are cleared between tests
- Tests use Jest with ts-jest for TypeScript support
