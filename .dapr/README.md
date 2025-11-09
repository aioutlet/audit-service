# Audit Service - Dapr Integration

## Overview

This service has been refactored to use Dapr for event-driven communication. It's a pure consumer service that listens to audit events from multiple domains and writes structured audit logs to PostgreSQL.

## Architecture

- **Event Consumer**: Pure consumer (no API endpoints except health checks)
- **Dapr Pub/Sub**: Redis-based pub/sub for event consumption
- **Event Handlers**: Domain-specific handlers for audit logging
- **Health Server**: Express app on port 9000 for K8s liveness/readiness probes

## Event Subscriptions (38 total)

### Auth Events (6)

- user.registered
- user.login
- email.verification.requested
- password.reset.requested
- password.reset.completed
- account.reactivation.requested

### User Events (5)

- user.created
- user.updated
- user.deleted
- email.verified
- password.changed

### Order & Payment Events (5)

- order.placed
- order.cancelled
- order.delivered
- payment.received
- payment.failed

### Product Events (4)

- product.created
- product.updated
- product.deleted
- product.price.changed

### Cart Events (4)

- cart.item.added
- cart.item.removed
- cart.cleared
- cart.abandoned

### Inventory Events (4)

- inventory.stock.updated
- inventory.restock
- inventory.low.stock.alert
- inventory.reserved

### Review Events (5)

- review.created
- review.updated
- review.deleted
- review.moderated
- review.flagged

### Notification Events (4)

- notification.sent
- notification.delivered
- notification.failed
- notification.opened

### Admin Events (3)

- admin.action.performed
- admin.user.created
- admin.config.changed

## Folder Structure

```
.dapr/
├── components/
│   ├── pubsub.yaml          # Redis pub/sub component
│   └── secrets.yaml         # Local file secret store
├── config.yaml              # Dapr configuration (tracing, metrics)
└── secrets.json             # Local secrets (database credentials)

src/consumer/
├── events/
│   └── consumers/           # Dapr event consumers
│       ├── auth.consumer.ts
│       ├── user.consumer.ts
│       ├── order.consumer.ts
│       ├── product.consumer.ts
│       ├── cart.consumer.ts
│       ├── inventory.consumer.ts
│       ├── review.consumer.ts
│       ├── notification.consumer.ts
│       ├── admin.consumer.ts
│       └── index.ts         # Registration function
├── handlers/                # Event processing logic (unchanged)
├── server.ts                # Main entry (Express + Dapr)
└── [other folders unchanged]
```

## Prerequisites

- Node.js >= 18.0.0
- Dapr CLI installed
- Redis running locally (default: localhost:6379)
- PostgreSQL database (audit_db)

## Running with Dapr

### Linux/macOS:

```bash
chmod +x run-with-dapr.sh
./run-with-dapr.sh
```

### Windows:

```cmd
run-with-dapr.bat
```

### Manual:

```bash
dapr run \
  --app-id audit-service \
  --app-port 9000 \
  --dapr-http-port 3500 \
  --dapr-grpc-port 50008 \
  --components-path ./.dapr/components \
  --config ./.dapr/config.yaml \
  --log-level info \
  -- npm start
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in dev mode (without Dapr)
npm run dev

# Run tests
npm test
```

## Health Checks

- **Liveness**: `GET http://localhost:9000/health/live`
- **Readiness**: `GET http://localhost:9000/health/ready`
- **Health**: `GET http://localhost:9000/health`

## Configuration

### Dapr Ports

- App Port: 9000 (health server)
- Dapr HTTP Port: 3500 (sidecar API)
- Dapr gRPC Port: 50008 (sidecar gRPC)

### Environment Variables

```bash
DAPR_HOST=127.0.0.1
DAPR_HTTP_PORT=3500
NODE_ENV=development
```

## Migration Changes

### Removed (~500 LOC)

- `amqplib` dependency
- `src/consumer/messaging/` folder (RabbitMQBroker, MessageBrokerFactory)
- RabbitMQ connection management
- Channel and queue setup code

### Added (~550 LOC)

- `@dapr/dapr` 3.4.0 SDK
- Domain-specific consumer files (9 consumers)
- `.dapr/` configuration folder
- Dapr server initialization in server.ts

### Net Result

- +50 LOC but much cleaner architecture
- No broker infrastructure management
- Automatic retries and error handling
- Built-in distributed tracing
- Better separation of concerns

## Consumer Pattern

Each consumer file follows this pattern:

```typescript
import { DaprServer } from '@dapr/dapr';
import logger from '../../observability/logging/index.js';
import { handleEvent } from '../../handlers/domain.handler.js';

const PUBSUB_NAME = 'audit-pubsub';

export function registerDomainSubscriptions(server: DaprServer): void {
  server.pubsub.subscribe(PUBSUB_NAME, 'event.topic', async (data: any) => {
    try {
      logger.info('Received event', { data });
      await handleEvent(data);
    } catch (error) {
      logger.error('Error handling event', { error, data });
      throw error;
    }
  });

  logger.info('✅ Domain event subscriptions registered');
}
```

## Troubleshooting

### Dapr not connecting to Redis

```bash
# Verify Redis is running
redis-cli ping

# Check Dapr components
dapr components --app-id audit-service
```

### Events not being received

```bash
# Check Dapr subscriptions
curl http://localhost:3500/dapr/subscribe

# View Dapr logs
dapr logs --app-id audit-service
```

### Database connection issues

- Check secrets.json for correct credentials
- Verify PostgreSQL is running
- Ensure audit_db database exists

## References

- [Dapr Pub/Sub Docs](https://docs.dapr.io/developing-applications/building-blocks/pubsub/)
- [Dapr Node.js SDK](https://github.com/dapr/js-sdk)
- [Audit Service Architecture](../../docs/PLATFORM_ARCHITECTURE.md)
