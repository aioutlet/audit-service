export { default as DatabaseConnection } from './connection';
export { DatabaseMigrationRunner } from './migrationRunner';

// Initialize and run migrations on startup
import DatabaseConnection from './connection';
import { DatabaseMigrationRunner } from './migrationRunner';
import logger from '../observability/logging/index';

/**
 * Initialize database and run migrations
 */
export async function initializeDatabase(): Promise<void> {
  const correlationId = 'database-init';

  try {
    logger.info('🔄 Initializing database...', { correlationId });

    // Initialize database connection
    const db = DatabaseConnection.getInstance();
    const pool = await db.initialize();

    // Test connection
    const connectionOk = await db.testConnection();
    if (!connectionOk) {
      throw new Error('Database connection test failed');
    }

    // Run migrations
    const migrationRunner = new DatabaseMigrationRunner(pool);
    await migrationRunner.runMigrations();

    // Validate migrations
    const migrationsValid = await migrationRunner.validateMigrations();
    if (!migrationsValid) {
      logger.warn('⚠️  Migration validation warnings detected', { correlationId });
    }

    logger.info('✅ Database initialization completed successfully', { correlationId });
  } catch (error) {
    logger.error('❌ Database initialization failed', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorDetails: error,
    });
    throw error;
  }
}

/**
 * Get database connection pool
 */
export function getDatabasePool() {
  return DatabaseConnection.getInstance().getPool();
}

/**
 * Close database connections
 */
export async function closeDatabaseConnections(): Promise<void> {
  await DatabaseConnection.getInstance().close();
}
