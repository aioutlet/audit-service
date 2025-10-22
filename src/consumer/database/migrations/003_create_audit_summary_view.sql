-- =============================================================================
-- Migration: 003_create_audit_summary_view.sql
-- Description: Create materialized view for audit log summaries and reporting
-- Created: 2025-10-22
-- =============================================================================

-- Create materialized view for audit log summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS audit_log_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as event_date,
    service_name,
    event_type,
    event_action,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT correlation_id) as unique_requests,
    MIN(timestamp) as first_event,
    MAX(timestamp) as last_event
FROM audit_logs
GROUP BY 
    DATE_TRUNC('day', timestamp),
    service_name,
    event_type,
    event_action
ORDER BY 
    event_date DESC,
    service_name,
    event_type,
    event_action;

-- Create indexes on the materialized view
CREATE INDEX IF NOT EXISTS idx_audit_summary_date ON audit_log_summary(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_summary_service ON audit_log_summary(service_name);
CREATE INDEX IF NOT EXISTS idx_audit_summary_event_type ON audit_log_summary(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_summary_count ON audit_log_summary(event_count DESC);

-- Add comment
COMMENT ON MATERIALIZED VIEW audit_log_summary IS 'Daily summary of audit events for reporting and analytics';

-- Note: Materialized view refresh should be done periodically
-- This can be automated with a scheduled job:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY audit_log_summary;