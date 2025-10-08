/**
 * Logging module exports
 * Provides centralized access to all logging functionality
 */

import Logger from './logger.js';
import { config } from '../../config/index.js';

// Create and export the logger instance with proper configuration
const logger = new Logger({
  serviceName: config.service.name,
  version: config.service.version,
  environment: config.env,
  logLevel: (config.logging.level?.toUpperCase() as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL') || 'INFO',
  format: config.logging.format === 'json' ? 'json' : 'console',
  enableConsole: true,
  enableFile: false, // Disable file logging by default, enable via env if needed
  enableTracing: true,
});

export default logger;

// Also export the Logger class for advanced usage
export { Logger };

// Export schemas and utilities
export {
  LOG_LEVELS,
  DEFAULT_CONFIG,
  ENVIRONMENT_CONFIGS,
  validateLogEntry,
  createBaseLogEntry,
  type LoggerConfig,
  type StandardLogEntry,
  type ErrorInfo,
} from './schemas.js';

// Export formatters
export { createJsonFormat, createConsoleFormat } from './formatters.js';
