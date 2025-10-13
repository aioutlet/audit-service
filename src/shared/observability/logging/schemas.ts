/**
 * Unified Logging Schema for AIOutlet Services
 * This schema standardizes logging across all microservices regardless of technology stack
 */

export interface StandardLogEntry {
  timestamp: string; // ISO 8601 timestamp (e.g., "2025-08-31T10:00:00.000Z")
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'; // Log level
  service: string; // Service name (e.g., "audit-service")
  version: string; // Service version (e.g., "1.0.0")
  environment: string; // Environment (development|staging|production)
  correlationId: string | null; // Request correlation UUID
  traceId?: string; // Distributed tracing trace ID
  spanId?: string; // Distributed tracing span ID
  message: string; // Human readable log message
  operation?: string; // Operation or method name
  duration?: number; // Duration in milliseconds
  userId?: string; // User identifier
  businessEvent?: string; // Business event type
  securityEvent?: string; // Security event type
  error?: ErrorInfo; // Error information
  metadata?: Record<string, any>; // Additional metadata
}

export interface ErrorInfo {
  name: string; // Error name/type
  message: string; // Error message
  stack?: string; // Stack trace
}

export interface LoggerConfig {
  serviceName: string; // Name of the service
  version: string; // Version of the service
  environment: string; // Current environment
  enableConsole: boolean; // Enable console logging
  enableFile: boolean; // Enable file logging
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'; // Minimum log level
  format: 'json' | 'console'; // Output format
  filePath?: string; // Log file path (if file logging enabled)
  enableTracing: boolean; // Enable OpenTelemetry tracing integration
}

/**
 * Log levels with numeric values for comparison
 */
export const LOG_LEVELS = {
  DEBUG: { value: 0, name: 'DEBUG' },
  INFO: { value: 1, name: 'INFO' },
  WARN: { value: 2, name: 'WARN' },
  ERROR: { value: 3, name: 'ERROR' },
  FATAL: { value: 4, name: 'FATAL' },
} as const;

/**
 * Default logger configuration
 */
export const DEFAULT_CONFIG: LoggerConfig = {
  serviceName: 'audit-service',
  version: '1.0.0',
  environment: 'development',
  enableConsole: true,
  enableFile: false,
  logLevel: 'INFO',
  format: 'console',
  enableTracing: true,
};

/**
 * Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS: Record<string, LoggerConfig> = {
  local: {
    ...DEFAULT_CONFIG,
    logLevel: 'DEBUG',
    format: 'console',
    enableFile: true,
    enableTracing: true,
  },
  development: {
    ...DEFAULT_CONFIG,
    logLevel: 'DEBUG',
    format: 'json',
    enableFile: true,
    enableTracing: true,
  },
  staging: {
    ...DEFAULT_CONFIG,
    logLevel: 'INFO',
    format: 'json',
    enableFile: true,
    enableTracing: true,
  },
  production: {
    ...DEFAULT_CONFIG,
    logLevel: 'INFO',
    format: 'json',
    enableFile: true,
    enableTracing: true,
  },
  test: {
    ...DEFAULT_CONFIG,
    logLevel: 'ERROR',
    format: 'json',
    enableConsole: false,
    enableFile: false,
    enableTracing: false,
  },
};

/**
 * Validates a log entry against the unified schema
 * @param logEntry - Log entry to validate
 * @returns True if valid
 */
export function validateLogEntry(logEntry: any): logEntry is StandardLogEntry {
  const required = ['timestamp', 'level', 'service', 'version', 'environment', 'message'];

  // Check required fields
  for (const field of required) {
    if (!logEntry.hasOwnProperty(field) || logEntry[field] === null || logEntry[field] === undefined) {
      return false;
    }
  }

  // Validate level
  if (!Object.keys(LOG_LEVELS).includes(logEntry.level)) {
    return false;
  }

  // Validate timestamp format (basic ISO 8601 check)
  if (!logEntry.timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
    return false;
  }

  return true;
}

/**
 * Creates a base log entry with standard fields
 * @param config - Logger configuration
 * @param level - Log level
 * @param message - Log message
 * @param additionalData - Additional data to include
 * @returns Standardized log entry
 */
export function createBaseLogEntry(
  config: LoggerConfig,
  level: string,
  message: string,
  additionalData: Record<string, any> = {}
): StandardLogEntry {
  const baseEntry: StandardLogEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase() as StandardLogEntry['level'],
    service: config.serviceName,
    version: config.version,
    environment: config.environment,
    correlationId: additionalData.correlationId || null,
    message: message,
  };

  // Add optional fields if they exist
  const optionalFields = [
    'traceId',
    'spanId',
    'operation',
    'duration',
    'userId',
    'businessEvent',
    'securityEvent',
    'error',
    'metadata',
  ];

  optionalFields.forEach((field) => {
    if (additionalData[field] !== undefined && additionalData[field] !== null) {
      (baseEntry as any)[field] = additionalData[field];
    }
  });

  return baseEntry;
}
