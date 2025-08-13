# Audit Service

A comprehensive audit logging microservice built with Node.js, TypeScript, PostgreSQL, and Redis. This service provides centralized audit logging capabilities for all microservices in the AI Outlet ecosystem.

## Features

- 🔍 **Comprehensive Audit Logging**: Track WHO, WHAT, WHEN, WHERE, WHY, and HOW of all system operations
- 🚀 **High Performance**: Built for 10,000+ requests/second with <5ms latency
- 🔒 **Security-First**: JWT authentication, service tokens, rate limiting, and CORS protection
- 📊 **Rich Search & Analytics**: Advanced search capabilities with statistics and reporting
- 🏢 **Compliance Ready**: Configurable retention policies, export capabilities, and compliance tagging
- 🐳 **Container Ready**: Full Docker support with docker-compose configuration
- 📈 **Metrics & Monitoring**: Prometheus metrics and health checks
- 🔄 **Correlation Tracking**: Request correlation across distributed services

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
