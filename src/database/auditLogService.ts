import { getDatabasePool } from '../database/index';
import logger from '../core/logger';
import { EventMessage } from '../types/events';

export interface AuditLogEntry {
  correlationId: string;
  eventType: string;
  eventAction: string;
  serviceName: string;
  userId?: string;
  resourceId?: string;
  resourceType?: string;
  eventData: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: Date;
}

export class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Write an audit log entry to the database
   */
  async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    const correlationId = entry.correlationId || 'audit-log-service';

    try {
      const pool = getDatabasePool();

      const query = `
        INSERT INTO audit_logs (
          correlation_id, event_type, event_action, service_name,
          user_id, resource_id, resource_type, event_data, metadata,
          ip_address, user_agent, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, created_at
      `;

      const values = [
        entry.correlationId,
        entry.eventType,
        entry.eventAction,
        entry.serviceName,
        entry.userId || null,
        entry.resourceId || null,
        entry.resourceType || null,
        JSON.stringify(entry.eventData),
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.timestamp || new Date(),
      ];

      const result = await pool.query(query, values);

      logger.debug('✅ Audit log written to database', {
        correlationId,
        auditLogId: result.rows[0].id,
        eventType: entry.eventType,
        eventAction: entry.eventAction,
        serviceName: entry.serviceName,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
      });
    } catch (error) {
      logger.error('❌ Failed to write audit log to database', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        eventType: entry.eventType,
        eventAction: entry.eventAction,
        serviceName: entry.serviceName,
      });
      throw error;
    }
  }

  /**
   * Write audit log from event message (convenience method)
   */
  async writeAuditLogFromEvent(
    eventType: string,
    eventAction: string,
    event: EventMessage,
    additionalData: Partial<AuditLogEntry> = {}
  ): Promise<void> {
    const auditEntry: AuditLogEntry = {
      correlationId: event.metadata?.correlationId || event.eventId || 'unknown',
      eventType,
      eventAction,
      serviceName: event.source || additionalData.serviceName || 'unknown-service',
      userId: additionalData.userId || event.data.createdBy || event.data.updatedBy || null,
      resourceId: additionalData.resourceId || event.data.userId || event.data.resourceId,
      resourceType: additionalData.resourceType || 'unknown',
      eventData: {
        eventId: event.eventId,
        timestamp: event.timestamp,
        ...event.data,
        ...additionalData.eventData,
      },
      metadata: {
        ...event.metadata,
        ...additionalData.metadata,
      },
      ipAddress: event.data.ipAddress || additionalData.ipAddress,
      userAgent: event.data.userAgent || additionalData.userAgent,
      timestamp: new Date(event.timestamp),
    };

    await this.writeAuditLog(auditEntry);
  }

  /**
   * Get audit logs with pagination and filtering
   */
  async getAuditLogs(
    options: {
      limit?: number;
      offset?: number;
      userId?: string;
      eventType?: string;
      serviceName?: string;
      startDate?: Date;
      endDate?: Date;
      correlationId?: string;
    } = {}
  ): Promise<{ logs: any[]; total: number }> {
    const { limit = 50, offset = 0, userId, eventType, serviceName, startDate, endDate, correlationId } = options;

    try {
      const pool = getDatabasePool();

      let whereConditions: string[] = [];
      let queryParams: any[] = [];
      let paramCounter = 1;

      // Build WHERE conditions
      if (userId) {
        whereConditions.push(`user_id = $${paramCounter++}`);
        queryParams.push(userId);
      }

      if (eventType) {
        whereConditions.push(`event_type = $${paramCounter++}`);
        queryParams.push(eventType);
      }

      if (serviceName) {
        whereConditions.push(`service_name = $${paramCounter++}`);
        queryParams.push(serviceName);
      }

      if (correlationId) {
        whereConditions.push(`correlation_id = $${paramCounter++}`);
        queryParams.push(correlationId);
      }

      if (startDate) {
        whereConditions.push(`timestamp >= $${paramCounter++}`);
        queryParams.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`timestamp <= $${paramCounter++}`);
        queryParams.push(endDate);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs
        ${whereClause}
      `;

      // Data query
      const dataQuery = `
        SELECT *
        FROM audit_logs
        ${whereClause}
        ORDER BY timestamp DESC, id DESC
        LIMIT $${paramCounter++} OFFSET $${paramCounter++}
      `;

      queryParams.push(limit, offset);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, queryParams.slice(0, -2)),
        pool.query(dataQuery, queryParams),
      ]);

      return {
        logs: dataResult.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } catch (error) {
      logger.error('❌ Failed to retrieve audit logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        options,
      });
      throw error;
    }
  }
}

export default AuditLogService.getInstance();
