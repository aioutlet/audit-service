/**
 * Audit Service - Bootstrap Entry Point
 * Loads environment and starts the consumer application
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startServer() {
  try {
    // Import and start the application
    const appModule = await import('./app.js');
    await appModule.startConsumer();
  } catch (error) {
    console.error('Failed to start audit service:', error);
    process.exit(1);
  }
}

startServer();
