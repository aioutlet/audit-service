import { Pool, PoolConfig } from 'pg';
import { config } from '../core/config';
import logger from '../core/logger';

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

    const poolConfig: PoolConfig = {
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    this.pool = new Pool(poolConfig);

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('❌ PostgreSQL pool error', {
        correlationId: 'database-pool',
        error: err.message,
        stack: err.stack,
      });
    });

    // Log successful connection
    logger.info('✅ PostgreSQL connection pool initialized', {
      correlationId: 'database-pool',
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
        logger.info('✅ Database connection test successful', {
          correlationId: 'database-test',
          currentTime: result.rows[0].current_time,
          version: result.rows[0].version.split(' ').slice(0, 2).join(' '),
        });
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('❌ Database connection test failed', {
        correlationId: 'database-test',
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
      logger.info('✅ Database connection pool closed', {
        correlationId: 'database-pool',
      });
    }
  }
}

export default DatabaseConnection;
