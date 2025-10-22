import { AuditLog, AuditLogSearchParams } from '../types/index.js';

/**
 * Utility functions for audit log operations
 */

// Validation utilities
export const validateRequiredFields = (data: any): boolean => {
  return !!(data.serviceName && data.actionType && data.resourceType);
};

export const validateSeverity = (severity: string): boolean => {
  const validSeverityLevels = ['low', 'medium', 'high', 'critical'];
  return validSeverityLevels.includes(severity);
};

export const validateUserType = (userType: string): boolean => {
  const validUserTypes = ['customer', 'admin', 'system', 'guest'];
  return validUserTypes.includes(userType);
};

// Date and retention utilities
export const calculateRetentionDate = (days: number): Date => {
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + days);
  return retentionDate;
};

export const isExpired = (retentionUntil: Date): boolean => {
  return retentionUntil < new Date();
};

// Search and pagination utilities
export const calculatePagination = (page: number, limit: number, total: number) => {
  const offset = (page - 1) * limit;
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return { offset, totalPages, hasMore };
};

export const validateSearchParams = (params: any): boolean => {
  // Validate limit is within acceptable range
  if (params.limit && (params.limit < 1 || params.limit > 1000)) {
    return false;
  }

  // Validate offset is non-negative
  if (params.offset && params.offset < 0) {
    return false;
  }

  // Validate sortOrder is valid
  if (params.sortOrder && !['asc', 'desc'].includes(params.sortOrder)) {
    return false;
  }

  return true;
};

// Data sanitization utilities
export const sanitizeForLogging = (data: any): any => {
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });

  return sanitized;
};

export const sanitizeNested = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (key.toLowerCase().includes('password')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeNested(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
};

// CSV export utilities
export const formatForCSV = (logs: any[]): string => {
  const headers = 'ID,Timestamp,Action,Resource Type,Resource ID,User ID,Service,Success,Severity';

  const rows = logs.map(
    (log) =>
      `${log.id},${log.occurredAt},${log.actionType},${log.resourceType},${log.resourceId || ''},${log.userId || ''},${log.serviceName || ''},${log.success},${log.severity}`
  );

  return headers + '\n' + rows.join('\n');
};

export const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Error handling utilities
export const createErrorResponse = (message: string, code?: string) => {
  return {
    success: false,
    error: message,
    code: code || 'UNKNOWN_ERROR',
  };
};

export const createSuccessResponse = (data: any, message?: string) => {
  return {
    success: true,
    data,
    message: message || 'Operation completed successfully',
  };
};

// Audit log filtering utilities
export const filterAuditLogsByDateRange = (logs: AuditLog[], startDate: Date, endDate: Date): AuditLog[] => {
  return logs.filter((log) => {
    const logDate = new Date(log.occurredAt);
    return logDate >= startDate && logDate <= endDate;
  });
};

export const filterAuditLogsByService = (logs: AuditLog[], serviceName: string): AuditLog[] => {
  return logs.filter((log) => log.serviceName === serviceName);
};

export const filterAuditLogsBySeverity = (logs: AuditLog[], severity: string): AuditLog[] => {
  return logs.filter((log) => log.severity === severity);
};

// Correlation ID utilities
export const generateCorrelationId = (): string => {
  return `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const extractCorrelationId = (request: any): string | null => {
  return request.get?.('x-correlation-id') || request.headers?.['x-correlation-id'] || null;
};
