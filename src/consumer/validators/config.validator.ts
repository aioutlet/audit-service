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
  SERVICE_NAME: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'SERVICE_NAME must be a non-empty string',
  },
  SERVICE_VERSION: {
    required: true,
    validator: (value) => value && /^\d+\.\d+\.\d+/.test(value),
    errorMessage: 'SERVICE_VERSION must be in semantic version format (e.g., 1.0.0)',
  },

  // Database Configuration
  POSTGRES_HOST: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'POSTGRES_HOST must be a non-empty string',
  },
  POSTGRES_PORT: {
    required: true,
    validator: (value) => isValidPort(value),
    errorMessage: 'POSTGRES_PORT must be a valid port number',
  },
  POSTGRES_DB: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'POSTGRES_DB must be a non-empty string',
  },
  POSTGRES_USER: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'POSTGRES_USER must be a non-empty string',
  },
  POSTGRES_PASSWORD: {
    required: true,
    validator: (value) => value && value.length > 0,
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

  // Message Broker Configuration
  MESSAGE_BROKER_TYPE: {
    required: true,
    validator: (value) => ['rabbitmq', 'kafka', 'azure-service-bus'].includes(value?.toLowerCase()),
    errorMessage: 'MESSAGE_BROKER_TYPE must be one of: rabbitmq, kafka, azure-service-bus',
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

  // Observability Configuration
  ENABLE_TRACING: {
    required: false,
    validator: (value) => ['true', 'false'].includes(value?.toLowerCase()),
    errorMessage: 'ENABLE_TRACING must be true or false',
    default: 'false',
  },
  OTEL_EXPORTER_OTLP_ENDPOINT: {
    required: false,
    validator: (value) => !value || isValidUrl(value),
    errorMessage: 'OTEL_EXPORTER_OTLP_ENDPOINT must be a valid URL',
  },
  CORRELATION_ID_HEADER: {
    required: false,
    validator: (value) => !value || (value.length > 0 && /^[a-z-]+$/.test(value)),
    errorMessage: 'CORRELATION_ID_HEADER must be lowercase with hyphens only',
    default: 'x-correlation-id',
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

  // Conditional validation based on MESSAGE_BROKER_TYPE
  const brokerType = process.env.MESSAGE_BROKER_TYPE?.toLowerCase();
  if (brokerType) {
    console.log(`[CONFIG] Validating ${brokerType} broker configuration...`);

    if (brokerType === 'rabbitmq') {
      const rabbitMqVars = {
        MESSAGE_BROKER_URL: {
          validator: isValidAmqpUrl,
          errorMessage: 'MESSAGE_BROKER_URL must be a valid AMQP connection string (amqp://...)',
        },
        MESSAGE_BROKER_QUEUE: {
          validator: (value: string) => value && value.length > 0,
          errorMessage: 'MESSAGE_BROKER_QUEUE must be a non-empty string',
        },
      };

      for (const [key, rule] of Object.entries(rabbitMqVars)) {
        const value = process.env[key];
        if (!value) {
          errors.push(`❌ ${key} is required when MESSAGE_BROKER_TYPE=rabbitmq`);
        } else if (!rule.validator(value)) {
          errors.push(`❌ ${key}: ${rule.errorMessage}`);
        }
      }
    } else if (brokerType === 'kafka') {
      const kafkaVars = {
        KAFKA_BROKERS: {
          validator: (value: string) => value && value.includes(':'),
          errorMessage: 'KAFKA_BROKERS must be comma-separated host:port pairs',
        },
        KAFKA_TOPIC: {
          validator: (value: string) => value && value.length > 0,
          errorMessage: 'KAFKA_TOPIC must be a non-empty string',
        },
        KAFKA_GROUP_ID: {
          validator: (value: string) => value && value.length > 0,
          errorMessage: 'KAFKA_GROUP_ID must be a non-empty string',
        },
      };

      for (const [key, rule] of Object.entries(kafkaVars)) {
        const value = process.env[key];
        if (!value) {
          errors.push(`❌ ${key} is required when MESSAGE_BROKER_TYPE=kafka`);
        } else if (!rule.validator(value)) {
          errors.push(`❌ ${key}: ${rule.errorMessage}`);
        }
      }
    } else if (brokerType === 'azure-service-bus') {
      const azureVars = {
        AZURE_SERVICE_BUS_CONNECTION_STRING: {
          validator: (value: string) => value && value.includes('Endpoint=') && value.includes('SharedAccessKey='),
          errorMessage: 'AZURE_SERVICE_BUS_CONNECTION_STRING must be a valid Azure Service Bus connection string',
        },
        AZURE_SERVICE_BUS_TOPIC: {
          validator: (value: string) => value && value.length > 0,
          errorMessage: 'AZURE_SERVICE_BUS_TOPIC must be a non-empty string',
        },
        AZURE_SERVICE_BUS_SUBSCRIPTION: {
          validator: (value: string) => value && value.length > 0,
          errorMessage: 'AZURE_SERVICE_BUS_SUBSCRIPTION must be a non-empty string',
        },
      };

      for (const [key, rule] of Object.entries(azureVars)) {
        const value = process.env[key];
        if (!value) {
          errors.push(`❌ ${key} is required when MESSAGE_BROKER_TYPE=azure-service-bus`);
        } else if (!rule.validator(value)) {
          errors.push(`❌ ${key}: ${rule.errorMessage}`);
        }
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

/**
 * Gets a validated configuration value
 * Assumes validateConfig() has already been called
 */
const getConfig = (key: string): string | undefined => {
  return process.env[key];
};

/**
 * Gets a validated configuration value as boolean
 */
const getConfigBoolean = (key: string): boolean => {
  return process.env[key]?.toLowerCase() === 'true';
};

/**
 * Gets a validated configuration value as number
 */
const getConfigNumber = (key: string): number => {
  return parseInt(process.env[key] || '0', 10);
};

/**
 * Gets a validated configuration value as array (comma-separated)
 */
const getConfigArray = (key: string): string[] => {
  return process.env[key]?.split(',').map((item) => item.trim()) || [];
};

export default validateConfig;
export { getConfig, getConfigBoolean, getConfigNumber, getConfigArray };
