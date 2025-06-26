/**
 * Unit tests for logger utility
 */

import { createLogger, LogLevel } from '../../../src/utils/logger';
import { createConsoleSpy } from '../../helpers/test-helpers';

describe('Logger', () => {
  let consoleSpy: ReturnType<typeof createConsoleSpy>;

  beforeEach(() => {
    consoleSpy = createConsoleSpy();
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  describe('createLogger', () => {
    it('should create a logger with the specified name', () => {
      const logger = createLogger('TestLogger');

      expect(logger).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should create a logger with the specified log level', () => {
      const logger = createLogger('TestLogger', LogLevel.ERROR);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // Only error should be logged when level is ERROR
      expect(consoleSpy.spies.debug).not.toHaveBeenCalled();
      expect(consoleSpy.spies.info).not.toHaveBeenCalled();
      expect(consoleSpy.spies.warn).not.toHaveBeenCalled();
      expect(consoleSpy.spies.error).toHaveBeenCalledWith(
        '[TestLogger] ERROR:',
        'error message',
      );
    });

    it('should log all levels when level is DEBUG', () => {
      const logger = createLogger('TestLogger', LogLevel.DEBUG);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.spies.debug).toHaveBeenCalledWith(
        '[TestLogger] DEBUG:',
        'debug message',
      );
      expect(consoleSpy.spies.info).toHaveBeenCalledWith(
        '[TestLogger] INFO:',
        'info message',
      );
      expect(consoleSpy.spies.warn).toHaveBeenCalledWith(
        '[TestLogger] WARN:',
        'warn message',
      );
      expect(consoleSpy.spies.error).toHaveBeenCalledWith(
        '[TestLogger] ERROR:',
        'error message',
      );
    });

    it('should format log messages with timestamp and component name', () => {
      const logger = createLogger('TestComponent', LogLevel.INFO);

      logger.info('test message');

      expect(consoleSpy.spies.info).toHaveBeenCalledWith(
        '[TestComponent] INFO:',
        'test message',
      );
    });

    it('should handle multiple arguments in log messages', () => {
      const logger = createLogger('TestLogger', LogLevel.INFO);

      logger.info('message with', 'multiple', 'arguments', { data: 'value' });

      expect(consoleSpy.spies.info).toHaveBeenCalledWith(
        '[TestLogger] INFO:',
        'message with',
        'multiple',
        'arguments',
        { data: 'value' },
      );
    });
  });

  describe('LogLevel', () => {
    it('should have correct log level hierarchy', () => {
      expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
      expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
      expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
    });

    it('should only log messages at or above the configured level', () => {
      const logger = createLogger('TestLogger', LogLevel.WARN);

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      expect(consoleSpy.spies.debug).not.toHaveBeenCalled();
      expect(consoleSpy.spies.info).not.toHaveBeenCalled();
      expect(consoleSpy.spies.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.spies.error).toHaveBeenCalledTimes(1);
    });
  });
});
