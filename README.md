# 📋 Audit Service

Event-driven audit logging microservice for xShop.ai - consumes events from message broker and stores immutable audit trails in PostgreSQL for compliance and monitoring.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Install Guide](https://redis.io/docs/getting-started/))
- **Dapr CLI** 1.16+ ([Install Guide](https://docs.dapr.io/getting-started/install-dapr-cli/))

### Using Docker (Recommended)

**1. Start Services**
```bash
cd audit-service
docker-compose up -d
```

**2. Check Health**
```bash
curl http://localhost:9000/api/v1/health
```

### Manual Setup

**1. Start PostgreSQL & Redis**
```bash
# Using Docker
docker run -d --name audit-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=audit_service_db \
  postgres:15

docker run -d --name audit-redis -p 6379:6379 redis:7-alpine
```

**2. Clone & Install**
```bash
git clone https://github.com/xshopai/audit-service.git
cd audit-service
npm install
```

**3. Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env - update these values:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/audit_service_db
# REDIS_URL=redis://localhost:6379
```

**4. Initialize Dapr**
```bash
# First time only
dapr init
```

**5. Build & Run**
```bash
# Build TypeScript
npm run build

# Start with Dapr
npm run dev
```

**6. Verify**
```bash
# Check health
curl http://localhost:1012/health

# Should return: {"status":"UP","service":"audit-service"...}
```

### Common Commands

```bash
# Run tests
npm test

# Build TypeScript
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Production mode
npm start
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Developer Guide](docs/DEVELOPER_GUIDE.md) | Local setup, debugging, daily workflows |
| [📘 Technical Reference](docs/TECHNICAL.md) | Architecture, security, monitoring |
| [🤝 Contributing](docs/CONTRIBUTING.md) | Contribution guidelines and workflow |

## ⚙️ Configuration

### Required Environment Variables

```bash
# Service
NODE_ENV=development              # Environment: development, production, test
PORT=1012                         # HTTP server port

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/audit_service_db

# Cache
REDIS_URL=redis://localhost:6379

# Dapr
DAPR_HTTP_PORT=3512              # Dapr sidecar HTTP port
DAPR_GRPC_PORT=50012             # Dapr sidecar gRPC port
DAPR_APP_ID=audit-service        # Dapr application ID
DAPR_PUBSUB_NAME=event-pubsub    # Dapr pub/sub component name
```

See [.env.example](.env.example) for complete configuration options.

## ✨ Key Features

## ✨ Key Features

- Comprehensive audit logging (WHO, WHAT, WHEN, WHERE, WHY, HOW)
- High performance (10,000+ requests/second, <5ms latency)
- JWT authentication with service tokens
- Advanced search capabilities with statistics
- Configurable retention policies
- Compliance-ready with export capabilities
- Prometheus metrics and health checks
- Correlation tracking across distributed services
- Immutable audit trail storage
- Event-driven architecture with Dapr pub/sub

## 🏗️ Architecture

**Consumer-Only Pattern:**
```
Message Broker → Audit Service → PostgreSQL + Redis
                       ↓
                 Immutable Audit Trail
```

- Consumes events from all services via Dapr pub/sub
- Stores immutable audit records in PostgreSQL
- Uses Redis for caching and performance
- Provides query API for audit trail retrieval
- No event publishing (terminal consumer)

## 🔗 Related Services

- [auth-service](https://github.com/xshopai/auth-service) - Authentication events
- [user-service](https://github.com/xshopai/user-service) - User lifecycle events
- [notification-service](https://github.com/xshopai/notification-service) - Notification outcomes

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/xshopai/audit-service/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xshopai/audit-service/discussions)
- **Documentation**: [docs/](docs/)

## Quick Start

### Using Docker (Recommended)

1. **Clone and start services:**

   ```bash
   cd audit-service
   docker-compose up -d
   ```

2. **Check health:**
   ```bash
   curl http://localhost:9000/api/v1/health
   ```

### Manual Setup

1. **Prerequisites:**
   - Node.js 18+
   - PostgreSQL 15+
   - Redis 7+

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment:**

   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis settings
   ```

4. **Set up database:**

   ```bash
   # Run the initialization script
   psql -U postgres -f scripts/init-db.sql
   ```

5. **Start the service:**
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable               | Description          | Default          |
| ---------------------- | -------------------- | ---------------- |
| `NODE_ENV`             | Environment          | `development`    |
| `PORT`                 | Service port         | `9000`           |
| `DB_HOST`              | PostgreSQL host      | `localhost`      |
| `DB_PORT`              | PostgreSQL port      | `5432`           |
| `DB_NAME`              | Database name        | `audit_service`  |
| `DB_USER`              | Database user        | `postgres`       |
| `DB_PASSWORD`          | Database password    | `password`       |
| `REDIS_HOST`           | Redis host           | `localhost`      |
| `REDIS_PORT`           | Redis port           | `6379`           |
| `JWT_SECRET`           | JWT secret key       | Required         |
| `SERVICE_SECRET`       | Service token secret | Required         |
| `LOG_LEVEL`            | Logging level        | `info`           |
| `AUDIT_RETENTION_DAYS` | Log retention period | `2555` (7 years) |

## API Endpoints

### Authentication

All endpoints require service authentication via `x-service-token` header or Bearer token.

### Core Endpoints

#### Create Audit Log

```bash
POST /api/v1/logs
Authorization: Bearer <service-token>
Content-Type: application/json

{
  "action": "USER_LOGIN",
  "entity_type": "user",
  "entity_id": "user123",
  "user_id": "user123",
  "service_name": "auth-service",
  "business_context": {
    "login_method": "password",
    "success": true
  },
  "risk_level": "low"
}
```

#### Search Audit Logs

```bash
GET /api/v1/logs/search?user_id=user123&start_date=2024-01-01&limit=100
```

#### Get Statistics

```bash
GET /api/v1/stats
```

## Development

Start the development server:

```bash
npm run dev
```

The service will be available at `http://localhost:9000`
