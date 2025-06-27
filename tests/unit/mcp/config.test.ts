/**
 * Unit tests for MCP Server Configuration
 */

import { ServerConfig } from '../../../src/mcp/config';
import { createMockFile } from '../../helpers/test-helpers';

// Mock fs module
jest.mock('fs');

describe('ServerConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create config with default values', () => {
      createMockFile(
        'package.json',
        JSON.stringify({
          name: '@test/server',
          version: '1.0.0',
        }),
      );

      const config = new ServerConfig();

      expect(config.serverName).toBe('@test/server');
      expect(config.serverVersion).toBe('1.0.0');
      expect(config.logLevel).toBe('info');
      expect(config.projectPath).toBe(process.cwd());
      expect(config.cacheEnabled).toBe(true);
      expect(config.cacheTTL).toBe(300000);
      expect(config.startTime).toBeDefined();
    });

    it('should use provided options over defaults', () => {
      const options = {
        serverName: 'custom-server',
        serverVersion: '2.0.0',
        logLevel: 'debug',
        projectPath: '/custom/path',
        cacheEnabled: false,
        cacheTTL: 600000,
        startTime: '2024-01-01T00:00:00.000Z',
      };

      const config = new ServerConfig(options);

      expect(config.serverName).toBe('custom-server');
      expect(config.serverVersion).toBe('2.0.0');
      expect(config.logLevel).toBe('debug');
      expect(config.projectPath).toBe('/custom/path');
      expect(config.cacheEnabled).toBe(false);
      expect(config.cacheTTL).toBe(600000);
      expect(config.startTime).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should use fallback values when package.json cannot be read', () => {
      // Mock readFileSync to throw an error
      const fs = require('fs');
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const config = new ServerConfig();

      expect(config.serverName).toBe('@dreamyhook/project-context-mcp-server');
      expect(config.serverVersion).toBe('0.5.0');
    });

    it('should handle malformed package.json', () => {
      createMockFile('package.json', 'invalid json');

      const config = new ServerConfig();

      expect(config.serverName).toBe('@dreamyhook/project-context-mcp-server');
      expect(config.serverVersion).toBe('0.5.0');
    });
  });

  describe('toObject', () => {
    it('should return configuration as plain object', () => {
      const config = new ServerConfig({
        serverName: 'test-server',
        serverVersion: '1.0.0',
        logLevel: 'debug',
      });

      const obj = config.toObject();

      expect(obj).toEqual({
        serverName: 'test-server',
        serverVersion: '1.0.0',
        logLevel: 'debug',
        projectPath: process.cwd(),
        cacheEnabled: true,
        cacheTTL: 300000,
        startTime: expect.any(String),
      });
    });
  });

  describe('fromEnvironment', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should create config from environment variables', () => {
      process.env.LOG_LEVEL = 'error';
      process.env.PROJECT_PATH = '/env/path';
      process.env.CACHE_ENABLED = 'true';
      process.env.CACHE_TTL = '120000';

      const config = ServerConfig.fromEnvironment();

      expect(config.logLevel).toBe('error');
      expect(config.projectPath).toBe('/env/path');
      expect(config.cacheEnabled).toBe(true);
      expect(config.cacheTTL).toBe(120000);
    });

    it('should handle cache enabled as false', () => {
      process.env.CACHE_ENABLED = 'false';

      const config = ServerConfig.fromEnvironment();

      expect(config.cacheEnabled).toBe(false);
    });

    it('should handle invalid cache TTL', () => {
      process.env.CACHE_TTL = 'invalid';

      const config = ServerConfig.fromEnvironment();

      expect(config.cacheTTL).toBe(300000); // fallback to default
    });

    it('should use defaults when environment variables are not set', () => {
      // Clear relevant environment variables
      delete process.env.LOG_LEVEL;
      delete process.env.PROJECT_PATH;
      delete process.env.CACHE_ENABLED;
      delete process.env.CACHE_TTL;

      const config = ServerConfig.fromEnvironment();

      expect(config.logLevel).toBe('info');
      expect(config.projectPath).toBe(process.cwd());
      expect(config.cacheEnabled).toBe(true); // Default when not set
      expect(config.cacheTTL).toBe(300000);
    });
  });
});
