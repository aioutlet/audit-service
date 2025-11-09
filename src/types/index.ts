export interface AuditLog {
  id: string;
  serviceName: string;
  actionType: string;
  userId?: string;
  userType?: 'customer' | 'admin' | 'system' | 'guest';
  sessionId?: string;
  resourceType: string;
  resourceId?: string;
  occurredAt: Date;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  endpoint?: string;
  httpMethod?: string;
  businessContext: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  durationMs?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  complianceTags?: string[];
  retentionUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuditLogRequest {
  serviceName: string;
  actionType: string;
  userId?: string;
  userType?: 'customer' | 'admin' | 'system' | 'guest';
  sessionId?: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  endpoint?: string;
  httpMethod?: string;
  businessContext?: Record<string, any>;
  success?: boolean;
  errorMessage?: string;
  durationMs?: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  complianceTags?: string[];
}

export interface BatchAuditLogRequest {
  logs: CreateAuditLogRequest[];
}

export interface AuditLogSearchParams {
  serviceName?: string;
  actionType?: string;
  userId?: string;
  userType?: string;
  resourceType?: string;
  resourceId?: string;
  traceId?: string;
  success?: boolean;
  severity?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'occurredAt' | 'severity' | 'serviceName';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogSearchResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AuditStatistics {
  totalLogs: number;
  successfulOperations: number;
  failedOperations: number;
  topServices: Array<{ serviceName: string; count: number }>;
  topActions: Array<{ actionType: string; count: number }>;
  severityBreakdown: Record<string, number>;
  timeRange: {
    from: Date;
    to: Date;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  version: string;
  uptime: number;
  checks: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
  };
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  traceId?: string;
  timestamp: Date;
}
