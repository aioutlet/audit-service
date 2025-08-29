import { Pool, PoolClient } from 'pg';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { AuditLog, CreateAuditLogRequest, AuditLogSearchParams, AuditStatistics } from '@/types';

export class DatabaseService {
  private pool: Pool;
  private isInitialized = false;

  constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });
  }

  async initialize(): Promise<void> {
    try {
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isInitialized = true;
      logger.info('Database connection pool initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database connection:', error);
      throw error;
    }
  }

  async createAuditLog(request: CreateAuditLogRequest): Promise<AuditLog> {
    const client = await this.pool.connect();
    try {
      // Calculate retention date
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() + config.audit.retentionDays);

      const query = `
        INSERT INTO audit_logs (
          service_name, action_type, user_id, user_type, session_id,
          resource_type, resource_id, ip_address, user_agent, correlation_id,
          endpoint, http_method, business_context, success, error_message,
          duration_ms, severity, compliance_tags, retention_until
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) RETURNING *;
      `;

      const values = [
        request.serviceName,
        request.actionType,
        request.userId,
        request.userType || 'customer',
        request.sessionId,
        request.resourceType,
        request.resourceId,
        request.ipAddress,
        request.userAgent,
        request.correlationId,
        request.endpoint,
        request.httpMethod,
        JSON.stringify(request.businessContext || {}),
        request.success !== false, // Default to true
        request.errorMessage,
        request.durationMs,
        request.severity || 'medium',
        request.complianceTags,
        retentionDate,
      ];

      const result = await client.query(query, values);
      return this.mapRowToAuditLog(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async createAuditLogsBatch(requests: CreateAuditLogRequest[]): Promise<AuditLog[]> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const auditLogs: AuditLog[] = [];

      for (const request of requests) {
        const log = await this.createAuditLog(request);
        auditLogs.push(log);
      }

      await client.query('COMMIT');
      return auditLogs;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async searchAuditLogs(params: AuditLogSearchParams): Promise<{ logs: AuditLog[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build WHERE conditions
      if (params.serviceName) {
        conditions.push(`service_name = $${paramIndex++}`);
        values.push(params.serviceName);
      }

      if (params.actionType) {
        conditions.push(`action_type = $${paramIndex++}`);
        values.push(params.actionType);
      }

      if (params.userId) {
        conditions.push(`user_id = $${paramIndex++}`);
        values.push(params.userId);
      }

      if (params.userType) {
        conditions.push(`user_type = $${paramIndex++}`);
        values.push(params.userType);
      }

      if (params.resourceType) {
        conditions.push(`resource_type = $${paramIndex++}`);
        values.push(params.resourceType);
      }

      if (params.resourceId) {
        conditions.push(`resource_id = $${paramIndex++}`);
        values.push(params.resourceId);
      }

      if (params.correlationId) {
        conditions.push(`correlation_id = $${paramIndex++}`);
        values.push(params.correlationId);
      }

      if (params.success !== undefined) {
        conditions.push(`success = $${paramIndex++}`);
        values.push(params.success);
      }

      if (params.severity) {
        conditions.push(`severity = $${paramIndex++}`);
        values.push(params.severity);
      }

      if (params.fromDate) {
        conditions.push(`occurred_at >= $${paramIndex++}`);
        values.push(new Date(params.fromDate));
      }

      if (params.toDate) {
        conditions.push(`occurred_at <= $${paramIndex++}`);
        values.push(new Date(params.toDate));
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
      const countResult = await client.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Build ORDER BY clause
      const sortBy = params.sortBy || 'occurredAt';
      const sortOrder = params.sortOrder || 'desc';
      const orderClause = `ORDER BY ${this.mapSortField(sortBy)} ${sortOrder.toUpperCase()}`;

      // Build LIMIT and OFFSET
      const limit = Math.min(params.limit || 100, 1000); // Max 1000 records
      const offset = params.offset || 0;
      const limitClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      values.push(limit, offset);

      // Get logs
      const logsQuery = `
        SELECT * FROM audit_logs 
        ${whereClause} 
        ${orderClause} 
        ${limitClause}
      `;

      const logsResult = await client.query(logsQuery, values);
      const logs = logsResult.rows.map((row) => this.mapRowToAuditLog(row));

      return { logs, total };
    } finally {
      client.release();
    }
  }

  async getCorrelationTrail(correlationId: string): Promise<AuditLog[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE correlation_id = $1 
        ORDER BY occurred_at ASC
      `;

      const result = await client.query(query, [correlationId]);
      return result.rows.map((row) => this.mapRowToAuditLog(row));
    } finally {
      client.release();
    }
  }

  async getRecentFailures(hours: number): Promise<AuditLog[]> {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT * FROM audit_logs 
        WHERE success = false 
        AND occurred_at >= NOW() - INTERVAL '${hours} hours'
        ORDER BY occurred_at DESC
        LIMIT 1000
      `;

      const result = await client.query(query);
      return result.rows.map((row) => this.mapRowToAuditLog(row));
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  async cleanupExpiredLogs(): Promise<number> {
    const client = await this.pool.connect();
    try {
      const query = `
        DELETE FROM audit_logs 
        WHERE retention_until < CURRENT_DATE
      `;

      const result = await client.query(query);
      const deletedCount = result.rowCount || 0;

      if (deletedCount > 0) {
        logger.info(`Cleaned up ${deletedCount} expired audit logs`);
      }

      return deletedCount;
    } finally {
      client.release();
    }
  }

  async getAuditLogById(id: string): Promise<AuditLog | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM audit_logs WHERE id = $1';
      const result = await client.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAuditLog(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getAuditStatistics(): Promise<AuditStatistics> {
    const client = await this.pool.connect();
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get basic counts
      const totalQuery = 'SELECT COUNT(*) as total FROM audit_logs WHERE occurred_at >= $1';
      const successQuery = 'SELECT COUNT(*) as successful FROM audit_logs WHERE occurred_at >= $1 AND success = true';
      const failedQuery = 'SELECT COUNT(*) as failed FROM audit_logs WHERE occurred_at >= $1 AND success = false';

      const [totalResult, successResult, failedResult] = await Promise.all([
        client.query(totalQuery, [thirtyDaysAgo]),
        client.query(successQuery, [thirtyDaysAgo]),
        client.query(failedQuery, [thirtyDaysAgo]),
      ]);

      // Get top services
      const topServicesQuery = `
        SELECT service_name, COUNT(*) as count
        FROM audit_logs 
        WHERE occurred_at >= $1 
        GROUP BY service_name 
        ORDER BY count DESC 
        LIMIT 10
      `;
      const topServicesResult = await client.query(topServicesQuery, [thirtyDaysAgo]);

      // Get top actions
      const topActionsQuery = `
        SELECT action_type, COUNT(*) as count
        FROM audit_logs 
        WHERE occurred_at >= $1 
        GROUP BY action_type 
        ORDER BY count DESC 
        LIMIT 10
      `;
      const topActionsResult = await client.query(topActionsQuery, [thirtyDaysAgo]);

      // Get severity breakdown
      const severityQuery = `
        SELECT severity, COUNT(*) as count
        FROM audit_logs 
        WHERE occurred_at >= $1 
        GROUP BY severity
      `;
      const severityResult = await client.query(severityQuery, [thirtyDaysAgo]);

      const severityBreakdown: Record<string, number> = {};
      severityResult.rows.forEach((row) => {
        severityBreakdown[row.severity] = parseInt(row.count);
      });

      return {
        totalLogs: parseInt(totalResult.rows[0].total),
        successfulOperations: parseInt(successResult.rows[0].successful),
        failedOperations: parseInt(failedResult.rows[0].failed),
        topServices: topServicesResult.rows.map((row) => ({
          serviceName: row.service_name,
          count: parseInt(row.count),
        })),
        topActions: topActionsResult.rows.map((row) => ({
          actionType: row.action_type,
          count: parseInt(row.count),
        })),
        severityBreakdown,
        timeRange: {
          from: thirtyDaysAgo,
          to: now,
        },
      };
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }

  private mapRowToAuditLog(row: any): AuditLog {
    return {
      id: row.id,
      serviceName: row.service_name,
      actionType: row.action_type,
      userId: row.user_id,
      userType: row.user_type,
      sessionId: row.session_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      occurredAt: row.occurred_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      correlationId: row.correlation_id,
      endpoint: row.endpoint,
      httpMethod: row.http_method,
      businessContext: row.business_context,
      success: row.success,
      errorMessage: row.error_message,
      durationMs: row.duration_ms,
      severity: row.severity,
      complianceTags: row.compliance_tags,
      retentionUntil: row.retention_until,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSortField(sortBy: string): string {
    const mapping: Record<string, string> = {
      occurredAt: 'occurred_at',
      severity: 'severity',
      serviceName: 'service_name',
    };
    return mapping[sortBy] || 'occurred_at';
  }
}
