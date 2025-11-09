/**
 * Review Event Consumer
 * Subscribes to review-related events via Dapr pub/sub
 */

import { DaprServer } from '@dapr/dapr';
import logger from '../../core/logger.js';
import { trackMessageProcessed } from '../../app.js';

const PUBSUB_NAME = 'audit-pubsub';

/**
 * Register all review event subscriptions
 */
export function registerReviewSubscriptions(server: DaprServer): void {
  // Review created event
  server.pubsub.subscribe(PUBSUB_NAME, 'review.created', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('REVIEW_CREATED', {
        eventId: event.eventId,
        reviewId: event.data?.reviewId,
        productId: event.data?.productId,
        userId: event.data?.userId,
        rating: event.data?.rating,
        source: event.source || 'review-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'review',
        resourceId: event.data?.reviewId,
        severity: 'low',
        complianceTags: ['review', 'user-content'],
      });
    } catch (error) {
      logger.error('Error handling review.created event', { error, event });
      throw error;
    }
  });

  // Review updated event
  server.pubsub.subscribe(PUBSUB_NAME, 'review.updated', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.business('REVIEW_UPDATED', {
        eventId: event.eventId,
        reviewId: event.data?.reviewId,
        updatedFields: event.data?.updatedFields,
        updatedBy: event.data?.updatedBy,
        source: event.source || 'review-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'review',
        resourceId: event.data?.reviewId,
        severity: 'low',
        complianceTags: ['review', 'user-content'],
      });
    } catch (error) {
      logger.error('Error handling review.updated event', { error, event });
      throw error;
    }
  });

  // Review deleted event
  server.pubsub.subscribe(PUBSUB_NAME, 'review.deleted', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('REVIEW_DELETED', {
        eventId: event.eventId,
        reviewId: event.data?.reviewId,
        deletedBy: event.data?.deletedBy,
        reason: event.data?.reason,
        source: event.source || 'review-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'review',
        resourceId: event.data?.reviewId,
        severity: 'medium',
        complianceTags: ['review', 'user-content', 'moderation', 'deletion'],
      });
    } catch (error) {
      logger.error('Error handling review.deleted event', { error, event });
      throw error;
    }
  });

  // Review moderated event
  server.pubsub.subscribe(PUBSUB_NAME, 'review.moderated', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('REVIEW_MODERATED', {
        eventId: event.eventId,
        reviewId: event.data?.reviewId,
        moderatedBy: event.data?.moderatedBy,
        action: event.data?.action,
        reason: event.data?.reason,
        source: event.source || 'review-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'review',
        resourceId: event.data?.reviewId,
        severity: 'high',
        complianceTags: ['review', 'user-content', 'moderation', 'security'],
      });
    } catch (error) {
      logger.error('Error handling review.moderated event', { error, event });
      throw error;
    }
  });

  // Review flagged event
  server.pubsub.subscribe(PUBSUB_NAME, 'review.flagged', async (event: any) => {
    try {
      trackMessageProcessed();
      logger.security('REVIEW_FLAGGED', {
        eventId: event.eventId,
        reviewId: event.data?.reviewId,
        flaggedBy: event.data?.flaggedBy,
        reason: event.data?.reason,
        source: event.source || 'review-service',
        traceId: event.metadata?.traceId,
        spanId: event.metadata?.spanId,
        resourceType: 'review',
        resourceId: event.data?.reviewId,
        severity: 'high',
        complianceTags: ['review', 'user-content', 'flagged', 'alert', 'security'],
      });
    } catch (error) {
      logger.error('Error handling review.flagged event', { error, event });
      throw error;
    }
  });
}
