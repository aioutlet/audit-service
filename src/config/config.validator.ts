/**
 * Configuration Validator for Audit Service
 * Validates all required environment variables at application startup
 * Fails fast if any configuration is missing or invalid
 *
 * NOTE: This module MUST NOT import logger, as the logger depends on validated config.
 * Uses console.log for validation messages.
 */

/**
 * Validates a URL format
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates a port number
 */
const isValidPort = (port: string | number): boolean => {
  const portNum = parseInt(port.toString(), 10);
  return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
};

/**
 * Validates log level
 */
const isValidLogLevel = (level: string): boolean => {
  const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
  return validLevels.includes(level?.toLowerCase());
};

/**
 * Validates NODE_ENV
 */
const isValidNodeEnv = (env: string): boolean => {
  const validEnvs = ['development', 'production', 'test', 'staging'];
  return validEnvs.includes(env?.toLowerCase());
};

/**
 * Validates AMQP URL format
 */
const isValidAmqpUrl = (url: string): boolean => {
  return url.startsWith('amqp://') || url.startsWith('amqps://');
};

interface ValidationRule {
  required: boolean;
  validator: (value: string) => boolean;
  errorMessage: string;
  default?: string;
}

/**
 * Configuration validation rules for audit-service consumer
 */
const validationRules: Record<string, ValidationRule> = {
  // Service Configuration
  NODE_ENV: {
    required: true,
    validator: isValidNodeEnv,
    errorMessage: 'NODE_ENV must be one of: development, production, test, staging',
  },
  PORT: {
    required: true,
    validator: (value) => isValidPort(value),
    errorMessage: 'PORT must be a valid port number (1-65535)',
  },
  NAME: {
    required: true,
    validator: (value) => Boolean(value && value.length > 0),
    errorMessage: 'NAME must be a non-empty string',
  },
  VERSION: {
    required: true,
    validator: (value) => Boolean(value && /^\d+\.\d+\.\d+/.test(value)),
    errorMessage: 'VERSION must be in semantic version format (e.g., 1.0.0)',
  },

  // Database Configuration
  POSTGRES_HOST: {
    required: true,
    validator: (value) => Boolean(value && value.length > 0),
    errorMessage: 'POSTGRES_HOST must be a non-empty string',
  },
  POSTGRES_PORT: {
    required: true,
    validator: (value) => isValidPort(value),
    errorMessage: 'POSTGRES_PORT must be a valid port number',
  },
  POSTGRES_DB: {
    required: true,
    validator: (value) => Boolean(value && value.length > 0),
    errorMessage: 'POSTGRES_DB must be a non-empty string',
  },
  POSTGRES_USER: {
    required: true,
    validator: (value) => Boolean(value && value.length > 0),
    errorMessage: 'POSTGRES_USER must be a non-empty string',
  },
  POSTGRES_PASSWORD: {
    required: true,
    validator: (value) => Boolean(value && value.length > 0),
    errorMessage: 'POSTGRES_PASSWORD must be a non-empty string',
  },
  DB_SSL: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'DB_SSL must be true or false',
    default: 'false',
  },
  DB_POOL_MIN: {
    required: false,
    validator: (value) => !isNaN(parseInt(value, 10)) && parseInt(value, 10) >= 0,
    errorMessage: 'DB_POOL_MIN must be a non-negative number',
    default: '5',
  },
  DB_POOL_MAX: {
    required: false,
    validator: (value) => !isNaN(parseInt(value, 10)) && parseInt(value, 10) > 0,
    errorMessage: 'DB_POOL_MAX must be a positive number',
    default: '20',
  },

  // Logging Configuration
  LOG_LEVEL: {
    required: false,
    validator: isValidLogLevel,
    errorMessage: 'LOG_LEVEL must be one of: error, warn, info, http, verbose, debug, silly',
    default: 'info',
  },
  LOG_FORMAT: {
    required: false,
    validator: (value) => !value || ['json', 'console'].includes(value?.toLowerCase()),
    errorMessage: 'LOG_FORMAT must be either json or console',
    default: 'console',
  },
  LOG_TO_CONSOLE: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'LOG_TO_CONSOLE must be true or false',
    default: 'true',
  },
  LOG_TO_FILE: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'LOG_TO_FILE must be true or false',
    default: 'false',
  },
  LOG_FILE_PATH: {
    required: false,
    validator: (value) => !value || (value.length > 0 && value.includes('.')),
    errorMessage: 'LOG_FILE_PATH must be a valid file path with extension',
    default: './logs/audit-service.log',
  },
};

/**
 * Validates all environment variables according to the rules
 * @throws {Error} - If any required variable is missing or invalid
 */
const validateConfig = (): void => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log('[CONFIG] Validating audit-service environment configuration...');

  // Validate each rule
  for (const [key, rule] of Object.entries(validationRules)) {
    const value = process.env[key];

    // Check if required variable is missing
    if (rule.required && !value) {
      errors.push(`❌ ${key} is required but not set`);
      continue;
    }

    // Skip validation if value is not set and not required
    if (!value && !rule.required) {
      if (rule.default) {
        warnings.push(`⚠️  ${key} not set, using default: ${rule.default}`);
        process.env[key] = rule.default;
      }
      continue;
    }

    // Validate the value
    if (value && rule.validator && !rule.validator(value)) {
      errors.push(`❌ ${key}: ${rule.errorMessage}`);
      if (value.length > 100) {
        errors.push(`   Current value: ${value.substring(0, 100)}...`);
      } else {
        errors.push(`   Current value: ${value}`);
      }
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach((warning) => console.warn(warning));
  }

  // If there are errors, log them and throw
  if (errors.length > 0) {
    console.error('[CONFIG] ❌ Configuration validation failed:');
    errors.forEach((error) => console.error(error));
    console.error('\n💡 Please check your .env file and ensure all required variables are set correctly.');
    throw new Error(`Configuration validation failed with ${errors.length} error(s)`);
  }

  console.log('[CONFIG] ✅ All required environment variables are valid');
};

export default validateConfig;
