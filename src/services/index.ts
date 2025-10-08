// Service instances that can be imported across the application
import { DatabaseService } from './database.js';

// Create singleton instances
export const databaseService = new DatabaseService();

// Initialize services
export async function initializeServices(): Promise<void> {
  await databaseService.initialize();
}

// Cleanup services
export async function cleanupServices(): Promise<void> {
  await databaseService.close();
}

export { DatabaseService };
