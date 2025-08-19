-- Audit Service Complete Database Schema
-- This file contains the complete schema for the audit service
-- Generated: 2025-08-16

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- MAIN AUDIT TABLES
-- ==========================================

-- Primary audit log table for all service activities
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(100) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    user_id UUID,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_url TEXT,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    event_data JSONB,
    severity VARCHAR(20) DEFAULT 'INFO',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System-level events and monitoring
CREATE TABLE system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    component VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'INFO',
    metadata JSONB,
    host_name VARCHAR(255),
    process_id INTEGER,
    memory_usage BIGINT,
    cpu_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User behavior and activity tracking
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_id VARCHAR(255),
    activity_type VARCHAR(100) NOT NULL,
    activity_name VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    geolocation JSONB,
    device_info JSONB,
    duration_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security-related events and threats
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    threat_level VARCHAR(20) DEFAULT 'LOW',
    source_ip INET,
    target_resource VARCHAR(255),
    user_id UUID,
    session_id VARCHAR(255),
    attack_vector VARCHAR(100),
    description TEXT,
    blocked BOOLEAN DEFAULT false,
    rule_triggered VARCHAR(255),
    event_data JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance metrics and monitoring
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    response_time_ms INTEGER,
    status_code INTEGER,
    throughput_rps DECIMAL(10,2),
    error_rate DECIMAL(5,2),
    memory_usage BIGINT,
    cpu_usage DECIMAL(5,2),
    active_connections INTEGER,
    queue_size INTEGER,
    cache_hit_rate DECIMAL(5,2),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- CONFIGURATION AND MANAGEMENT
-- ==========================================

-- Audit configuration per service and event type
CREATE TABLE audit_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    log_level VARCHAR(20) DEFAULT 'INFO',
    retention_days INTEGER DEFAULT 365,
    include_request_body BOOLEAN DEFAULT false,
    include_response_body BOOLEAN DEFAULT false,
    include_headers BOOLEAN DEFAULT true,
    sampling_rate DECIMAL(3,2) DEFAULT 1.0,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_name, event_type)
);

-- Data retention policies
CREATE TABLE retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL DEFAULT 365,
    archive_enabled BOOLEAN DEFAULT false,
    compression_enabled BOOLEAN DEFAULT true,
    last_cleanup TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archive table for old audit logs
CREATE TABLE audit_logs_archive (
    LIKE audit_logs INCLUDING ALL
);

-- ==========================================
-- INDEXES
-- ==========================================

-- Audit logs indexes
CREATE INDEX idx_audit_logs_service_action ON audit_logs(service_name, action);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_event_id ON audit_logs(event_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(DATE(timestamp));

-- System events indexes
CREATE INDEX idx_system_events_component ON system_events(component, event_type);
CREATE INDEX idx_system_events_timestamp ON system_events(timestamp);
CREATE INDEX idx_system_events_severity ON system_events(severity);
CREATE INDEX idx_system_events_date ON system_events(DATE(timestamp));

-- User activities indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_session_id ON user_activities(session_id);
CREATE INDEX idx_user_activities_timestamp ON user_activities(timestamp);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_date ON user_activities(DATE(timestamp));

-- Security events indexes
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_threat_level ON security_events(threat_level);
CREATE INDEX idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX idx_security_events_date ON security_events(DATE(timestamp));

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_service ON performance_metrics(service_name);
CREATE INDEX idx_performance_metrics_endpoint ON performance_metrics(endpoint);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_date ON performance_metrics(DATE(timestamp));

-- ==========================================
-- VIEWS
-- ==========================================

-- Daily audit summary view
CREATE VIEW audit_summary_daily AS
SELECT 
    DATE(timestamp) as audit_date,
    service_name,
    action,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(CASE WHEN severity = 'ERROR' THEN 1 END) as error_count,
    COUNT(CASE WHEN severity = 'WARNING' THEN 1 END) as warning_count,
    AVG(CASE WHEN response_status BETWEEN 200 AND 299 THEN 1.0 ELSE 0.0 END) as success_rate
FROM audit_logs 
GROUP BY DATE(timestamp), service_name, action;

-- Daily security summary view
CREATE VIEW security_summary_daily AS
SELECT 
    DATE(timestamp) as event_date,
    event_type,
    threat_level,
    COUNT(*) as event_count,
    COUNT(DISTINCT source_ip) as unique_source_ips,
    COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
    COUNT(CASE WHEN blocked = false THEN 1 END) as allowed_count
FROM security_events 
GROUP BY DATE(timestamp), event_type, threat_level;

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function for automatic log archival
CREATE OR REPLACE FUNCTION archive_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    archived_count INTEGER;
BEGIN
    WITH moved_rows AS (
        DELETE FROM audit_logs 
        WHERE timestamp < NOW() - INTERVAL '1 day' * days_to_keep
        RETURNING *
    )
    INSERT INTO audit_logs_archive SELECT * FROM moved_rows;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    UPDATE retention_policies 
    SET last_cleanup = NOW() 
    WHERE table_name = 'audit_logs';
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- Function for cleanup based on retention policies
CREATE OR REPLACE FUNCTION cleanup_audit_data()
RETURNS TABLE(table_name TEXT, records_processed INTEGER) AS $$
DECLARE
    policy RECORD;
    cleanup_count INTEGER;
BEGIN
    FOR policy IN SELECT * FROM retention_policies WHERE retention_days > 0 LOOP
        CASE policy.table_name
            WHEN 'audit_logs' THEN
                IF policy.archive_enabled THEN
                    SELECT archive_old_audit_logs(policy.retention_days) INTO cleanup_count;
                ELSE
                    DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days;
                    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
                END IF;
            WHEN 'system_events' THEN
                DELETE FROM system_events WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days;
                GET DIAGNOSTICS cleanup_count = ROW_COUNT;
            WHEN 'user_activities' THEN
                DELETE FROM user_activities WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days;
                GET DIAGNOSTICS cleanup_count = ROW_COUNT;
            WHEN 'security_events' THEN
                IF policy.archive_enabled THEN
                    UPDATE security_events 
                    SET event_data = jsonb_set(COALESCE(event_data, '{}'::jsonb), '{archived}', 'true'::jsonb)
                    WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days
                    AND (event_data->>'archived' IS NULL OR event_data->>'archived' = 'false');
                    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
                ELSE
                    DELETE FROM security_events WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days;
                    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
                END IF;
            WHEN 'performance_metrics' THEN
                DELETE FROM performance_metrics WHERE timestamp < NOW() - INTERVAL '1 day' * policy.retention_days;
                GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        END CASE;
        
        UPDATE retention_policies 
        SET last_cleanup = NOW() 
        WHERE id = policy.id;
        
        table_name := policy.table_name;
        records_processed := cleanup_count;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_audit_logs_updated_at 
    BEFORE UPDATE ON audit_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audit_configurations_updated_at 
    BEFORE UPDATE ON audit_configurations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retention_policies_updated_at 
    BEFORE UPDATE ON retention_policies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
