/**
 * Events Controller
 * Handles audit event logging from Dapr pub/sub
 */

import { Request, Response } from 'express';
import logger from '../core/logger.js';
import { trackMessageProcessed } from '../app.js';

/**
 * Generic event handler wrapper
 */
const handleEvent = (eventName: string, logFunction: Function) => {
  return async (req: Request, res: Response) => {
    try {
      trackMessageProcessed();
      const event = req.body;
      await logFunction(event);
      res.status(200).json({ status: 'SUCCESS' });
    } catch (error) {
      logger.error(`Error handling ${eventName} event`, { error, event: req.body });
      res.status(200).json({ status: 'SUCCESS' }); // Return success to avoid retries
    }
  };
};

// Auth Events
export const handleUserRegistered = handleEvent('auth.user.registered', (event: any) => {
  logger.business('USER_REGISTERED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    firstName: event.data?.firstName,
    lastName: event.data?.lastName,
    ipAddress: event.data?.ipAddress,
    userAgent: event.data?.userAgent,
    registeredAt: event.data?.registeredAt || event.timestamp,
    source: event.source || 'auth-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'medium',
    complianceTags: ['auth', 'user-registration', 'user-activity', 'security'],
  });
});

export const handleLogin = handleEvent('auth.login', (event: any) => {
  const success = event.data?.success !== false;
  const severity = success ? 'medium' : 'high';

  if (success) {
    logger.business('USER_LOGIN', {
      eventId: event.eventId,
      userId: event.data?.userId,
      email: event.data?.email,
      sessionId: event.data?.sessionId,
      loginMethod: event.data?.loginMethod || 'password',
      ipAddress: event.data?.ipAddress,
      userAgent: event.data?.userAgent,
      source: event.source || 'auth-service',
      traceId: event.metadata?.traceId,
      spanId: event.metadata?.spanId,
      resourceType: 'auth',
      resourceId: event.data?.userId,
      severity,
      complianceTags: ['auth', 'login', 'user-activity', 'security'],
    });
  } else {
    logger.security('USER_LOGIN_FAILED', {
      eventId: event.eventId,
      userId: event.data?.userId,
      email: event.data?.email,
      errorMessage: event.data?.errorMessage,
      ipAddress: event.data?.ipAddress,
      userAgent: event.data?.userAgent,
      source: event.source || 'auth-service',
      traceId: event.metadata?.traceId,
      spanId: event.metadata?.spanId,
      resourceType: 'auth',
      resourceId: event.data?.userId,
      severity,
      complianceTags: ['auth', 'login-failed', 'security', 'alert'],
    });
  }
});

export const handleEmailVerificationRequested = handleEvent('auth.email.verification.requested', (event: any) => {
  logger.business('EMAIL_VERIFICATION_REQUESTED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    expiresAt: event.data?.expiresAt,
    ipAddress: event.data?.ipAddress,
    source: event.source || 'auth-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'email',
    resourceId: event.data?.email,
    severity: 'low',
    complianceTags: ['auth', 'email-verification', 'user-activity'],
  });
});

export const handlePasswordResetRequested = handleEvent('auth.password.reset.requested', (event: any) => {
  logger.security('PASSWORD_RESET_REQUESTED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    expiresAt: event.data?.expiresAt,
    ipAddress: event.data?.requestIp,
    source: event.source || 'auth-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'auth',
    resourceId: event.data?.userId,
    severity: 'high',
    complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
  });
});

export const handlePasswordResetCompleted = handleEvent('auth.password.reset.completed', (event: any) => {
  logger.security('PASSWORD_RESET_COMPLETED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    changedAt: event.data?.changedAt,
    ipAddress: event.data?.changedIp,
    source: event.source || 'auth-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'auth',
    resourceId: event.data?.userId,
    severity: 'critical',
    complianceTags: ['auth', 'password-reset', 'security', 'user-activity'],
  });
});

export const handleAccountReactivationRequested = handleEvent('auth.account.reactivation.requested', (event: any) => {
  logger.business('ACCOUNT_REACTIVATION_REQUESTED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    expiresAt: event.data?.expiresAt,
    source: event.source || 'auth-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'medium',
    complianceTags: ['auth', 'account-reactivation', 'user-activity'],
  });
});

// User Events
export const handleUserCreated = handleEvent('user.created', (event: any) => {
  logger.business('USER_CREATED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    createdBy: event.data?.createdBy,
    source: event.source || 'user-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'medium',
    complianceTags: ['user', 'user-management', 'data-creation'],
  });
});

export const handleUserUpdated = handleEvent('user.updated', (event: any) => {
  logger.business('USER_UPDATED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    updatedFields: event.data?.updatedFields,
    updatedBy: event.data?.updatedBy,
    source: event.source || 'user-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'medium',
    complianceTags: ['user', 'user-management', 'data-modification'],
  });
});

