#!/usr/bin/env node

/**
 * Project Context MCP Server
 *
 * Main entry point for the MCP server that provides intelligent project context
 * to Claude Code through the Model Context Protocol.
 */

import { createLogger, LogLevel } from './utils/logger';
import { ProjectContextMCPServer } from './mcp/server';

const logger = createLogger('MCP-Server', LogLevel.DEBUG);

async function main() {
  try {
    logger.info('Project Context MCP Server - Starting...');

    // Initialize MCP server
    const server = new ProjectContextMCPServer();

    // Start the server
    await server.start();

    logger.info('MCP Server started successfully');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { ProjectContextMCPServer };
