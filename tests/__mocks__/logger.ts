/**
 * Mock logger for tests
 */
export default {
  business: jest.fn(),
  security: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
};
