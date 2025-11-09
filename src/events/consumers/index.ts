/**
 * Event Consumers Index
 * Registers all Dapr pub/sub subscriptions
 */

import { DaprServer } from '@dapr/dapr';
import { registerAuthSubscriptions } from './auth.consumer.js';
import { registerUserSubscriptions } from './user.consumer.js';
import { registerOrderSubscriptions } from './order.consumer.js';
import { registerProductSubscriptions } from './product.consumer.js';
import { registerCartSubscriptions } from './cart.consumer.js';
import { registerInventorySubscriptions } from './inventory.consumer.js';
import { registerReviewSubscriptions } from './review.consumer.js';
import { registerNotificationSubscriptions } from './notification.consumer.js';
import { registerAdminSubscriptions } from './admin.consumer.js';
import logger from '../../core/logger.js';

/**
 * Register all event consumers with Dapr server
 */
export function registerAllSubscriptions(server: DaprServer): void {
  logger.info('Registering all Dapr event subscriptions...');

  // Domain-specific event subscriptions
  registerAuthSubscriptions(server);
  registerUserSubscriptions(server);
  registerOrderSubscriptions(server);
  registerProductSubscriptions(server);
  registerCartSubscriptions(server);
  registerInventorySubscriptions(server);
  registerReviewSubscriptions(server);
  registerNotificationSubscriptions(server);
  registerAdminSubscriptions(server);

  logger.info('✅ All Dapr event subscriptions registered successfully');
}
