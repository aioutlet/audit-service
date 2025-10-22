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
