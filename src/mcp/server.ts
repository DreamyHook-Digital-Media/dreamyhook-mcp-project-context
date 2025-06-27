/**
 * Project Context MCP Server
 *
 * Main MCP server implementation that handles the Model Context Protocol
 * communication and provides project context to Claude Code.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createLogger, LogLevel } from '../utils/logger';
import { ServerConfig } from './config';
import {
  errorHandlingMiddleware,
  generateRequestId,
  MiddlewareContext,
  NotFoundError,
} from './middleware';
import { ProjectContextResources } from './resources';

export class ProjectContextMCPServer {
  private server: Server;
  private logger: ReturnType<typeof createLogger>;
  private config: ServerConfig;
  private resources: ProjectContextResources;
  private isRunning: boolean = false;

  constructor(config?: Partial<ServerConfig>) {
    this.logger = createLogger('ProjectContextMCPServer', LogLevel.DEBUG);
    this.config = new ServerConfig(config);
    this.resources = new ProjectContextResources(this.config);

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.config.serverName,
        version: this.config.serverVersion,
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      },
    );

    this.setupHandlers();
    this.logger.debug('MCP Server initialized');
  }

  /**
   * Set up MCP protocol handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('Received ListTools request');
      return {
        tools: [
          {
            name: 'health_check',
            description: 'Check server health and status',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const context: MiddlewareContext = {
        requestId: generateRequestId(),
        timestamp: new Date(),
        method: 'CallTool',
        params: request.params,
      };

      return errorHandlingMiddleware(async () => {
        this.logger.debug(
          `[${context.requestId}] Received CallTool request:`,
          request.params.name,
        );

        switch (request.params.name) {
          case 'health_check':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      status: 'healthy',
                      serverName: this.config.serverName,
                      version: this.config.serverVersion,
                      uptime: process.uptime(),
                      timestamp: new Date().toISOString(),
                      requestId: context.requestId,
                    },
                    null,
                    2,
                  ),
                },
              ],
            };

          default:
            throw new NotFoundError(`Unknown tool: ${request.params.name}`);
        }
      }, context);
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const context: MiddlewareContext = {
        requestId: generateRequestId(),
        timestamp: new Date(),
        method: 'ListResources',
      };

      return errorHandlingMiddleware(async () => {
        this.logger.debug(
          `[${context.requestId}] Received ListResources request`,
        );

        const projectResources = await this.resources.listResources();

        // Add server info resource
        const serverInfoResource = {
          uri: 'context://server/info',
          name: 'Server Information',
          description: 'Basic server information and configuration',
          mimeType: 'application/json',
        };

        return {
          resources: [serverInfoResource, ...projectResources],
        };
      }, context);
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
      const context: MiddlewareContext = {
        requestId: generateRequestId(),
        timestamp: new Date(),
        method: 'ReadResource',
        params: request.params,
      };

      return errorHandlingMiddleware(async () => {
        this.logger.debug(
          `[${context.requestId}] Received ReadResource request:`,
          request.params.uri,
        );

        // Handle server info resource
        if (request.params.uri === 'context://server/info') {
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(
                  {
                    serverName: this.config.serverName,
                    version: this.config.serverVersion,
                    capabilities: ['resources', 'tools', 'prompts'],
                    status: 'running',
                    startTime: this.config.startTime,
                    uptime: process.uptime(),
                    requestId: context.requestId,
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // Delegate to project resources
        return await this.resources.readResource(request.params.uri);
      }, context);
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      this.logger.debug('Received ListPrompts request');
      return {
        prompts: [
          {
            name: 'server_status',
            description: 'Get detailed server status and configuration',
            arguments: [],
          },
        ],
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async request => {
      this.logger.debug('Received GetPrompt request:', request.params.name);

      switch (request.params.name) {
        case 'server_status':
          return {
            description: 'Current server status and configuration',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Server Status Report:
- Name: ${this.config.serverName}
- Version: ${this.config.serverVersion}
- Status: ${this.isRunning ? 'Running' : 'Stopped'}
- Uptime: ${Math.floor(process.uptime())}s
- Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
- Node.js Version: ${process.version}
- Start Time: ${this.config.startTime}`,
                },
              },
            ],
          };

        default:
          throw new Error(`Unknown prompt: ${request.params.name}`);
      }
    });

    this.logger.debug('MCP protocol handlers configured');
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Server is already running');
      return;
    }

    try {
      this.logger.info('Starting MCP server...');

      // Create transport (stdio for MCP servers)
      const transport = new StdioServerTransport();

      // Connect server to transport
      await this.server.connect(transport);

      this.isRunning = true;
      this.logger.info(
        `MCP server started successfully on ${this.config.serverName} v${this.config.serverVersion}`,
      );
    } catch (error) {
      this.logger.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Server is not running');
      return;
    }

    try {
      this.logger.info('Stopping MCP server...');

      // Close server connection
      await this.server.close();

      this.isRunning = false;
      this.logger.info('MCP server stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping MCP server:', error);
      throw error;
    }
  }

  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    serverName: string;
    version: string;
    uptime: number;
    startTime: string;
  } {
    return {
      isRunning: this.isRunning,
      serverName: this.config.serverName,
      version: this.config.serverVersion,
      uptime: process.uptime(),
      startTime: this.config.startTime,
    };
  }
}
