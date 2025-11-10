/**
 * Dapr Secret Manager
 * Provides secret management using Dapr's secret store building block
 * Falls back to environment variables if Dapr is not available
 */

import { DaprClient } from '@dapr/dapr';
import logger from '../core/logger.js';
import { config } from '../config/index.js';

export class DaprSecretManager {
  private static instance: DaprSecretManager;
  private daprEnabled: boolean;
  private environment: string;
  private daprHost: string;
  private daprPort: string;
  private secretStoreName: string;
  private secretCache: Map<string, string>;
  private cacheExpiry: Map<string, number>;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.daprEnabled = (process.env.DAPR_ENABLED || 'true').toLowerCase() === 'true';
    this.environment = config.env;
    this.daprHost = process.env.DAPR_HOST || '127.0.0.1';
    this.daprPort = process.env.DAPR_HTTP_PORT || '3500';
    this.secretCache = new Map();
    this.cacheExpiry = new Map();

    // Use appropriate secret store based on environment
    if (this.environment === 'production') {
      this.secretStoreName = 'azure-keyvault-secret-store';
    } else {
      this.secretStoreName = 'local-secret-store';
    }

    logger.info('Secret manager initialized', {
      event: 'secret_manager_init',
      daprEnabled: this.daprEnabled,
      environment: this.environment,
      secretStore: this.secretStoreName,
    });
  }

  static getInstance(): DaprSecretManager {
    if (!DaprSecretManager.instance) {
      DaprSecretManager.instance = new DaprSecretManager();
    }
    return DaprSecretManager.instance;
  }

  /**
   * Get a secret value
   * Priority:
   * 1. Cache (if not expired)
   * 2. Dapr secret store (if enabled and available)
   * 3. Environment variable (fallback)
   */
  async getSecret(secretName: string): Promise<string | null> {
    // Check cache first
    const cached = this.getCachedSecret(secretName);
    if (cached) {
      return cached;
    }

    // If Dapr is disabled, use environment variables
    if (!this.daprEnabled) {
      const value = process.env[secretName];
      if (value) {
        logger.debug('Retrieved secret from environment', {
          event: 'secret_retrieved',
          secretName,
          source: 'env',
        });
        this.cacheSecret(secretName, value);
      }
      return value || null;
    }

    // Try Dapr secret store
    try {
      const client = new DaprClient({
        daprHost: this.daprHost,
        daprPort: this.daprPort,
      });

      const response = await client.secret.get(this.secretStoreName, secretName);

      // Handle different response types
      if (response && typeof response === 'object') {
        const responseObj = response as Record<string, any>;
        const value = responseObj[secretName];
        if (value !== undefined && value !== null) {
          const stringValue = String(value);
          logger.debug('Retrieved secret from Dapr', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
            store: this.secretStoreName,
          });
          this.cacheSecret(secretName, stringValue);
          return stringValue;
        }

        // If not found by key, try getting first value
        const values = Object.values(responseObj);
        if (values.length > 0 && values[0] !== undefined) {
          const stringValue = String(values[0]);
          logger.debug('Retrieved secret from Dapr (first value)', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
            store: this.secretStoreName,
          });
          this.cacheSecret(secretName, stringValue);
          return stringValue;
        }
      }

      logger.warn('Secret not found in Dapr store', {
        event: 'secret_not_found',
        secretName,
        store: this.secretStoreName,
      });
    } catch (error) {
      logger.warn(`Failed to get secret from Dapr: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        event: 'secret_fetch_error',
        secretName,
        error: error instanceof Error ? error.message : 'Unknown error',
        store: this.secretStoreName,
      });
    }

    // Fallback to environment variable
    const envValue = process.env[secretName];
    if (envValue) {
      logger.debug('Retrieved secret from environment (fallback)', {
        event: 'secret_retrieved',
        secretName,
        source: 'env_fallback',
      });
      this.cacheSecret(secretName, envValue);
      return envValue;
    }

    return null;
  }

  /**
   * Get multiple secrets at once
   */
  async getSecrets(secretNames: string[]): Promise<Record<string, string | null>> {
    const secrets: Record<string, string | null> = {};
    const promises = secretNames.map(async (name) => {
      secrets[name] = await this.getSecret(name);
    });
    await Promise.all(promises);
    return secrets;
  }

  /**
   * Get database configuration from secrets
   */
  async getDatabaseConfig(): Promise<{
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  }> {
    const [host, port, name, user, password] = await Promise.all([
      this.getSecret('database:host') || this.getSecret('POSTGRES_HOST'),
      this.getSecret('database:port') || this.getSecret('POSTGRES_PORT'),
      this.getSecret('database:name') || this.getSecret('POSTGRES_DB'),
      this.getSecret('database:user') || this.getSecret('POSTGRES_USER'),
      this.getSecret('database:password') || this.getSecret('POSTGRES_PASSWORD'),
    ]);

    return {
      host: host || config.database.host,
      port: port ? parseInt(port, 10) : config.database.port,
      name: name || config.database.name,
      user: user || config.database.user,
      password: password || config.database.password,
    };
  }

  /**
   * Cache a secret
   */
  private cacheSecret(secretName: string, value: string): void {
    this.secretCache.set(secretName, value);
    this.cacheExpiry.set(secretName, Date.now() + this.CACHE_TTL_MS);
  }

  /**
   * Get secret from cache if not expired
   */
  private getCachedSecret(secretName: string): string | null {
    const expiry = this.cacheExpiry.get(secretName);
    if (expiry && Date.now() < expiry) {
      const value = this.secretCache.get(secretName);
      if (value) {
        logger.debug('Retrieved secret from cache', {
          event: 'secret_retrieved',
          secretName,
          source: 'cache',
        });
        return value;
      }
    }
    return null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.secretCache.clear();
    this.cacheExpiry.clear();
    logger.info('Secret cache cleared');
  }
}

export default DaprSecretManager.getInstance();
