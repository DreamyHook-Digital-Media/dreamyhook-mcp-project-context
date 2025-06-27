/**
 * Unit tests for MCP Server
 */

import { ProjectContextMCPServer } from '../../../src/mcp/server';
import { ServerConfig } from '../../../src/mcp/config';
import { createConsoleSpy } from '../../helpers/test-helpers';

// Mock the MCP SDK
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn(),
}));

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema',
  ListResourcesRequestSchema: 'ListResourcesRequestSchema',
  ReadResourceRequestSchema: 'ReadResourceRequestSchema',
  ListPromptsRequestSchema: 'ListPromptsRequestSchema',
  GetPromptRequestSchema: 'GetPromptRequestSchema',
}));

describe('ProjectContextMCPServer', () => {
  let consoleSpy: ReturnType<typeof createConsoleSpy>;
  let server: ProjectContextMCPServer;

  beforeEach(() => {
    consoleSpy = createConsoleSpy();
    jest.clearAllMocks();
    server = new ProjectContextMCPServer();
  });

  afterEach(() => {
    consoleSpy.restore();
  });

  describe('constructor', () => {
    it('should create server with default configuration', () => {
      expect(server).toBeDefined();
      expect(server.getStatus().serverName).toContain(
        'project-context-mcp-server',
      );
      expect(server.getStatus().isRunning).toBe(false);
    });

    it('should create server with custom configuration', () => {
      const customConfig = {
        serverName: 'test-server',
        serverVersion: '1.0.0',
      };

      const customServer = new ProjectContextMCPServer(customConfig);
      const status = customServer.getStatus();

      expect(status.serverName).toBe('test-server');
      expect(status.version).toBe('1.0.0');
    });
  });

  describe('getStatus', () => {
    it('should return correct server status', () => {
      const status = server.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('serverName');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('startTime');

      expect(typeof status.isRunning).toBe('boolean');
      expect(typeof status.serverName).toBe('string');
      expect(typeof status.version).toBe('string');
      expect(typeof status.uptime).toBe('number');
      expect(typeof status.startTime).toBe('string');
    });
  });

  describe('start and stop', () => {
    it('should handle start/stop lifecycle', async () => {
      // Test start
      await server.start();
      expect(server.getStatus().isRunning).toBe(true);

      // Test stop
      await server.stop();
      expect(server.getStatus().isRunning).toBe(false);
    });

    it('should handle start when already running', async () => {
      // Set server as running
      (server as any).isRunning = true;

      await server.start();

      // Should log warning about already running
      expect(consoleSpy.spies.warn).toHaveBeenCalledWith(
        '[ProjectContextMCPServer] WARN:',
        'Server is already running',
      );
    });

    it('should handle stop when not running', async () => {
      await server.stop();

      // Should log warning about not running
      expect(consoleSpy.spies.warn).toHaveBeenCalledWith(
        '[ProjectContextMCPServer] WARN:',
        'Server is not running',
      );
    });

    it('should handle start errors', async () => {
      const mockServer = (server as any).server;
      mockServer.connect.mockRejectedValueOnce(new Error('Connection failed'));

      await expect(server.start()).rejects.toThrow('Connection failed');
      expect(server.getStatus().isRunning).toBe(false);
    });

    it('should handle stop errors', async () => {
      const mockServer = (server as any).server;
      mockServer.close.mockRejectedValueOnce(new Error('Close failed'));
      (server as any).isRunning = true;

      await expect(server.stop()).rejects.toThrow('Close failed');
    });
  });
});
