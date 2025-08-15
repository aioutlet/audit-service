import { EventMessage, EventHandler } from './rabbitmq.js';
import { databaseService } from '../services/index.js';
import { CreateAuditLogRequest } from '../types/index.js';

// Handler for user login events
export const handleUserLogin: EventHandler = async (event: EventMessage) => {
    console.log('🔐 Processing user login event:', {
        eventId: event.eventId,
        userId: event.data.userId,
        email: event.data.email,
        timestamp: event.timestamp
    });

    try {
        // Create audit log entry for database
        const auditLogRequest: CreateAuditLogRequest = {
            serviceName: 'auth-service',
            actionType: 'USER_LOGIN',
            userId: event.data.userId,
            userType: 'customer',
            sessionId: event.data.sessionId,
            resourceType: 'authentication',
            resourceId: event.data.userId,
            ipAddress: event.data.ipAddress,
            userAgent: event.data.userAgent,
            correlationId: event.metadata.correlationId,
            businessContext: {
                email: event.data.email,
                success: event.data.success || true,
                loginMethod: 'standard',
                eventId: event.eventId
            },
            success: event.data.success !== false,
            severity: 'medium',
            complianceTags: ['auth', 'login', 'user-activity']
        };

        // Save to audit database
        const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);
        console.log('✅ Login audit entry saved to database:', {
            id: savedAuditLog.id,
            actionType: savedAuditLog.actionType,
            userId: savedAuditLog.userId,
            timestamp: savedAuditLog.occurredAt
        });
        
    } catch (error) {
        console.error('❌ Failed to save login audit entry:', error);
        throw error; // Re-throw to trigger message retry
    }
};

// Handler for user logout events
export const handleUserLogout: EventHandler = async (event: EventMessage) => {
    console.log('🚪 Processing user logout event:', {
        eventId: event.eventId,
        userId: event.data.userId,
        sessionId: event.data.sessionId,
        timestamp: event.timestamp
    });

    try {
        // Create audit log entry for database
        const auditLogRequest: CreateAuditLogRequest = {
            serviceName: 'auth-service',
            actionType: 'USER_LOGOUT',
            userId: event.data.userId,
            userType: 'customer',
            sessionId: event.data.sessionId,
            resourceType: 'authentication',
            resourceId: event.data.userId,
            correlationId: event.metadata.correlationId,
            businessContext: {
                sessionDuration: event.data.sessionDuration,
                eventId: event.eventId
            },
            success: true,
            severity: 'low',
            complianceTags: ['auth', 'logout', 'user-activity']
        };

        // Save to audit database
        const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);
        console.log('✅ Logout audit entry saved to database:', {
            id: savedAuditLog.id,
            actionType: savedAuditLog.actionType,
            userId: savedAuditLog.userId,
            timestamp: savedAuditLog.occurredAt
        });
        
    } catch (error) {
        console.error('❌ Failed to save logout audit entry:', error);
        throw error; // Re-throw to trigger message retry
    }
};

// Handler for failed authentication attempts
export const handleAuthFailure: EventHandler = async (event: EventMessage) => {
    console.log('🚨 Processing authentication failure:', {
        eventId: event.eventId,
        email: event.data.email,
        reason: event.data.reason,
        timestamp: event.timestamp
    });

    try {
        // Create audit log entry for database
        const auditLogRequest: CreateAuditLogRequest = {
            serviceName: 'auth-service',
            actionType: 'AUTH_FAILURE',
            userType: 'customer',
            resourceType: 'authentication',
            resourceId: event.data.email,
            ipAddress: event.data.ipAddress,
            userAgent: event.data.userAgent,
            correlationId: event.metadata.correlationId,
            businessContext: {
                email: event.data.email,
                failureReason: event.data.reason,
                eventId: event.eventId
            },
            success: false,
            errorMessage: event.data.reason,
            severity: 'high', // Security failures are high severity
            complianceTags: ['auth', 'security', 'failure', 'login-attempt']
        };

        // Save to audit database
        const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);
        console.log('✅ Auth failure audit entry saved to database:', {
            id: savedAuditLog.id,
            actionType: savedAuditLog.actionType,
            resourceId: savedAuditLog.resourceId,
            timestamp: savedAuditLog.occurredAt
        });
        
        // Could trigger security actions:
        // - Rate limiting
        // - Account lockout after multiple failures
        // - Security alerts
        
    } catch (error) {
        console.error('❌ Failed to save auth failure audit entry:', error);
        throw error; // Re-throw to trigger message retry
    }
};

// Handler for token refresh events
export const handleTokenRefresh: EventHandler = async (event: EventMessage) => {
    console.log('🔄 Processing token refresh event:', {
        eventId: event.eventId,
        userId: event.data.userId,
        timestamp: event.timestamp
    });

    try {
        // Create audit log entry for database
        const auditLogRequest: CreateAuditLogRequest = {
            serviceName: 'auth-service',
            actionType: 'TOKEN_REFRESH',
            userId: event.data.userId,
            userType: 'customer',
            resourceType: 'token',
            resourceId: event.data.newTokenId,
            correlationId: event.metadata.correlationId,
            businessContext: {
                oldTokenId: event.data.oldTokenId,
                newTokenId: event.data.newTokenId,
                eventId: event.eventId
            },
            success: true,
            severity: 'low',
            complianceTags: ['auth', 'token', 'security', 'refresh']
        };

        // Save to audit database
        const savedAuditLog = await databaseService.createAuditLog(auditLogRequest);
        console.log('✅ Token refresh audit entry saved to database:', {
            id: savedAuditLog.id,
            actionType: savedAuditLog.actionType,
            userId: savedAuditLog.userId,
            timestamp: savedAuditLog.occurredAt
        });
        
    } catch (error) {
        console.error('❌ Failed to save token refresh audit entry:', error);
        throw error; // Re-throw to trigger message retry
    }
};
