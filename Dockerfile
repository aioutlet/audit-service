# =============================================================================
# Multi-stage Dockerfile for Audit Service Consumer
# Consumer-only service that processes events from message broker
# =============================================================================

# -----------------------------------------------------------------------------
# Base stage - Common setup for all stages
# -----------------------------------------------------------------------------
FROM node:25-alpine AS base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S audituser -u 1001 -G nodejs

# -----------------------------------------------------------------------------
# Dependencies stage - Install all dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --include=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Development stage - For local development with hot reload
# -----------------------------------------------------------------------------
FROM dependencies AS development

# Copy application code
# Note: In development, mount code as volume: docker run -v ./:/app
COPY --chown=audituser:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown -R audituser:nodejs logs

# Switch to non-root user
USER audituser

# Expose health port only
EXPOSE 9000

# Health check on liveness endpoint (using Node.js to avoid curl dependency)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init and start development server
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build stage - Build the TypeScript application
# -----------------------------------------------------------------------------
FROM dependencies AS build

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove development dependencies
RUN npm ci --omit=dev && npm cache clean --force

# -----------------------------------------------------------------------------
# Production stage - Optimized for production deployment
# -----------------------------------------------------------------------------
FROM base AS production

# Copy only production dependencies and built code
COPY --from=build --chown=audituser:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=audituser:nodejs /app/dist ./dist
COPY --from=build --chown=audituser:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p logs && chown -R audituser:nodejs logs

# Switch to non-root user
USER audituser

# Expose health port only (no API endpoints)
EXPOSE 9000

# Health check on liveness endpoint for K8s/Docker (using Node.js to avoid curl dependency)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:9000/health/live', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly (important for consumers)
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

# Labels for better image management and security scanning
LABEL maintainer="AIOutlet Team"
LABEL service="audit-service"
LABEL type="consumer"
LABEL version="1.0.0"
LABEL description="Event-driven audit logging consumer"
LABEL org.opencontainers.image.source="https://github.com/aioutlet/aioutlet"
LABEL org.opencontainers.image.description="Audit Service for AIOutlet platform"
LABEL org.opencontainers.image.vendor="AIOutlet"
