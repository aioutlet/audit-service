import Logger from '../observability/logging/logger.js';
import { config } from '@/config';

// Create and export the logger instance with proper configuration
export const logger = new Logger({
  serviceName: config.service.name,
  version: config.service.version,
  environment: config.env,
  enableConsole: true,
  enableFile: true,
  logLevel: (config.logging.level?.toUpperCase() as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL') || 'INFO',
  format: config.logging.format === 'json' ? 'json' : 'console',
  enableTracing: true,
  filePath: config.logging.filePath || './logs/audit-service.log',
});

// Create a stream object with a 'write' function that will be used by morgan
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim()); // Use info instead of http since Logger doesn't have http method
  },
};
