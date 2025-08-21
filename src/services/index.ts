// Service instances that can be imported across the application
import { DatabaseService } from './database.js';
import { RedisService } from './redis.js';

// Create singleton instances
export const databaseService = new DatabaseService();
export const redisService = new RedisService();

// Initialize services
export async function initializeServices(): Promise<void> {
  await databaseService.initialize();
  await redisService.initialize();
}

// Cleanup services
export async function cleanupServices(): Promise<void> {
  await databaseService.close();
  await redisService.close();
}

export { DatabaseService, RedisService };
