import { Pool, PoolConfig } from 'pg';
import { config } from '../config/index.js';
import logger from '../core/logger';
import { getDatabaseConfig } from '../clients/index.js';

/**
 * Database connection pool for PostgreSQL
 */
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: Pool | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Initialize database connection pool
   */
  async initialize(): Promise<Pool> {
    if (this.pool) {
      return this.pool;
    }

    // Try to get database configuration from Dapr secrets first
    let dbConfig;
    try {
      dbConfig = await getDatabaseConfig();
      logger.info('Database configuration loaded from Dapr secrets', {
        component: 'database-pool',
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
      });
    } catch (error) {
      logger.warn('Failed to load database config from Dapr, using environment variables', {
        component: 'database-pool',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      dbConfig = {
        host: config.database.host,
        port: config.database.port,
        database: config.database.name,
        username: config.database.user,
        password: config.database.password,
        ssl: config.database.ssl,
      };
    }

    const poolConfig: PoolConfig = {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl || config.database.ssl,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('[ERROR] PostgreSQL pool error', {
        component: 'database-pool',
        error: err.message,
        stack: err.stack,
      });
    });

    // Log successful connection
    logger.info('[SUCCESS] PostgreSQL connection pool initialized', {
      component: 'database-pool',
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      poolMin: config.database.poolMin,
      poolMax: config.database.poolMax,
    });

    return this.pool;
  }

  /**
   * Get the connection pool
   */
  getPool(): Pool {
    if (!this.pool) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const pool = await this.initialize();
      const client = await pool.connect();

      try {
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        logger.info('[SUCCESS] Database connection test successful', {
          component: 'database-test',
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version.split(' ').slice(0, 2).join(' '),
        });
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('[ERROR] Database connection test failed', {
        component: 'database-test',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('[SUCCESS] Database connection pool closed', {
        component: 'database-pool',
      });
    }
  }
}

export default DatabaseConnection;
