/**
 * Common test helper functions and utilities
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Creates a temporary directory for testing
 */
export async function createTempDir(prefix = 'mcp-test-'): Promise<string> {
  const tempPath = join(
    tmpdir(),
    `${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}`,
  );
  await fs.mkdir(tempPath, { recursive: true });
  return tempPath;
}

/**
 * Recursively removes a directory and all its contents
 */
export async function cleanupTempDir(path: string): Promise<void> {
  try {
    await fs.rm(path, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn(`Failed to cleanup temp directory: ${path}`, error);
  }
}

/**
 * Creates a mock file structure in the given directory
 */
export async function createMockFileStructure(
  basePath: string,
  structure: Record<string, string | Record<string, any>>,
): Promise<void> {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = join(basePath, name);

    if (typeof content === 'string') {
      // Create file
      const dir = join(fullPath, '..');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
    } else {
      // Create directory and recurse
      await fs.mkdir(fullPath, { recursive: true });
      await createMockFileStructure(fullPath, content);
    }
  }
}

/**
 * Reads a fixture file from tests/fixtures directory
 */
export async function loadFixture(filename: string): Promise<string> {
  const fixturePath = join(__dirname, '..', 'fixtures', filename);
  return fs.readFile(fixturePath, 'utf8');
}

/**
 * Waits for a specified amount of time (useful for async testing)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a mock logger for testing
 */
export function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

/**
 * Validates that an object matches the expected shape
 */
export function expectObjectShape(
  obj: any,
  expectedShape: Record<string, string>,
): void {
  for (const [key, expectedType] of Object.entries(expectedShape)) {
    expect(obj).toHaveProperty(key);
    expect(typeof obj[key]).toBe(expectedType);
  }
}

/**
 * Creates a spy on console methods to capture output
 */
export function createConsoleSpy() {
  const originalConsole = { ...console };
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(),
    info: jest.spyOn(console, 'info').mockImplementation(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
    debug: jest.spyOn(console, 'debug').mockImplementation(),
  };

  return {
    spies,
    restore: () => {
      Object.assign(console, originalConsole);
      Object.values(spies).forEach(spy => spy.mockRestore());
    },
  };
}

/**
 * Assertion helper for async operations that should throw
 */
export async function expectAsyncThrow(
  asyncFn: () => Promise<any>,
  expectedError?: string | RegExp,
): Promise<void> {
  try {
    await asyncFn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    if (expectedError) {
      if (typeof expectedError === 'string') {
        expect((error as Error).message).toContain(expectedError);
      } else {
        expect((error as Error).message).toMatch(expectedError);
      }
    }
  }
}

/**
 * Mock file system operations
 */
export function createMockFile(filename: string, content: string): void {
  const fs = require('fs');
  fs.readFileSync.mockImplementation((path: string) => {
    if (path.includes(filename)) {
      return content;
    }
    throw new Error(`File not found: ${path}`);
  });
}