export const handleUserDeleted = handleEvent('user.deleted', (event: any) => {
  logger.security('USER_DELETED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    deletedBy: event.data?.deletedBy,
    reason: event.data?.reason,
    source: event.source || 'user-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'critical',
    complianceTags: ['user', 'user-management', 'data-deletion', 'gdpr'],
  });
});

export const handleEmailVerified = handleEvent('email.verified', (event: any) => {
  logger.business('EMAIL_VERIFIED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    email: event.data?.email,
    verifiedAt: event.data?.verifiedAt,
    source: event.source || 'user-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'low',
    complianceTags: ['user', 'email-verification', 'user-activity'],
  });
});

export const handlePasswordChanged = handleEvent('password.changed', (event: any) => {
  logger.security('PASSWORD_CHANGED', {
    eventId: event.eventId,
    userId: event.data?.userId,
    changedAt: event.data?.changedAt,
    source: event.source || 'user-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'user',
    resourceId: event.data?.userId,
    severity: 'high',
    complianceTags: ['user', 'password-change', 'security'],
  });
});

// Order Events
export const handleOrderPlaced = handleEvent('order.placed', (event: any) => {
  logger.business('ORDER_PLACED', {
    eventId: event.eventId,
    orderId: event.data?.orderId,
    userId: event.data?.userId,
    totalAmount: event.data?.totalAmount,
    source: event.source || 'order-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'order',
    resourceId: event.data?.orderId,
    severity: 'high',
    complianceTags: ['order', 'transaction', 'financial'],
  });
});

export const handleOrderCancelled = handleEvent('order.cancelled', (event: any) => {
  logger.business('ORDER_CANCELLED', {
    eventId: event.eventId,
    orderId: event.data?.orderId,
    userId: event.data?.userId,
    reason: event.data?.reason,
    source: event.source || 'order-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'order',
    resourceId: event.data?.orderId,
    severity: 'medium',
    complianceTags: ['order', 'cancellation', 'transaction'],
  });
});

export const handleOrderDelivered = handleEvent('order.delivered', (event: any) => {
  logger.business('ORDER_DELIVERED', {
    eventId: event.eventId,
    orderId: event.data?.orderId,
    userId: event.data?.userId,
    deliveredAt: event.data?.deliveredAt,
    source: event.source || 'order-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'order',
    resourceId: event.data?.orderId,
    severity: 'medium',
    complianceTags: ['order', 'fulfillment', 'delivery'],
  });
});

export const handlePaymentReceived = handleEvent('payment.received', (event: any) => {
  logger.business('PAYMENT_RECEIVED', {
    eventId: event.eventId,
    orderId: event.data?.orderId,
    paymentId: event.data?.paymentId,
    amount: event.data?.amount,
    paymentMethod: event.data?.paymentMethod,
    source: event.source || 'payment-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'payment',
    resourceId: event.data?.paymentId,
    severity: 'critical',
    complianceTags: ['payment', 'financial', 'transaction', 'pci-dss'],
  });
});

export const handlePaymentFailed = handleEvent('payment.failed', (event: any) => {
  logger.security('PAYMENT_FAILED', {
    eventId: event.eventId,
    orderId: event.data?.orderId,
    paymentId: event.data?.paymentId,
    amount: event.data?.amount,
    reason: event.data?.reason,
    source: event.source || 'payment-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'payment',
    resourceId: event.data?.paymentId,
    severity: 'high',
    complianceTags: ['payment', 'financial', 'failure', 'alert'],
  });
});

// Product Events
export const handleProductCreated = handleEvent('product.created', (event: any) => {
  logger.business('PRODUCT_CREATED', {
    eventId: event.eventId,
    productId: event.data?.productId,
    name: event.data?.name,
    createdBy: event.data?.createdBy,
    source: event.source || 'product-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'product',
    resourceId: event.data?.productId,
    severity: 'low',
    complianceTags: ['product', 'catalog', 'data-creation'],
  });
});

export const handleProductUpdated = handleEvent('product.updated', (event: any) => {
  logger.business('PRODUCT_UPDATED', {
    eventId: event.eventId,
    productId: event.data?.productId,
    updatedFields: event.data?.updatedFields,
    updatedBy: event.data?.updatedBy,
    source: event.source || 'product-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'product',
    resourceId: event.data?.productId,
    severity: 'low',
    complianceTags: ['product', 'catalog', 'data-modification'],
  });
});

