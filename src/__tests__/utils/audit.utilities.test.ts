import {
  validateRequiredFields,
  validateSeverity,
  validateUserType,
  calculateRetentionDate,
  isExpired,
  calculatePagination,
  validateSearchParams,
  sanitizeForLogging,
  sanitizeNested,
  formatForCSV,
  escapeCSVValue,
  createErrorResponse,
  createSuccessResponse,
  filterAuditLogsByDateRange,
  filterAuditLogsByService,
  filterAuditLogsBySeverity,
  generateCorrelationId,
  extractCorrelationId,
} from '@/utils/audit.utilities';
import { AuditLog } from '@/types';

describe('Audit Utilities', () => {
  describe('Data validation utilities', () => {
    it('should validate required audit log fields', () => {
      const validData = {
        serviceName: 'user-service',
        actionType: 'CREATE_USER',
        resourceType: 'user',
      };

      const invalidData = {
        serviceName: 'user-service',
        actionType: 'CREATE_USER',
        // missing resourceType
      };

      expect(validateRequiredFields(validData)).toBe(true);
      expect(validateRequiredFields(invalidData)).toBe(false);
    });

    it('should validate severity levels', () => {
      expect(validateSeverity('low')).toBe(true);
      expect(validateSeverity('medium')).toBe(true);
      expect(validateSeverity('high')).toBe(true);
      expect(validateSeverity('critical')).toBe(true);
      expect(validateSeverity('invalid')).toBe(false);
    });

    it('should validate user types', () => {
      expect(validateUserType('customer')).toBe(true);
      expect(validateUserType('admin')).toBe(true);
      expect(validateUserType('system')).toBe(true);
      expect(validateUserType('guest')).toBe(true);
      expect(validateUserType('unknown')).toBe(false);
    });
  });

  describe('Date and retention utilities', () => {
    it('should calculate retention date correctly', () => {
      const now = new Date();
      const retention30Days = calculateRetentionDate(30);
      const retention90Days = calculateRetentionDate(90);

      expect(retention30Days.getTime()).toBeGreaterThan(now.getTime());
      expect(retention90Days.getTime()).toBeGreaterThan(retention30Days.getTime());

      // Check that the difference is approximately correct (allowing for execution time)
      const diffInDays = Math.floor((retention30Days.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffInDays).toBeGreaterThanOrEqual(29);
      expect(diffInDays).toBeLessThanOrEqual(30);
    });

    it('should check if log is expired', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      expect(isExpired(futureDate)).toBe(false);
      expect(isExpired(pastDate)).toBe(true);
    });
  });

  describe('Search and pagination utilities', () => {
    it('should calculate correct pagination values', () => {
      const result1 = calculatePagination(1, 10, 25);
      expect(result1.offset).toBe(0);
      expect(result1.totalPages).toBe(3);
      expect(result1.hasMore).toBe(true);

      const result2 = calculatePagination(3, 10, 25);
      expect(result2.offset).toBe(20);
      expect(result2.totalPages).toBe(3);
      expect(result2.hasMore).toBe(false);

      const result3 = calculatePagination(1, 10, 5);
      expect(result3.offset).toBe(0);
      expect(result3.totalPages).toBe(1);
      expect(result3.hasMore).toBe(false);
    });

    it('should validate search parameters', () => {
      expect(validateSearchParams({ limit: 10, offset: 0, sortOrder: 'desc' })).toBe(true);
      expect(validateSearchParams({ limit: 1001 })).toBe(false); // limit too high
      expect(validateSearchParams({ offset: -1 })).toBe(false); // negative offset
      expect(validateSearchParams({ sortOrder: 'invalid' })).toBe(false); // invalid sort order
    });
  });

  describe('Data sanitization utilities', () => {
    it('should sanitize sensitive data for logging', () => {
      const input = {
        username: 'john_doe',
        password: 'secret123',
        email: 'john@example.com',
        accessToken: 'abc123',
        apiKey: 'key456',
        normalField: 'normal_value',
      };

      const result = sanitizeForLogging(input);

      expect(result.username).toBe('john_doe');
      expect(result.password).toBe('[REDACTED]');
      expect(result.email).toBe('john@example.com');
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.normalField).toBe('normal_value');
    });

    it('should handle nested objects in sanitization', () => {
      const input = {
        user: {
          name: 'john',
          password: 'secret',
          settings: {
            theme: 'dark',
            apiPassword: 'secret123',
          },
        },
        metadata: {
          version: '1.0',
        },
      };

      const result = sanitizeNested(input);

      expect(result.user.name).toBe('john');
      expect(result.user.password).toBe('[REDACTED]');
      expect(result.user.settings.theme).toBe('dark');
      expect(result.user.settings.apiPassword).toBe('[REDACTED]');
      expect(result.metadata.version).toBe('1.0');
    });
  });

  describe('CSV export utilities', () => {
    it('should format audit log data for CSV export', () => {
      const logs = [
        {
          id: 'log-1',
          occurredAt: '2023-01-01T00:00:00Z',
          actionType: 'CREATE_USER',
          resourceType: 'user',
          resourceId: 'user-123',
          userId: 'admin-1',
          serviceName: 'user-service',
          success: true,
          severity: 'medium',
        },
        {
          id: 'log-2',
          occurredAt: '2023-01-02T00:00:00Z',
          actionType: 'DELETE_USER',
          resourceType: 'user',
          resourceId: 'user-456',
          userId: 'admin-1',
          serviceName: 'user-service',
          success: false,
          severity: 'high',
        },
      ];

      const csv = formatForCSV(logs);

      expect(csv).toContain('ID,Timestamp,Action,Resource Type');
      expect(csv).toContain('log-1,2023-01-01T00:00:00Z,CREATE_USER');
      expect(csv).toContain('log-2,2023-01-02T00:00:00Z,DELETE_USER');
      expect(csv).toContain('true,medium');
      expect(csv).toContain('false,high');
    });

    it('should handle empty and null values in CSV format', () => {
      expect(escapeCSVValue(null)).toBe('');
      expect(escapeCSVValue(undefined)).toBe('');
      expect(escapeCSVValue('')).toBe('');
      expect(escapeCSVValue('normal')).toBe('normal');
      expect(escapeCSVValue(123)).toBe('123');
      expect(escapeCSVValue(true)).toBe('true');
    });
  });

  describe('Response utilities', () => {
    it('should create error responses', () => {
      const errorResponse = createErrorResponse('Something went wrong', 'ERROR_CODE');

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBe('Something went wrong');
      expect(errorResponse.code).toBe('ERROR_CODE');
    });

    it('should create success responses', () => {
      const data = { id: 'test', name: 'Test' };
      const successResponse = createSuccessResponse(data, 'Test successful');

      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toEqual(data);
      expect(successResponse.message).toBe('Test successful');
    });
  });

  describe('Audit log filtering utilities', () => {
    const mockLogs: AuditLog[] = [
      {
        id: '1',
        occurredAt: new Date('2023-01-01'),
        serviceName: 'user-service',
        severity: 'high',
        actionType: 'CREATE_USER',
        resourceType: 'user',
        resourceId: 'user-1',
        userId: 'admin-1',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        correlationId: 'test-correlation-1',
        businessContext: {},
        retentionUntil: new Date('2024-01-01'),
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      },
      {
        id: '2',
        occurredAt: new Date('2023-01-15'),
        serviceName: 'order-service',
        severity: 'medium',
        actionType: 'CREATE_ORDER',
        resourceType: 'order',
        resourceId: 'order-1',
        userId: 'user-1',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        correlationId: 'test-correlation-2',
        businessContext: {},
        retentionUntil: new Date('2024-01-15'),
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date('2023-01-15'),
      },
      {
        id: '3',
        occurredAt: new Date('2023-02-01'),
        serviceName: 'user-service',
        severity: 'low',
        actionType: 'UPDATE_USER',
        resourceType: 'user',
        resourceId: 'user-2',
        userId: 'admin-2',
        success: true,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        correlationId: 'test-correlation-3',
        businessContext: {},
        retentionUntil: new Date('2024-02-01'),
        createdAt: new Date('2023-02-01'),
        updatedAt: new Date('2023-02-01'),
      },
    ];

    it('should filter audit logs by date range', () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const filtered = filterAuditLogsByDateRange(mockLogs, startDate, endDate);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('1');
      expect(filtered[1].id).toBe('2');
    });

    it('should filter audit logs by service', () => {
      const filtered = filterAuditLogsByService(mockLogs, 'user-service');

      expect(filtered).toHaveLength(2);
      expect(filtered[0].id).toBe('1');
      expect(filtered[1].id).toBe('3');
    });

    it('should filter audit logs by severity', () => {
      const filtered = filterAuditLogsBySeverity(mockLogs, 'high');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  describe('Correlation ID utilities', () => {
    it('should generate correlation ID', () => {
      const correlationId = generateCorrelationId();

      expect(correlationId).toMatch(/^audit-\d+-[a-z0-9]{9}$/);
    });

    it('should extract correlation ID from request', () => {
      const mockRequest = {
        get: jest.fn().mockReturnValue('test-correlation-id'),
        headers: { 'x-correlation-id': 'header-correlation-id' },
      };

      const correlationId = extractCorrelationId(mockRequest);

      expect(correlationId).toBe('test-correlation-id');
      expect(mockRequest.get).toHaveBeenCalledWith('x-correlation-id');
    });

    it('should extract correlation ID from headers when get method is not available', () => {
      const mockRequest = {
        headers: { 'x-correlation-id': 'header-correlation-id' },
      };

      const correlationId = extractCorrelationId(mockRequest);

      expect(correlationId).toBe('header-correlation-id');
    });

    it('should return null when no correlation ID is found', () => {
      const mockRequest = {
        get: jest.fn().mockReturnValue(null),
        headers: {},
      };

      const correlationId = extractCorrelationId(mockRequest);

      expect(correlationId).toBeNull();
    });
  });
});
