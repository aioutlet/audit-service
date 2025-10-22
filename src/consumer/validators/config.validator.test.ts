import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

/**
 * Configuration Validator Tests
 * Tests for audit-service configuration validation
 */

describe('Configuration Validator', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  describe('Required Configuration', () => {
    it('should pass validation with all required environment variables', async () => {
      // Set all required environment variables
      process.env.NODE_ENV = 'development';
      process.env.PORT = '9000';
      process.env.SERVICE_NAME = 'audit-service';
      process.env.SERVICE_VERSION = '1.0.0';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'audit_db';
      process.env.POSTGRES_USER = 'audit_user';
      process.env.POSTGRES_PASSWORD = 'audit_password';
      process.env.MESSAGE_BROKER_TYPE = 'rabbitmq';
      process.env.MESSAGE_BROKER_URL = 'amqp://admin:admin123@localhost:5672/';
      process.env.MESSAGE_BROKER_QUEUE = 'audit-service.queue';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).not.toThrow();
    });

    it('should fail validation when required environment variables are missing', async () => {
      // Don't set any environment variables

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).toThrow('Configuration validation failed');
    });

    it('should fail validation with invalid PORT', async () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = 'invalid-port';
      process.env.SERVICE_NAME = 'audit-service';
      process.env.SERVICE_VERSION = '1.0.0';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).toThrow('PORT must be a valid port number');
    });

    it('should fail validation with invalid NODE_ENV', async () => {
      process.env.NODE_ENV = 'invalid-env';
      process.env.PORT = '9000';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).toThrow('NODE_ENV must be one of');
    });
  });

  describe('Message Broker Configuration', () => {
    it('should validate RabbitMQ configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '9000';
      process.env.SERVICE_NAME = 'audit-service';
      process.env.SERVICE_VERSION = '1.0.0';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'audit_db';
      process.env.POSTGRES_USER = 'audit_user';
      process.env.POSTGRES_PASSWORD = 'audit_password';
      process.env.MESSAGE_BROKER_TYPE = 'rabbitmq';
      process.env.MESSAGE_BROKER_URL = 'amqp://admin:admin123@localhost:5672/';
      process.env.MESSAGE_BROKER_QUEUE = 'audit-service.queue';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).not.toThrow();
    });

    it('should fail validation for RabbitMQ with invalid AMQP URL', async () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '9000';
      process.env.SERVICE_NAME = 'audit-service';
      process.env.SERVICE_VERSION = '1.0.0';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'audit_db';
      process.env.POSTGRES_USER = 'audit_user';
      process.env.POSTGRES_PASSWORD = 'audit_password';
      process.env.MESSAGE_BROKER_TYPE = 'rabbitmq';
      process.env.MESSAGE_BROKER_URL = 'http://invalid-url';
      process.env.MESSAGE_BROKER_QUEUE = 'audit-service.queue';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).toThrow('MESSAGE_BROKER_URL must be a valid AMQP connection string');
    });

    it('should validate Kafka configuration', async () => {
      process.env.NODE_ENV = 'development';
      process.env.PORT = '9000';
      process.env.SERVICE_NAME = 'audit-service';
      process.env.SERVICE_VERSION = '1.0.0';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'audit_db';
      process.env.POSTGRES_USER = 'audit_user';
      process.env.POSTGRES_PASSWORD = 'audit_password';
      process.env.MESSAGE_BROKER_TYPE = 'kafka';
      process.env.KAFKA_BROKERS = 'localhost:9092';
      process.env.KAFKA_TOPIC = 'aioutlet.events';
      process.env.KAFKA_GROUP_ID = 'audit-service';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      expect(() => validateConfig()).not.toThrow();
    });
  });

  describe('Optional Configuration with Defaults', () => {
    it('should set default values for optional configuration', async () => {
      // Set only required values
      process.env.NODE_ENV = 'development';
      process.env.PORT = '9000';
      process.env.SERVICE_NAME = 'audit-service';
      process.env.SERVICE_VERSION = '1.0.0';
      process.env.POSTGRES_HOST = 'localhost';
      process.env.POSTGRES_PORT = '5432';
      process.env.POSTGRES_DB = 'audit_db';
      process.env.POSTGRES_USER = 'audit_user';
      process.env.POSTGRES_PASSWORD = 'audit_password';
      process.env.MESSAGE_BROKER_TYPE = 'rabbitmq';
      process.env.MESSAGE_BROKER_URL = 'amqp://admin:admin123@localhost:5672/';
      process.env.MESSAGE_BROKER_QUEUE = 'audit-service.queue';

      const { default: validateConfig } = await import('../validators/config.validator.js');

      validateConfig();

      // Check that defaults were set
      expect(process.env.LOG_LEVEL).toBe('info');
      expect(process.env.LOG_FORMAT).toBe('console');
      expect(process.env.LOG_TO_CONSOLE).toBe('true');
      expect(process.env.ENABLE_TRACING).toBe('false');
      expect(process.env.CORRELATION_ID_HEADER).toBe('x-correlation-id');
    });
  });
});
