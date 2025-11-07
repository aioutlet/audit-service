/**
 * Test setup file
 * Runs before all tests
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.NAME = 'audit-service';
process.env.VERSION = '1.0.0';
process.env.LOG_LEVEL = 'error';
process.env.LOG_TO_CONSOLE = 'false';
process.env.LOG_TO_FILE = 'false';

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
