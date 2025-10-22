/**
 * Event Handlers Index
 * Exports all event handlers organized by domain
 */

// Auth handlers
export {
  handleUserRegistered,
  handleUserLogin,
  handleEmailVerificationRequested,
  handlePasswordResetRequested,
  handlePasswordResetCompleted,
  handleAccountReactivationRequested,
} from './auth.handler.js';

// User handlers
export {
  handleUserCreated,
  handleUserUpdated,
  handleUserDeleted,
  handleEmailVerified,
  handlePasswordChanged,
} from './user.handler.js';

// Order and Payment handlers
export {
  handleOrderPlaced,
  handleOrderCancelled,
  handleOrderDelivered,
  handlePaymentReceived,
  handlePaymentFailed,
} from './order.handler.js';

// Product handlers
export {
  handleProductCreated,
  handleProductUpdated,
  handleProductDeleted,
  handleProductPriceChanged,
} from './product.handler.js';

// Cart handlers
export { handleCartItemAdded, handleCartItemRemoved, handleCartCleared, handleCartAbandoned } from './cart.handler.js';

// Inventory handlers
export {
  handleInventoryStockUpdated,
  handleInventoryRestock,
  handleInventoryLowStockAlert,
  handleInventoryReserved,
} from './inventory.handler.js';

// Review handlers
export {
  handleReviewCreated,
  handleReviewUpdated,
  handleReviewDeleted,
  handleReviewModerated,
  handleReviewFlagged,
} from './review.handler.js';

// Notification handlers
export {
  handleNotificationSent,
  handleNotificationDelivered,
  handleNotificationFailed,
  handleNotificationOpened,
} from './notification.handler.js';

// Admin handlers
export { handleAdminActionPerformed, handleAdminUserCreated, handleAdminConfigChanged } from './admin.handler.js';
