/**
 * MCP Server Configuration
 *
 * Configuration management for the Project Context MCP Server
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface ServerConfigOptions {
  serverName?: string;
  serverVersion?: string;
  logLevel?: string;
  projectPath?: string;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  startTime?: string;
}

export class ServerConfig {
  public readonly serverName: string;
  public readonly serverVersion: string;
  public readonly logLevel: string;
  public readonly projectPath: string;
  public readonly cacheEnabled: boolean;
  public readonly cacheTTL: number;
  public readonly startTime: string;

  constructor(options: ServerConfigOptions = {}) {
    // Load package.json for server info
    const packageJsonPath = join(__dirname, '../../package.json');
    let packageInfo: any = {};

    try {
      const packageJson = readFileSync(packageJsonPath, 'utf-8');
      packageInfo = JSON.parse(packageJson);
    } catch (error) {
      // Fallback values if package.json can't be read
      packageInfo = {
        name: '@dreamyhook/project-context-mcp-server',
        version: '0.5.0',
      };
    }

    // Set configuration values with defaults
    this.serverName =
      options.serverName || packageInfo.name || 'project-context-mcp-server';
    this.serverVersion =
      options.serverVersion || packageInfo.version || '0.0.0';
    this.logLevel = options.logLevel || process.env.LOG_LEVEL || 'info';
    this.projectPath = options.projectPath || process.cwd();
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheTTL = options.cacheTTL || 300000; // 5 minutes default
    this.startTime = options.startTime || new Date().toISOString();
  }

  /**
   * Get configuration as plain object
   */
  toObject(): Record<string, any> {
    return {
      serverName: this.serverName,
      serverVersion: this.serverVersion,
      logLevel: this.logLevel,
      projectPath: this.projectPath,
      cacheEnabled: this.cacheEnabled,
      cacheTTL: this.cacheTTL,
      startTime: this.startTime,
    };
  }

  /**
   * Create configuration from environment variables
   */
  static fromEnvironment(): ServerConfig {
    return new ServerConfig({
      logLevel: process.env.LOG_LEVEL,
      projectPath: process.env.PROJECT_PATH,
      cacheEnabled: process.env.CACHE_ENABLED === 'true',
      cacheTTL: process.env.CACHE_TTL
        ? parseInt(process.env.CACHE_TTL, 10)
        : undefined,
    });
  }
}
