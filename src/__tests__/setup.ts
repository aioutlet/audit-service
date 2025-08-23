// Test setup file - this ensures tests have the basic configuration they need

// Mock the logger to prevent actual logging during tests
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Clean up after tests
});

// Basic test to ensure Jest is working
describe('Test Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });
});
