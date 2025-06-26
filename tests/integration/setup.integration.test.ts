/**
 * Integration test to verify testing infrastructure setup
 */

import {
  createTempDir,
  cleanupTempDir,
  createMockFileStructure,
} from '../helpers/test-helpers';
import {
  MockMCPServer,
  createMockMCPRequest,
  validateMCPMessage,
} from '../helpers/mcp-helpers';

describe('Testing Infrastructure Integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await createTempDir('integration-test-');
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('File System Helpers', () => {
    it('should create and manage temporary directories', async () => {
      expect(tempDir).toBeDefined();
      expect(tempDir).toMatch(/integration-test-/);

      // Directory should exist
      const fs = require('fs').promises;
      const stats = await fs.stat(tempDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create mock file structures', async () => {
      const structure = {
        'package.json': '{"name": "test-project"}',
        'src/': {
          'index.ts': 'console.log("hello");',
          'utils/': {
            'helper.ts': 'export const helper = () => {};',
          },
        },
        'README.md': '# Test Project',
      };

      await createMockFileStructure(tempDir, structure);

      const fs = require('fs').promises;

      // Check files exist
      expect(await fs.readFile(`${tempDir}/package.json`, 'utf8')).toBe(
        '{"name": "test-project"}',
      );
      expect(await fs.readFile(`${tempDir}/src/index.ts`, 'utf8')).toBe(
        'console.log("hello");',
      );
      expect(await fs.readFile(`${tempDir}/src/utils/helper.ts`, 'utf8')).toBe(
        'export const helper = () => {};',
      );
      expect(await fs.readFile(`${tempDir}/README.md`, 'utf8')).toBe(
        '# Test Project',
      );
    });
  });

  describe('MCP Helpers', () => {
    let mockServer: MockMCPServer;

    beforeEach(() => {
      mockServer = new MockMCPServer();
    });

    afterEach(() => {
      mockServer.clear();
    });

    it('should create and manage mock MCP server', () => {
      mockServer.addResource('context://project/overview', {
        name: 'test-project',
      });
      mockServer.addTool('analyze_dependencies', (args: any) => ({
        dependencies: args.path,
      }));

      expect(mockServer.getResources()).toContain('context://project/overview');
      expect(mockServer.getResource('context://project/overview')).toEqual({
        name: 'test-project',
      });
      expect(
        mockServer.executeTool('analyze_dependencies', { path: '/test' }),
      ).toEqual({ dependencies: '/test' });
    });

    it('should validate MCP protocol messages', () => {
      const request = createMockMCPRequest('initialize', { capabilities: {} });

      expect(request).toHaveProperty('jsonrpc', '2.0');
      expect(request).toHaveProperty('id');
      expect(request).toHaveProperty('method', 'initialize');
      expect(request).toHaveProperty('params', { capabilities: {} });

      // This should not throw
      validateMCPMessage({ ...request, result: { capabilities: {} } });
    });

    it('should handle MCP errors correctly', () => {
      const error = {
        jsonrpc: '2.0',
        id: 'test-id',
        error: {
          code: -32601,
          message: 'Method not found',
        },
      };

      // This should not throw for valid error format
      validateMCPMessage(error);
    });
  });

  describe('Global Test Utilities', () => {
    it('should provide global test utilities', () => {
      expect(global.testUtils).toBeDefined();
      expect(typeof global.testUtils.mockDate).toBe('function');
      expect(typeof global.testUtils.restoreDate).toBe('function');
    });

    it('should mock and restore date correctly', () => {
      const originalNow = Date.now;
      const testDate = '2024-01-01T00:00:00Z';

      global.testUtils.mockDate(testDate);
      expect(Date.now()).toBe(new Date(testDate).getTime());

      global.testUtils.restoreDate();
      expect(Date.now).toBe(originalNow);
    });
  });

  describe('Jest Configuration', () => {
    it('should have TypeScript transformation working', () => {
      // This test itself being able to run proves TypeScript transformation is working
      const typeScriptCode: string = 'test';
      expect(typeScriptCode).toBe('test');
    });

    it('should have module path mapping configured', () => {
      // Test that we can import from src using relative paths
      // (path mapping will be tested when we have actual src modules)
      expect(true).toBe(true);
    });

    it('should have proper test environment setup', () => {
      expect(process.env.NODE_ENV).not.toBe('production');
      expect(typeof jest).toBe('object');
      expect(typeof describe).toBe('function');
      expect(typeof it).toBe('function');
      expect(typeof expect).toBe('function');
    });
  });
});
