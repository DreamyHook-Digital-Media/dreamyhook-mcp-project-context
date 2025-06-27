/**
 * MCP Server Middleware
 *
 * Middleware functions for request/response processing, error handling,
 * and logging in the MCP server.
 */

import { createLogger, LogLevel } from '../utils/logger';

const logger = createLogger('MCPMiddleware', LogLevel.DEBUG);

export interface MiddlewareContext {
  requestId: string;
  timestamp: Date;
  method: string;
  params?: any;
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(
  context: MiddlewareContext,
  next: () => Promise<any>,
): Promise<any> {
  const startTime = Date.now();

  logger.debug(`[${context.requestId}] ${context.method} - Started`, {
    timestamp: context.timestamp,
    params: context.params,
  });

  return next()
    .then(result => {
      const duration = Date.now() - startTime;
      logger.debug(
        `[${context.requestId}] ${context.method} - Completed (${duration}ms)`,
      );
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      logger.error(
        `[${context.requestId}] ${context.method} - Failed (${duration}ms):`,
        error,
      );
      throw error;
    });
}

/**
 * Error handling middleware
 */
export function errorHandlingMiddleware<T>(
  operation: () => Promise<T>,
  context: MiddlewareContext,
): Promise<T> {
  return operation().catch(error => {
    // Log the error with context
    logger.error(`Error in ${context.method}:`, {
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
      timestamp: context.timestamp,
    });

    // Transform known errors into MCP-compatible errors
    if (error.name === 'ValidationError') {
      throw new Error(`Invalid request: ${error.message}`);
    }

    if (error.name === 'NotFoundError') {
      throw new Error(`Resource not found: ${error.message}`);
    }

    if (error.name === 'PermissionError') {
      throw new Error(`Permission denied: ${error.message}`);
    }

    // For unknown errors, provide a generic message
    throw new Error('Internal server error');
  });
}

/**
 * Validation middleware
 */
export function validationMiddleware(
  schema: any,
  data: any,
  context: MiddlewareContext,
): void {
  try {
    // Basic validation for required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          throw new ValidationError(`Missing required field: ${field}`);
        }
      }
    }

    // Type validation
    if (schema.properties) {
      for (const [key, value] of Object.entries(data)) {
        const fieldSchema = schema.properties[key];
        if (fieldSchema && fieldSchema.type) {
          const actualType = typeof value;
          const expectedType = fieldSchema.type;

          if (actualType !== expectedType) {
            throw new ValidationError(
              `Invalid type for field ${key}: expected ${expectedType}, got ${actualType}`,
            );
          }
        }
      }
    }
  } catch (error) {
    logger.error(`Validation failed for ${context.method}:`, {
      requestId: context.requestId,
      error: error.message,
      data,
      schema,
    });
    throw error;
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkLimit(clientId: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests.get(clientId) || [];

    // Remove old requests outside the window
    const validRequests = clientRequests.filter(
      timestamp => now - timestamp < this.windowMs,
    );

    if (validRequests.length >= this.maxRequests) {
      logger.warn(`Rate limit exceeded for client ${clientId}`);
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(clientId, validRequests);

    return true;
  }
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
