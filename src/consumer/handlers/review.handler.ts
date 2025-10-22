/**
 * Review Event Handlers
 * Handles review-related events by writing structured audit logs
 */

import { EventMessage, EventHandler } from '../messaging/messageBroker.js';
import logger from '../observability/logging/index.js';
import auditLogService from '../database/auditLogService.js';
import { trackMessageProcessed } from '../server.js';

/**
 * Handle review created events
 */
export const handleReviewCreated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('review', 'created', event, {
      resourceType: 'review',
      resourceId: event.data.reviewId || event.data.id,
      userId: event.data.userId || event.data.createdBy,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        productId: event.data.productId,
        rating: event.data.rating,
        title: event.data.title,
        content: event.data.content,
        verified: event.data.verified,
        orderId: event.data.orderId,
      },
    });

    logger.business('REVIEW_CREATED', {
      eventId: event.eventId,
      reviewId: event.data.reviewId || event.data.id,
      userId: event.data.userId,
      productId: event.data.productId,
      rating: event.data.rating,
      verified: event.data.verified,
      source: event.source || 'review-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'review',
      severity: 'low',
      complianceTags: ['review', 'user-generated-content', 'product-feedback'],
    });
  } catch (error) {
    logger.error('❌ Failed to process review.created event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle review updated events
 */
export const handleReviewUpdated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('review', 'updated', event, {
      resourceType: 'review',
      resourceId: event.data.reviewId || event.data.id,
      userId: event.data.userId || event.data.updatedBy,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        updatedFields: event.data.updatedFields,
        previousValues: event.data.previousValues,
        newValues: event.data.newValues,
        reason: event.data.reason,
      },
    });

    logger.business('REVIEW_UPDATED', {
      eventId: event.eventId,
      reviewId: event.data.reviewId || event.data.id,
      userId: event.data.userId,
      updatedFields: event.data.updatedFields,
      updatedBy: event.data.updatedBy,
      source: event.source || 'review-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'review',
      severity: 'low',
      complianceTags: ['review', 'user-generated-content', 'content-modification'],
    });
  } catch (error) {
    logger.error('❌ Failed to process review.updated event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle review deleted events
 */
export const handleReviewDeleted: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('review', 'deleted', event, {
      resourceType: 'review',
      resourceId: event.data.reviewId || event.data.id,
      userId: event.data.deletedBy || event.data.userId,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        deletedBy: event.data.deletedBy,
        reason: event.data.reason,
        reviewData: event.data.reviewData,
        moderationAction: event.data.moderationAction,
      },
    });

    logger.security('REVIEW_DELETED', {
      eventId: event.eventId,
      reviewId: event.data.reviewId || event.data.id,
      userId: event.data.userId,
      deletedBy: event.data.deletedBy,
      reason: event.data.reason,
      moderationAction: event.data.moderationAction,
      source: event.source || 'review-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'review',
      severity: 'medium',
      complianceTags: ['review', 'content-moderation', 'user-generated-content'],
    });
  } catch (error) {
    logger.error('❌ Failed to process review.deleted event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle review moderated events
 */
export const handleReviewModerated: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('review', 'moderated', event, {
      resourceType: 'review',
      resourceId: event.data.reviewId || event.data.id,
      userId: event.data.moderatedBy,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        moderationAction: event.data.moderationAction,
        reason: event.data.reason,
        flagCount: event.data.flagCount,
        autoModerated: event.data.autoModerated,
        previousStatus: event.data.previousStatus,
        newStatus: event.data.newStatus,
      },
    });

    logger.security('REVIEW_MODERATED', {
      eventId: event.eventId,
      reviewId: event.data.reviewId || event.data.id,
      moderatedBy: event.data.moderatedBy,
      moderationAction: event.data.moderationAction,
      reason: event.data.reason,
      autoModerated: event.data.autoModerated,
      source: event.source || 'review-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'review',
      severity: 'medium',
      complianceTags: ['review', 'content-moderation', 'security', 'compliance'],
    });
  } catch (error) {
    logger.error('❌ Failed to process review.moderated event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Handle review flagged events
 */
export const handleReviewFlagged: EventHandler = async (event: EventMessage) => {
  trackMessageProcessed();

  try {
    await auditLogService.writeAuditLogFromEvent('review', 'flagged', event, {
      resourceType: 'review',
      resourceId: event.data.reviewId || event.data.id,
      userId: event.data.flaggedBy,
      ipAddress: event.data.ipAddress || null,
      userAgent: event.data.userAgent || null,
      eventData: {
        flaggedBy: event.data.flaggedBy,
        flagReason: event.data.flagReason,
        flagType: event.data.flagType,
        flagCount: event.data.flagCount,
        automated: event.data.automated,
      },
    });

    logger.security('REVIEW_FLAGGED', {
      eventId: event.eventId,
      reviewId: event.data.reviewId || event.data.id,
      flaggedBy: event.data.flaggedBy,
      flagReason: event.data.flagReason,
      flagType: event.data.flagType,
      flagCount: event.data.flagCount,
      automated: event.data.automated,
      source: event.source || 'review-service',
      correlationId: event.metadata?.correlationId,
      resourceType: 'review',
      severity: 'high',
      complianceTags: ['review', 'content-moderation', 'security', 'user-safety'],
    });
  } catch (error) {
    logger.error('❌ Failed to process review.flagged event', {
      eventId: event.eventId,
      correlationId: event.metadata?.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};
