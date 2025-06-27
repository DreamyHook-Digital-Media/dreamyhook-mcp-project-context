/**
 * Unit tests for MCP Middleware
 */

import {
  errorHandlingMiddleware,
  generateRequestId,
  RateLimiter,
  ValidationError,
  NotFoundError,
  PermissionError,
  validationMiddleware,
} from '../../../src/mcp/middleware';
import { createConsoleSpy } from '../../helpers/test-helpers';

describe('MCP Middleware', () => {
  let consoleSpy: ReturnType<typeof createConsoleSpy>;

  beforeEach(() => {
    consoleSpy = createConsoleSpy();
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  describe('generateRequestId', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^req_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('errorHandlingMiddleware', () => {
    const mockContext = {
      requestId: 'test-123',
      timestamp: new Date(),
      method: 'TestMethod',
      params: { test: 'value' },
    };

    it('should pass through successful operations', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await errorHandlingMiddleware(operation, mockContext);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle ValidationError', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new ValidationError('Invalid input'));

      await expect(
        errorHandlingMiddleware(operation, mockContext),
      ).rejects.toThrow('Invalid request: Invalid input');
    });

    it('should handle NotFoundError', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new NotFoundError('Resource missing'));

      await expect(
        errorHandlingMiddleware(operation, mockContext),
      ).rejects.toThrow('Resource not found: Resource missing');
    });

    it('should handle PermissionError', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new PermissionError('Access denied'));

      await expect(
        errorHandlingMiddleware(operation, mockContext),
      ).rejects.toThrow('Permission denied: Access denied');
    });

    it('should handle unknown errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('Something went wrong'));

      await expect(
        errorHandlingMiddleware(operation, mockContext),
      ).rejects.toThrow('Internal server error');
    });

    it('should log errors with context', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);

      try {
        await errorHandlingMiddleware(operation, mockContext);
      } catch {
        // Expected to throw
      }

      expect(consoleSpy.spies.error).toHaveBeenCalledWith(
        '[MCPMiddleware] ERROR:',
        'Error in TestMethod:',
        expect.objectContaining({
          requestId: 'test-123',
          error: 'Test error',
          stack: expect.any(String),
          timestamp: expect.any(Date),
        }),
      );
    });
  });

  describe('validationMiddleware', () => {
    const mockContext = {
      requestId: 'test-123',
      timestamp: new Date(),
      method: 'TestMethod',
    };

    it('should pass validation for valid data', () => {
      const schema = {
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const data = { name: 'John', age: 30 };

      expect(() =>
        validationMiddleware(schema, data, mockContext),
      ).not.toThrow();
    });

    it('should fail validation for missing required fields', () => {
      const schema = {
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const data = { name: 'John' }; // missing age

      expect(() => validationMiddleware(schema, data, mockContext)).toThrow(
        ValidationError,
      );
    });

    it('should fail validation for wrong types', () => {
      const schema = {
        required: ['name', 'age'],
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };

      const data = { name: 'John', age: '30' }; // age should be number

      expect(() => validationMiddleware(schema, data, mockContext)).toThrow(
        ValidationError,
      );
    });

    it('should handle schema without required fields', () => {
      const schema = {
        properties: {
          name: { type: 'string' },
        },
      };

      const data = { name: 'John' };

      expect(() =>
        validationMiddleware(schema, data, mockContext),
      ).not.toThrow();
    });

    it('should handle schema without properties', () => {
      const schema = {
        required: ['name'],
      };

      const data = { name: 'John' };

      expect(() =>
        validationMiddleware(schema, data, mockContext),
      ).not.toThrow();
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 60000); // 5 requests per minute

      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client1')).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(2, 60000); // 2 requests per minute

      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client1')).toBe(false); // Should be blocked
    });

    it('should handle multiple clients separately', () => {
      const limiter = new RateLimiter(2, 60000);

      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client2')).toBe(true); // Different client
      expect(limiter.checkLimit('client2')).toBe(true); // Different client

      expect(limiter.checkLimit('client1')).toBe(false); // client1 blocked
      expect(limiter.checkLimit('client2')).toBe(false); // client2 blocked
    });

    it('should reset after time window', async () => {
      const limiter = new RateLimiter(1, 100); // 1 request per 100ms

      expect(limiter.checkLimit('client1')).toBe(true);
      expect(limiter.checkLimit('client1')).toBe(false);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(limiter.checkLimit('client1')).toBe(true);
    });
  });

  describe('Custom Error Classes', () => {
    it('should create ValidationError with correct name', () => {
      const error = new ValidationError('Validation failed');
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create NotFoundError with correct name', () => {
      const error = new NotFoundError('Not found');
      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('Not found');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create PermissionError with correct name', () => {
      const error = new PermissionError('Permission denied');
      expect(error.name).toBe('PermissionError');
      expect(error.message).toBe('Permission denied');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
