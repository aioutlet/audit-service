-- =============================================================================
-- Migration: 001_create_audit_logs_table.sql
-- Description: Create the main audit_logs table for storing audit events
-- Created: 2025-10-22
-- =============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    correlation_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_action VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    resource_id VARCHAR(255),
    resource_type VARCHAR(100),
    event_data JSONB NOT NULL,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_action ON audit_logs(event_action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_name ON audit_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_event ON audit_logs(service_name, event_type, event_action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id, timestamp DESC);

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Main audit log table storing all audit events from microservices';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Unique identifier for tracking requests across services';
COMMENT ON COLUMN audit_logs.event_type IS 'Category of the event (auth, user, order, payment, etc.)';
COMMENT ON COLUMN audit_logs.event_action IS 'Specific action performed (login, create, update, delete, etc.)';
COMMENT ON COLUMN audit_logs.service_name IS 'Name of the service that generated the audit event';
COMMENT ON COLUMN audit_logs.user_id IS 'ID of the user who performed the action (nullable for system events)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the resource affected by the action';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (user, order, product, etc.)';
COMMENT ON COLUMN audit_logs.event_data IS 'JSON data containing detailed event information';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata about the event (request details, etc.)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the client that initiated the action';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string from the client request';