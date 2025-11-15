/**
 * Dapr Secret Management Service for Audit Service
 * Provides secret management using Dapr's secret store building block.
 */

import { DaprClient } from '@dapr/dapr';
import logger from '../core/logger.js';
import { config } from '../config/index.js';

class DaprSecretManager {
  private daprHost: string;
  private daprPort: number;
  private secretStoreName: string;

  constructor() {
    this.daprHost = config.dapr.host;
    this.daprPort = config.dapr.httpPort;
    this.secretStoreName = config.dapr.secretStoreName;

    logger.info('Secret manager initialized', {
      event: 'secret_manager_init',
      secretStore: this.secretStoreName,
      daprHost: this.daprHost,
      daprPort: this.daprPort,
    });
  }

  /**
   * Get a secret value from Dapr secret store
   * @param secretName - Name of the secret to retrieve
   * @returns Secret value or null if not found
   */
  async getSecret(secretName: string): Promise<string | null> {
    try {
      const client = new DaprClient({
        daprHost: this.daprHost,
        daprPort: String(this.daprPort),
      });

      const response = await client.secret.get(this.secretStoreName, secretName);

      // Handle different response types
      if (response && typeof response === 'object') {
        // Response is typically an object like { secretName: 'value' }
        const value = response[secretName];
        if (value !== undefined && value !== null) {
          logger.debug('Retrieved secret from Dapr', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
            store: this.secretStoreName,
          });
          return String(value);
        }

        // If not found by key, try getting first value
        const values = Object.values(response);
        if (values.length > 0 && values[0] !== undefined) {
          logger.debug('Retrieved secret from Dapr (first value)', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
            store: this.secretStoreName,
          });
          return String(values[0]);
        }
      }

      // If we get here, no value was found in Dapr
      logger.error('Secret not found in Dapr store', {
        event: 'secret_not_found',
        secretName,
        store: this.secretStoreName,
      });
      return null;
    } catch (error) {
      logger.error(`Failed to get secret from Dapr: ${(error as Error).message}`, {
        event: 'secret_retrieval_error',
        secretName,
        error: (error as Error).message,
        store: this.secretStoreName,
      });
      throw error;
    }
  }

  /**
   * Get multiple secrets at once
   * @param secretNames - List of secret names to retrieve
   * @returns Object mapping secret names to their values
   */
  async getMultipleSecrets(secretNames: string[]): Promise<Record<string, string | null>> {
    const secrets: Record<string, string | null> = {};
    for (const name of secretNames) {
      secrets[name] = await this.getSecret(name);
    }
    return secrets;
  }

  /**
   * Get database configuration from secrets
   * @returns Database connection parameters
   */
  async getDatabaseConfig(): Promise<{
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
  }> {
    const [host, port, database, username, password, ssl] = await Promise.all([
      this.getSecret('POSTGRES_HOST'),
      this.getSecret('POSTGRES_PORT'),
      this.getSecret('POSTGRES_DB'),
      this.getSecret('POSTGRES_USER'),
      this.getSecret('POSTGRES_PASSWORD'),
      this.getSecret('DB_SSL'),
    ]);

    return {
      host: host || 'localhost',
      port: parseInt(port || '5434', 10),
      database: database || 'audit_service_db',
      username: username || 'admin',
      password: password || 'admin123',
      ssl: ssl === 'true',
    };
  }

  /**
   * Get message broker configuration from secrets
   * @returns Message broker configuration parameters
   */
  async getMessageBrokerConfig(): Promise<{
    url: string;
    queue: string;
  }> {
    const [url, queue] = await Promise.all([
      this.getSecret('MESSAGE_BROKER_URL'),
      this.getSecret('MESSAGE_BROKER_QUEUE'),
    ]);

    return {
      url: url || 'amqp://admin:admin123@localhost:5672/',
      queue: queue || 'audit-service.queue',
    };
  }

  /**
   * Get JWT configuration from secrets
   * @returns JWT configuration parameters
   */
  async getJwtConfig(): Promise<{
    secret: string;
  }> {
    const secret = await this.getSecret('JWT_SECRET');

    return {
      secret: secret || 'default-secret-key',
    };
  }
}

// Global instance
export const secretManager = new DaprSecretManager();

// Helper functions for easy access
export const getDatabaseConfig = () => secretManager.getDatabaseConfig();
export const getMessageBrokerConfig = () => secretManager.getMessageBrokerConfig();
export const getJwtConfig = () => secretManager.getJwtConfig();
