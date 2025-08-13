import { Router } from 'express';
import { AuditController } from '@/controllers/audit.controller';
import { authenticateServiceToken, optionalAuth } from '@/middleware/auth';
import { validate, validateQuery, auditLogSchema, searchQuerySchema, bulkAuditSchema } from '@/middleware/validation';

const router = Router();
const auditController = new AuditController();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create single audit log (requires service authentication)
router.post('/logs', authenticateServiceToken, validate(auditLogSchema), auditController.createAuditLog);

// Create multiple audit logs (requires service authentication)
router.post('/logs/bulk', authenticateServiceToken, validate(bulkAuditSchema), auditController.createBulkAuditLogs);

// Search audit logs (optional authentication for internal queries)
router.get('/logs/search', optionalAuth, validateQuery(searchQuerySchema), auditController.searchAuditLogs);

// Get audit log by ID
router.get('/logs/:id', optionalAuth, auditController.getAuditLogById);

// Get audit statistics
router.get('/stats', optionalAuth, auditController.getAuditStats);

// Get audit trail for specific entity
router.get('/trail/:entityType/:entityId', optionalAuth, auditController.getAuditTrail);

// Export audit logs (for compliance)
router.get('/export', optionalAuth, validateQuery(searchQuerySchema), auditController.exportAuditLogs);

export { router as auditRoutes };
