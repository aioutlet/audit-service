import winston from 'winston';
import { config } from './config.js';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = process.env.LOG_FORMAT || 'json';

const format =
  logFormat === 'json'
    ? winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json())
    : winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
        })
      );

const winstonLogger = winston.createLogger({
  level: logLevel,
  format,
  defaultMeta: {
    service: config.service.name,
    version: config.service.version,
    environment: config.env,
  },
  transports: [
    new winston.transports.Console({
      silent: process.env.NODE_ENV === 'test',
    }),
  ],
});

class Logger {
  info(message: string, meta?: any): void {
    winstonLogger.info(message, meta);
  }

  warn(message: string, meta?: any): void {
    winstonLogger.warn(message, meta);
  }

  error(message: string, meta?: any): void {
    winstonLogger.error(message, meta);
  }

  debug(message: string, meta?: any): void {
    winstonLogger.debug(message, meta);
  }

  business(event: string, meta?: any): void {
    winstonLogger.info(event, { ...meta, eventType: 'business' });
  }

  security(event: string, meta?: any): void {
    winstonLogger.warn(event, { ...meta, eventType: 'security' });
  }

  audit(event: string, meta?: any): void {
    winstonLogger.info(event, { ...meta, eventType: 'audit' });
  }

  /**
   * Create a logger bound to a trace context (traceId and spanId)
   */
  withTraceContext(traceId: string, spanId?: string) {
    const traceMetadata = { traceId, ...(spanId && { spanId }) };
    return {
      debug: (message: string, metadata?: any) => this.debug(message, { ...metadata, ...traceMetadata }),
      info: (message: string, metadata?: any) => this.info(message, { ...metadata, ...traceMetadata }),
      warn: (message: string, metadata?: any) => this.warn(message, { ...metadata, ...traceMetadata }),
      error: (message: string, metadata?: any) => this.error(message, { ...metadata, ...traceMetadata }),
      business: (event: string, metadata?: any) => this.business(event, { ...metadata, ...traceMetadata }),
      security: (event: string, metadata?: any) => this.security(event, { ...metadata, ...traceMetadata }),
      audit: (event: string, metadata?: any) => this.audit(event, { ...metadata, ...traceMetadata }),
    };
  }
}

const logger = new Logger();

export default logger;
export { Logger };
