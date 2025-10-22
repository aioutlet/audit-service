-- =============================================================================
-- Migration: 002_create_migration_history_table.sql
-- Description: Create table to track executed migrations
-- Created: 2025-10-22
-- =============================================================================

-- Create migration_history table to track applied migrations
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    execution_time_ms INTEGER NOT NULL,
    checksum VARCHAR(64) NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_migration_history_migration_name ON migration_history(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON migration_history(executed_at DESC);

-- Add comments
COMMENT ON TABLE migration_history IS 'Tracks executed database migrations for audit service';
COMMENT ON COLUMN migration_history.migration_name IS 'Name of the migration file executed';
COMMENT ON COLUMN migration_history.executed_at IS 'Timestamp when the migration was executed';
COMMENT ON COLUMN migration_history.execution_time_ms IS 'Time taken to execute the migration in milliseconds';
COMMENT ON COLUMN migration_history.checksum IS 'SHA-256 hash of the migration file content';

-- Insert record for this migration (will be handled by migration runner)
-- This is just documentation of the table structure