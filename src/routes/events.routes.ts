import { Router } from 'express';
import * as eventsController from '../controllers/events.controller.js';

const router = Router();

// Auth Events
router.post('/events/auth/user-registered', eventsController.handleUserRegistered);
router.post('/events/auth/login', eventsController.handleLogin);
router.post('/events/auth/email-verification-requested', eventsController.handleEmailVerificationRequested);
router.post('/events/auth/password-reset-requested', eventsController.handlePasswordResetRequested);
router.post('/events/auth/password-reset-completed', eventsController.handlePasswordResetCompleted);
router.post('/events/auth/account-reactivation-requested', eventsController.handleAccountReactivationRequested);

// User Events
router.post('/events/user/created', eventsController.handleUserCreated);
router.post('/events/user/updated', eventsController.handleUserUpdated);
router.post('/events/user/deleted', eventsController.handleUserDeleted);
router.post('/events/user/email-verified', eventsController.handleEmailVerified);
router.post('/events/user/password-changed', eventsController.handlePasswordChanged);

// Order Events
router.post('/events/order/placed', eventsController.handleOrderPlaced);
router.post('/events/order/cancelled', eventsController.handleOrderCancelled);
router.post('/events/order/delivered', eventsController.handleOrderDelivered);
router.post('/events/order/payment-received', eventsController.handlePaymentReceived);
router.post('/events/order/payment-failed', eventsController.handlePaymentFailed);

// Product Events
router.post('/events/product/created', eventsController.handleProductCreated);
router.post('/events/product/updated', eventsController.handleProductUpdated);
router.post('/events/product/deleted', eventsController.handleProductDeleted);
router.post('/events/product/price-changed', eventsController.handleProductPriceChanged);

// Cart Events
router.post('/events/cart/item-added', eventsController.handleCartItemAdded);
router.post('/events/cart/item-removed', eventsController.handleCartItemRemoved);
router.post('/events/cart/cleared', eventsController.handleCartCleared);
router.post('/events/cart/abandoned', eventsController.handleCartAbandoned);

// Inventory Events
router.post('/events/inventory/stock-updated', eventsController.handleInventoryStockUpdated);
router.post('/events/inventory/restock', eventsController.handleInventoryRestock);
router.post('/events/inventory/low-stock-alert', eventsController.handleInventoryLowStockAlert);
router.post('/events/inventory/reserved', eventsController.handleInventoryReserved);

// Review Events
router.post('/events/review/created', eventsController.handleReviewCreated);
router.post('/events/review/updated', eventsController.handleReviewUpdated);
router.post('/events/review/deleted', eventsController.handleReviewDeleted);
router.post('/events/review/moderated', eventsController.handleReviewModerated);
router.post('/events/review/flagged', eventsController.handleReviewFlagged);

// Notification Events
router.post('/events/notification/sent', eventsController.handleNotificationSent);
router.post('/events/notification/delivered', eventsController.handleNotificationDelivered);
router.post('/events/notification/failed', eventsController.handleNotificationFailed);
router.post('/events/notification/opened', eventsController.handleNotificationOpened);

// Admin Events
router.post('/events/admin/action-performed', eventsController.handleAdminActionPerformed);
router.post('/events/admin/user-created', eventsController.handleAdminUserCreated);
router.post('/events/admin/config-changed', eventsController.handleAdminConfigChanged);

export default router;