export const handleProductDeleted = handleEvent('product.deleted', (event: any) => {
  logger.business('PRODUCT_DELETED', {
    eventId: event.eventId,
    productId: event.data?.productId,
    deletedBy: event.data?.deletedBy,
    source: event.source || 'product-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'product',
    resourceId: event.data?.productId,
    severity: 'medium',
    complianceTags: ['product', 'catalog', 'data-deletion'],
  });
});

export const handleProductPriceChanged = handleEvent('product.price.changed', (event: any) => {
  logger.business('PRODUCT_PRICE_CHANGED', {
    eventId: event.eventId,
    productId: event.data?.productId,
    oldPrice: event.data?.oldPrice,
    newPrice: event.data?.newPrice,
    changedBy: event.data?.changedBy,
    source: event.source || 'product-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'product',
    resourceId: event.data?.productId,
    severity: 'medium',
    complianceTags: ['product', 'pricing', 'financial'],
  });
});

// Cart Events
export const handleCartItemAdded = handleEvent('cart.item.added', (event: any) => {
  logger.business('CART_ITEM_ADDED', {
    eventId: event.eventId,
    cartId: event.data?.cartId,
    userId: event.data?.userId,
    productId: event.data?.productId,
    quantity: event.data?.quantity,
    source: event.source || 'cart-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'cart',
    resourceId: event.data?.cartId,
    severity: 'low',
    complianceTags: ['cart', 'user-activity'],
  });
});

export const handleCartItemRemoved = handleEvent('cart.item.removed', (event: any) => {
  logger.business('CART_ITEM_REMOVED', {
    eventId: event.eventId,
    cartId: event.data?.cartId,
    userId: event.data?.userId,
    productId: event.data?.productId,
    source: event.source || 'cart-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'cart',
    resourceId: event.data?.cartId,
    severity: 'low',
    complianceTags: ['cart', 'user-activity'],
  });
});

export const handleCartCleared = handleEvent('cart.cleared', (event: any) => {
  logger.business('CART_CLEARED', {
    eventId: event.eventId,
    cartId: event.data?.cartId,
    userId: event.data?.userId,
    source: event.source || 'cart-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'cart',
    resourceId: event.data?.cartId,
    severity: 'low',
    complianceTags: ['cart', 'user-activity'],
  });
});

export const handleCartAbandoned = handleEvent('cart.abandoned', (event: any) => {
  logger.business('CART_ABANDONED', {
    eventId: event.eventId,
    cartId: event.data?.cartId,
    userId: event.data?.userId,
    totalValue: event.data?.totalValue,
    source: event.source || 'cart-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'cart',
    resourceId: event.data?.cartId,
    severity: 'medium',
    complianceTags: ['cart', 'abandonment', 'analytics'],
  });
});

// Inventory Events
export const handleInventoryStockUpdated = handleEvent('inventory.stock.updated', (event: any) => {
  logger.business('INVENTORY_STOCK_UPDATED', {
    eventId: event.eventId,
    productId: event.data?.productId,
    oldStock: event.data?.oldStock,
    newStock: event.data?.newStock,
    source: event.source || 'inventory-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'inventory',
    resourceId: event.data?.productId,
    severity: 'medium',
    complianceTags: ['inventory', 'stock-management'],
  });
});

export const handleInventoryRestock = handleEvent('inventory.restock', (event: any) => {
  logger.business('INVENTORY_RESTOCK', {
    eventId: event.eventId,
    productId: event.data?.productId,
    quantity: event.data?.quantity,
    source: event.source || 'inventory-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'inventory',
    resourceId: event.data?.productId,
    severity: 'medium',
    complianceTags: ['inventory', 'restocking'],
  });
});

export const handleInventoryLowStockAlert = handleEvent('inventory.low.stock.alert', (event: any) => {
  logger.business('INVENTORY_LOW_STOCK_ALERT', {
    eventId: event.eventId,
    productId: event.data?.productId,
    currentStock: event.data?.currentStock,
    threshold: event.data?.threshold,
    source: event.source || 'inventory-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'inventory',
    resourceId: event.data?.productId,
    severity: 'high',
    complianceTags: ['inventory', 'alert', 'stock-management'],
  });
});

export const handleInventoryReserved = handleEvent('inventory.reserved', (event: any) => {
  logger.business('INVENTORY_RESERVED', {
    eventId: event.eventId,
    productId: event.data?.productId,
    quantity: event.data?.quantity,
    orderId: event.data?.orderId,
    source: event.source || 'inventory-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'inventory',
    resourceId: event.data?.productId,
    severity: 'medium',
    complianceTags: ['inventory', 'reservation'],
  });
});

// Review Events
export const handleReviewCreated = handleEvent('review.created', (event: any) => {
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
});

