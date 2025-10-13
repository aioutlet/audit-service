import { EventMessage, EventHandler } from './messageBroker.js';
import { databaseService } from '../services/index.js';
import { CreateAuditLogRequest } from '../types/index.js';

/**
 * Determine severity based on event type and success status
 */
function determineSeverity(eventType: string, success: boolean): 'low' | 'medium' | 'high' | 'critical' {
  // Failures are always higher severity
  if (!success) {
    // Security-related failures are critical
    if (eventType.includes('auth') || eventType.includes('security') || eventType.includes('payment')) {
      return 'critical';
    }
    return 'high';
  }

  // Success cases - determine by event type
  if (eventType.includes('login') || eventType.includes('payment')) {
    return 'medium';
  }

  if (eventType.includes('logout') || eventType.includes('view') || eventType.includes('read')) {
    return 'low';
  }

  // Default
  return 'medium';
}

/**
 * Generate compliance tags based on event type
 */
function generateComplianceTags(eventType: string): string[] {
  const tags: string[] = [];

  // Extract domain from event type (e.g., 'auth' from 'auth.login')
  const [domain, action] = eventType.split('.');
  
  if (domain) tags.push(domain);
  if (action) tags.push(action);

  // Add specific compliance tags based on domain
  if (domain === 'auth' || domain === 'security') {
    tags.push('security', 'user-activity');
  }

  if (domain === 'order' || domain === 'payment') {
    tags.push('transaction', 'commerce', 'financial');
  }

  if (domain === 'user' || domain === 'profile') {
    tags.push('user-data', 'privacy');
  }

  if (domain === 'admin') {
    tags.push('administrative', 'sensitive');
  }

  return tags;
}

/**
 * Extract resource ID from event data based on event type
 */
function extractResourceId(eventType: string, data: any): string | undefined {
  // Try common fields first
  if (data.resourceId) return data.resourceId;
  if (data.orderId) return data.orderId;
  if (data.paymentId) return data.paymentId;
  if (data.productId) return data.productId;
  if (data.cartId) return data.cartId;
  if (data.userId) return data.userId;
  if (data.email) return data.email;

  return undefined;
}

/**
 * Generic event handler that works for ALL event types
 * Maps any incoming event to the AuditLog structure
 */
export const handleAuditEvent: EventHandler = async (event: EventMessage) => {
  console.log('� Processing audit event:', {
    eventType: event.eventType,
    eventId: event.eventId,
    source: event.source,
    timestamp: event.timestamp,
  });

  try {
    // Extract domain from event type (e.g., 'auth' from 'auth.login')
    const resourceType = event.eventType.split('.')[0] || 'unknown';
    
    // Determine success (default to true if not specified)
    const success = event.data.success !== false && !event.data.error && !event.data.errorMessage;

    // Build generic audit log request
    const auditLogRequest: CreateAuditLogRequest = {
      serviceName: event.source || 'unknown-service',
      actionType: event.eventType.toUpperCase().replace(/\./g, '_'), // 'auth.login' → 'AUTH_LOGIN'
      userId: event.data.userId,
      userType: event.data.userType || 'customer',
      sessionId: event.data.sessionId,
      resourceType: resourceType,
      resourceId: extractResourceId(event.eventType, event.data),
      ipAddress: event.data.ipAddress,
      userAgent: event.data.userAgent,
      correlationId: event.metadata?.correlationId,
      endpoint: event.data.endpoint,
      httpMethod: event.data.httpMethod,
      businessContext: {
        ...event.data,
        eventId: event.eventId,
        eventType: event.eventType,
        eventVersion: event.metadata?.version,
      },
      success: success,
      errorMessage: event.data.errorMessage || event.data.error || event.data.reason,
      durationMs: event.data.durationMs,
      severity: determineSeverity(event.eventType, success),
      complianceTags: generateComplianceTags(event.eventType),
    };

    // Save to audit database
    const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);
    
    console.log('✅ Audit entry saved to database:', {
      id: savedAuditLog.id,
      serviceName: savedAuditLog.serviceName,
      actionType: savedAuditLog.actionType,
      userId: savedAuditLog.userId,
      resourceType: savedAuditLog.resourceType,
      success: savedAuditLog.success,
      severity: savedAuditLog.severity,
      timestamp: savedAuditLog.occurredAt,
    });
  } catch (error) {
    console.error('❌ Failed to save audit entry:', error);
    throw error; // Re-throw to trigger message retry
  }
};
