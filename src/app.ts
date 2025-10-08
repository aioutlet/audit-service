import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import 'express-async-errors';

import { config } from '@/config';
import logger from '@/observability/logging';
import { errorHandler } from '@/middleware/errorHandler';
import { correlationIdMiddleware } from '@/middleware/correlationId';
import { requestLogger } from '@/middleware/requestLogger';
import { auditRoutes } from '@/routes/audit.routes';
import { DatabaseService } from '@/services/database';
import { health, readiness, liveness, metrics, setServices } from '@/controllers/operational.controller';
import { initializeMessageBroker, closeMessageBroker } from '@/messaging';

class AuditServiceApp {
  public app: express.Application;
  private databaseService: DatabaseService;

  constructor() {
    this.app = express();
    this.databaseService = new DatabaseService();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          },
        },
      })
    );

    // CORS configuration
    this.app.use(
      cors({
        origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
        credentials: config.cors.credentials,
      })
    );

    // Compression
    this.app.use(compression());

    // Rate limiting
    if (config.rateLimit.enabled) {
      const limiter = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: {
          error: 'Too many requests from this IP',
          retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use('/api/', limiter);
    }

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (config.env !== 'test') {
      this.app.use(
        morgan('combined', {
          stream: { write: (message) => logger.info(message.trim()) },
        })
      );
    }

    // Custom middleware
    this.app.use(correlationIdMiddleware);
    this.app.use(requestLogger);
  }

  private initializeRoutes(): void {
    // API routes (protected)
    this.app.use('/api/v1/audit', auditRoutes);

    // Operational endpoints (for monitoring, load balancers, K8s probes)
    this.app.get('/health', health); // Main health check
    this.app.get('/health/ready', readiness); // Readiness probe
    this.app.get('/health/live', liveness); // Liveness probe
    this.app.get('/metrics', metrics); // Basic metrics

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'audit-service',
        version: config.service.version,
        environment: config.env,
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseService.initialize();

      // Initialize message broker and start consuming events
      await initializeMessageBroker();

      // Inject initialized services into operational controller
      setServices(this.databaseService);
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();

      const server = this.app.listen(config.port, config.host, () => {
        logger.info(`🚀 Audit Service listening on ${config.host}:${config.port}`);
        logger.info(`📖 Environment: ${config.env}`);
        logger.info(`🗄️ Database: ${config.database.host}:${config.database.port}/${config.database.name}`);

        if (config.metrics.enabled) {
          logger.info(`📊 Metrics available at http://${config.host}:${config.port}/metrics`);
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', () => this.gracefulShutdown(server));
      process.on('SIGINT', () => this.gracefulShutdown(server));
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(server: any): Promise<void> {
    logger.info('Received shutdown signal, starting graceful shutdown...');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Close message broker connection
        await closeMessageBroker();
        logger.info('Message broker connection closed');

        // Close database connection
        await this.databaseService.close();
        logger.info('Database connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force close after timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 30000);
  }
}

export default AuditServiceApp;