export const handleReviewUpdated = handleEvent('review.updated', (event: any) => {
  logger.business('REVIEW_UPDATED', {
    eventId: event.eventId,
    reviewId: event.data?.reviewId,
    productId: event.data?.productId,
    userId: event.data?.userId,
    source: event.source || 'review-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'review',
    resourceId: event.data?.reviewId,
    severity: 'low',
    complianceTags: ['review', 'user-content'],
  });
});

export const handleReviewDeleted = handleEvent('review.deleted', (event: any) => {
  logger.business('REVIEW_DELETED', {
    eventId: event.eventId,
    reviewId: event.data?.reviewId,
    productId: event.data?.productId,
    deletedBy: event.data?.deletedBy,
    source: event.source || 'review-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'review',
    resourceId: event.data?.reviewId,
    severity: 'medium',
    complianceTags: ['review', 'content-moderation'],
  });
});

export const handleReviewModerated = handleEvent('review.moderated', (event: any) => {
  logger.business('REVIEW_MODERATED', {
    eventId: event.eventId,
    reviewId: event.data?.reviewId,
    moderatedBy: event.data?.moderatedBy,
    action: event.data?.action,
    source: event.source || 'review-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'review',
    resourceId: event.data?.reviewId,
    severity: 'medium',
    complianceTags: ['review', 'content-moderation', 'admin-action'],
  });
});

export const handleReviewFlagged = handleEvent('review.flagged', (event: any) => {
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
    complianceTags: ['review', 'content-moderation', 'user-report'],
  });
});

// Notification Events
export const handleNotificationSent = handleEvent('notification.sent', (event: any) => {
  logger.business('NOTIFICATION_SENT', {
    eventId: event.eventId,
    notificationId: event.data?.notificationId,
    userId: event.data?.userId,
    type: event.data?.type,
    channel: event.data?.channel,
    source: event.source || 'notification-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'notification',
    resourceId: event.data?.notificationId,
    severity: 'low',
    complianceTags: ['notification', 'communication'],
  });
});

export const handleNotificationDelivered = handleEvent('notification.delivered', (event: any) => {
  logger.business('NOTIFICATION_DELIVERED', {
    eventId: event.eventId,
    notificationId: event.data?.notificationId,
    userId: event.data?.userId,
    source: event.source || 'notification-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'notification',
    resourceId: event.data?.notificationId,
    severity: 'low',
    complianceTags: ['notification', 'communication'],
  });
});

export const handleNotificationFailed = handleEvent('notification.failed', (event: any) => {
  logger.business('NOTIFICATION_FAILED', {
    eventId: event.eventId,
    notificationId: event.data?.notificationId,
    userId: event.data?.userId,
    error: event.data?.error,
    source: event.source || 'notification-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'notification',
    resourceId: event.data?.notificationId,
    severity: 'medium',
    complianceTags: ['notification', 'communication', 'failure'],
  });
});

export const handleNotificationOpened = handleEvent('notification.opened', (event: any) => {
  logger.business('NOTIFICATION_OPENED', {
    eventId: event.eventId,
    notificationId: event.data?.notificationId,
    userId: event.data?.userId,
    openedAt: event.data?.openedAt,
    source: event.source || 'notification-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'notification',
    resourceId: event.data?.notificationId,
    severity: 'low',
    complianceTags: ['notification', 'user-engagement'],
  });
});

// Admin Events
export const handleAdminActionPerformed = handleEvent('admin.action.performed', (event: any) => {
  logger.security('ADMIN_ACTION_PERFORMED', {
    eventId: event.eventId,
    adminId: event.data?.adminId,
    action: event.data?.action,
    targetResource: event.data?.targetResource,
    source: event.source || 'admin-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'admin',
    resourceId: event.data?.adminId,
    severity: 'high',
    complianceTags: ['admin', 'privileged-action', 'security'],
  });
});

export const handleAdminUserCreated = handleEvent('admin.user.created', (event: any) => {
  logger.security('ADMIN_USER_CREATED', {
    eventId: event.eventId,
    adminId: event.data?.adminId,
    userId: event.data?.userId,
    source: event.source || 'admin-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'admin',
    resourceId: event.data?.adminId,
    severity: 'high',
    complianceTags: ['admin', 'user-management', 'security'],
  });
});

export const handleAdminConfigChanged = handleEvent('admin.config.changed', (event: any) => {
  logger.security('ADMIN_CONFIG_CHANGED', {
    eventId: event.eventId,
    adminId: event.data?.adminId,
    configKey: event.data?.configKey,
    oldValue: event.data?.oldValue,
    newValue: event.data?.newValue,
    source: event.source || 'admin-service',
    traceId: event.metadata?.traceId,
    spanId: event.metadata?.spanId,
    resourceType: 'config',
    resourceId: event.data?.configKey,
    severity: 'critical',
    complianceTags: ['admin', 'configuration', 'system-change'],
  });
});
