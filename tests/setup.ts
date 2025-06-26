/**
 * Jest setup file for global test configuration
 * This file is run once before all test suites
 */

// Extend Jest matchers if needed
// import '@testing-library/jest-dom';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;
  console.log = originalLog;
});

// Global test utilities
global.testUtils = {
  // Add common test utilities here
  mockDate: (date: string | Date): void => {
    const mockDate = new Date(date);
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  },

  restoreDate: (): void => {
    jest.useRealTimers();
  },
};

// Type augmentation for global test utilities
declare global {
  var testUtils: {
    mockDate: (date: string | Date) => void;
    restoreDate: () => void;
  };
}
