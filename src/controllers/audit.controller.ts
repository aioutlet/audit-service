import { Request, Response } from 'express';
import { DatabaseService } from '@/services/database';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/middleware/auth';
import {
  AuditLog,
  AuditLogSearchParams,
  AuditLogSearchResponse,
  AuditStatistics,
  CreateAuditLogRequest,
} from '@/types';

export class AuditController {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  async createAuditLog(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const auditData: CreateAuditLogRequest = {
        ...req.body,
        serviceName: req.user?.service || req.body.serviceName,
        userId: req.user?.id || req.body.userId,
        ipAddress: req.ip || req.body.ipAddress,
        userAgent: req.get('User-Agent') || req.body.userAgent,
        correlationId: req.get('x-correlation-id') || req.body.correlationId,
      };

      const auditLog = await this.dbService.createAuditLog(auditData);

      logger.info('Audit log created', {
        id: auditLog.id,
        actionType: auditLog.actionType,
        resourceType: auditLog.resourceType,
        resourceId: auditLog.resourceId,
        userId: auditLog.userId,
        serviceName: auditLog.serviceName,
      });

      res.status(201).json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create audit log',
      });
    }
  }

  async createBulkAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { logs } = req.body;

      const enrichedLogs = logs.map((log: any) => ({
        ...log,
        service_name: req.user?.service || log.service_name,
        user_id: req.user?.id || log.user_id,
        ip_address: req.ip || log.ip_address,
        user_agent: req.get('User-Agent') || log.user_agent,
        correlation_id: req.get('x-correlation-id') || log.correlation_id,
        request_id: req.get('x-request-id') || log.request_id,
      }));

      // For now, create logs individually since we don't have bulk method
      const auditLogs = [];
      for (const logData of enrichedLogs) {
        const auditLog = await this.dbService.createAuditLog(logData);
        auditLogs.push(auditLog);
      }

      logger.info('Bulk audit logs created', {
        count: auditLogs.length,
        service_name: req.user?.service,
      });

      res.status(201).json({
        success: true,
        data: auditLogs,
        count: auditLogs.length,
      });
    } catch (error) {
      logger.error('Failed to create bulk audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create bulk audit logs',
      });
    }
  }

  async searchAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const searchParams = req.query as unknown as AuditLogSearchParams;
      const result = await this.dbService.searchAuditLogs(searchParams);

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page: Math.floor((searchParams.offset || 0) / (searchParams.limit || 100)) + 1,
          limit: searchParams.limit || 100,
          total: result.total,
          totalPages: Math.ceil(result.total / (searchParams.limit || 100)),
        },
      });
    } catch (error) {
      logger.error('Failed to search audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search audit logs',
      });
    }
  }

  async getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const auditLog = await this.dbService.getAuditLogById(id);

      if (!auditLog) {
        res.status(404).json({
          success: false,
          error: 'Audit log not found',
        });
        return;
      }

      res.json({
        success: true,
        data: auditLog,
      });
    } catch (error) {
      logger.error('Failed to get audit log:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit log',
      });
    }
  }

  async getAuditStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.dbService.getAuditStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Failed to get audit stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit stats',
      });
    }
  }

  async getAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { entityType, entityId } = req.params;
      const { limit = 100, page = 1 } = req.query;

      const searchParams: AuditLogSearchParams = {
        resourceType: entityType,
        resourceId: entityId,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        sortBy: 'occurredAt',
        sortOrder: 'desc',
      };

      const result = await this.dbService.searchAuditLogs(searchParams);

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error) {
      logger.error('Failed to get audit trail:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get audit trail',
      });
    }
  }

  async exportAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const searchParams = req.query as unknown as AuditLogSearchParams;
      const format = (req.query.format as string) || 'json';

      // For large exports, we should stream the data
      const result = await this.dbService.searchAuditLogs({
        ...searchParams,
        limit: 10000, // Max export limit
      });

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');

        // Convert to CSV format
        const csvHeader = 'ID,Timestamp,Action,Resource Type,Resource ID,User ID,Service,Success,Severity\n';
        const csvRows = result.logs
          .map(
            (log) =>
              `${log.id},${log.occurredAt},${log.actionType},${log.resourceType},${log.resourceId || ''},${log.userId || ''},${log.serviceName || ''},${log.success},${log.severity}`
          )
          .join('\n');

        res.send(csvHeader + csvRows);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.json');
        res.json({
          success: true,
          data: result.logs,
          exported_at: new Date().toISOString(),
          total: result.total,
        });
      }
    } catch (error) {
      logger.error('Failed to export audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export audit logs',
      });
    }
  }
}
