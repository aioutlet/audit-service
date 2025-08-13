-- Create audit_service database if it doesn't exist
SELECT 'CREATE DATABASE audit_service' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'audit_service')\gexec

-- Connect to the audit_service database
\c audit_service;

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255),
    user_type VARCHAR(20) DEFAULT 'user' CHECK (user_type IN ('user', 'service', 'system', 'admin')),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    service_name VARCHAR(100),
    endpoint VARCHAR(255),
    http_method VARCHAR(10) CHECK (http_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD')),
    request_id VARCHAR(255),
    correlation_id VARCHAR(255),
    business_context JSONB,
    metadata JSONB,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_tags TEXT[],
    before_state JSONB,
    after_state JSONB,
    result VARCHAR(20) DEFAULT 'success' CHECK (result IN ('success', 'failure', 'partial')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_service ON audit_logs (service_name) WHERE service_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON audit_logs (risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result ON audit_logs (result);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_context ON audit_logs USING GIN (business_context) WHERE business_context IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_compliance_tags ON audit_logs USING GIN (compliance_tags) WHERE compliance_tags IS NOT NULL;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs (user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_service_timestamp ON audit_logs (service_name, timestamp DESC) WHERE service_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_logs (entity_type, entity_id, timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_audit_logs_updated_at ON audit_logs;
CREATE TRIGGER update_audit_logs_updated_at
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function for automatic cleanup of old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 2555)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < (NOW() - INTERVAL '1 day' * retention_days);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO audit_logs (
        action, 
        entity_type, 
        entity_id, 
        user_type, 
        service_name, 
        business_context, 
        result
    ) VALUES (
        'CLEANUP_AUDIT_LOGS',
        'audit_system',
        'cleanup_job',
        'system',
        'audit-service',
        jsonb_build_object(
            'deleted_count', deleted_count,
            'retention_days', retention_days,
            'cleanup_date', NOW()
        ),
        'success'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for audit statistics
CREATE OR REPLACE VIEW audit_stats AS
SELECT 
    COUNT(*) as total_logs,
    COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE) as logs_today,
    COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days') as logs_this_week,
    COUNT(*) FILTER (WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days') as logs_this_month,
    MIN(timestamp) as oldest_log_date,
    MAX(timestamp) as newest_log_date,
    COUNT(DISTINCT action) as unique_actions,
    COUNT(DISTINCT service_name) as unique_services,
    COUNT(DISTINCT user_id) as unique_users
FROM audit_logs;

-- Grant permissions (if needed for specific roles)
-- GRANT SELECT, INSERT ON audit_logs TO audit_service_app;
-- GRANT USAGE ON SCHEMA public TO audit_service_app;

-- Create sample data (optional - for development)
-- INSERT INTO audit_logs (action, entity_type, entity_id, user_id, service_name, business_context)
-- VALUES 
--     ('USER_LOGIN', 'user', '12345', '12345', 'auth-service', '{"login_method": "password"}'),
--     ('ORDER_CREATED', 'order', 'ord_67890', '12345', 'order-service', '{"total_amount": 99.99, "currency": "USD"}'),
--     ('PRODUCT_VIEWED', 'product', 'prod_11111', '12345', 'product-service', '{"category": "electronics"}');

COMMIT;
