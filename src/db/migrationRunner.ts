import { Pool, PoolClient } from 'pg';
import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import logger from '../core/logger';

interface Migration {
  name: string;
  filePath: string;
  content: string;
  checksum: string;
}

interface MigrationRecord {
  id: number;
  migration_name: string;
  executed_at: Date;
  execution_time_ms: number;
  checksum: string;
}

export class DatabaseMigrationRunner {
  private pool: Pool;
  private migrationsDir: string;

  constructor(pool: Pool) {
    this.pool = pool;
    // Use relative path from current working directory
    this.migrationsDir = join(process.cwd(), 'src', 'consumer', 'database', 'migrations');

    // Debug logging
    logger.debug('Migration runner initialized', {
      component: 'migration-runner',
      migrationsDir: this.migrationsDir,
      cwd: process.cwd(),
    });
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    const component = 'migration-runner';

    try {
      logger.info('🔄 Starting database migration process...', { component });

      // Ensure migration_history table exists
      await this.ensureMigrationHistoryTable();

      // Get all migration files
      const availableMigrations = await this.getAvailableMigrations();
      logger.info(`📁 Found ${availableMigrations.length} migration files`, { component });

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      const executedNames = new Set(executedMigrations.map((m) => m.migration_name));

      // Filter pending migrations
      const pendingMigrations = availableMigrations.filter((migration) => !executedNames.has(migration.name));

      if (pendingMigrations.length === 0) {
        logger.info('✅ No pending migrations to execute', { component });
        return;
      }

      logger.info(`🚀 Executing ${pendingMigrations.length} pending migrations`, {
        component,
        pendingMigrations: pendingMigrations.map((m) => m.name),
      });

      // Execute each pending migration
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      logger.info('✅ All migrations completed successfully', { component });
    } catch (error) {
      logger.error('❌ Migration process failed', {
        component,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Ensure the migration_history table exists
   */
  private async ensureMigrationHistoryTable(): Promise<void> {
    const client = await this.pool.connect();

    try {
      const query = `
        CREATE TABLE IF NOT EXISTS migration_history (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          execution_time_ms INTEGER NOT NULL,
          checksum VARCHAR(64) NOT NULL
        );
        
        CREATE INDEX IF NOT EXISTS idx_migration_history_migration_name 
        ON migration_history(migration_name);
        
        CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at 
        ON migration_history(executed_at DESC);
      `;

      await client.query(query);
      logger.debug('✅ Migration history table ensured', { component: 'migration-runner' });
    } finally {
      client.release();
    }
  }

  /**
   * Get all available migration files
   */
  private async getAvailableMigrations(): Promise<Migration[]> {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort(); // Ensure consistent ordering

      const migrations: Migration[] = [];

      for (const file of sqlFiles) {
        const filePath = join(this.migrationsDir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const checksum = this.calculateChecksum(content);

        migrations.push({
          name: basename(file, '.sql'),
          filePath,
          content,
          checksum,
        });
      }

      return migrations;
    } catch (error) {
      logger.error('❌ Failed to read migration files', {
        component: 'migration-runner',
        error: error instanceof Error ? error.message : 'Unknown error',
        migrationsDir: this.migrationsDir,
      });
      throw error;
    }
  }

  /**
   * Get executed migrations from database
   */
  private async getExecutedMigrations(): Promise<MigrationRecord[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query('SELECT * FROM migration_history ORDER BY executed_at ASC');

      return result.rows;
    } catch (error) {
      // If table doesn't exist, return empty array
      if (error instanceof Error && error.message.includes('does not exist')) {
        return [];
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a single migration
   */
  private async executeMigration(migration: Migration): Promise<void> {
    const client = await this.pool.connect();
    const startTime = Date.now();

    try {
      // Start transaction
      await client.query('BEGIN');

      logger.info(`🔄 Executing migration: ${migration.name}`, {
        component: 'migration-runner',
      });

      // Execute migration SQL
      await client.query(migration.content);

      // Record migration execution
      await client.query(
        `INSERT INTO migration_history (migration_name, execution_time_ms, checksum) 
         VALUES ($1, $2, $3)`,
        [migration.name, Date.now() - startTime, migration.checksum]
      );

      // Commit transaction
      await client.query('COMMIT');

      const executionTime = Date.now() - startTime;
      logger.info(`✅ Migration completed: ${migration.name}`, {
        component: 'migration-runner',
        executionTimeMs: executionTime,
      });
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');

      logger.error(`❌ Migration failed: ${migration.name}`, {
        component: 'migration-runner',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Calculate SHA-256 checksum of migration content
   */
  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Validate migration checksums (detect modified migrations)
   */
  async validateMigrations(): Promise<boolean> {
    const component = 'migration-validator';

    try {
      const availableMigrations = await this.getAvailableMigrations();
      const executedMigrations = await this.getExecutedMigrations();

      for (const executed of executedMigrations) {
        const available = availableMigrations.find((m) => m.name === executed.migration_name);

        if (!available) {
          logger.warn(`⚠️  Migration file missing: ${executed.migration_name}`, { component });
          continue;
        }

        if (available.checksum !== executed.checksum) {
          logger.error(`❌ Migration checksum mismatch: ${executed.migration_name}`, {
            component,
            expectedChecksum: executed.checksum,
            actualChecksum: available.checksum,
          });
          return false;
        }
      }

      logger.info('✅ All migration checksums validated', { component });
      return true;
    } catch (error) {
      logger.error('❌ Migration validation failed', {
        component,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}
