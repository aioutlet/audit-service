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

    if (!host || !port || !database || !username || !password) {
      throw new Error('Missing required database secrets from Dapr');
    }

    return {
      host,
      port: parseInt(port, 10),
      database,
      username,
      password,
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

    if (!url || !queue) {
      throw new Error('Missing required message broker secrets from Dapr');
    }

    return {
      url,
      queue,
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

    if (!secret) {
      throw new Error('JWT_SECRET not found in Dapr secret store');
    }

    return {
      secret,
    };
  }
}

// Global instance
export const secretManager = new DaprSecretManager();

// Helper functions for easy access
export const getDatabaseConfig = () => secretManager.getDatabaseConfig();
export const getMessageBrokerConfig = () => secretManager.getMessageBrokerConfig();
export const getJwtConfig = () => secretManager.getJwtConfig();
