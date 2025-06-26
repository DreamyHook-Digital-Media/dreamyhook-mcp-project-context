/**
 * Test helpers specific to MCP (Model Context Protocol) testing
 */

/**
 * Mock MCP server for testing
 */
export class MockMCPServer {
  private resources: Map<string, any> = new Map();
  private tools: Map<string, any> = new Map();
  private prompts: Map<string, any> = new Map();

  /**
   * Add a mock resource
   */
  addResource(uri: string, content: any): void {
    this.resources.set(uri, content);
  }

  /**
   * Add a mock tool
   */
  addTool(name: string, handler: Function): void {
    this.tools.set(name, handler);
  }

  /**
   * Add a mock prompt
   */
  addPrompt(name: string, template: string): void {
    this.prompts.set(name, template);
  }

  /**
   * Get all resources
   */
  getResources(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * Get resource content
   */
  getResource(uri: string): any {
    return this.resources.get(uri);
  }

  /**
   * Execute a tool
   */
  executeTool(name: string, args: any): any {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }
    return handler(args);
  }

  /**
   * Clear all mocks
   */
  clear(): void {
    this.resources.clear();
    this.tools.clear();
    this.prompts.clear();
  }
}

/**
 * Creates a mock MCP request object
 */
export function createMockMCPRequest(method: string, params: any = {}): any {
  return {
    jsonrpc: '2.0',
    id: Math.random().toString(36).substring(7),
    method,
    params,
  };
}

/**
 * Creates a mock MCP response object
 */
export function createMockMCPResponse(id: string, result: any): any {
  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

/**
 * Creates a mock MCP error response
 */
export function createMockMCPError(
  id: string,
  code: number,
  message: string,
): any {
  return {
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
    },
  };
}

/**
 * Validates MCP protocol compliance
 */
export function validateMCPMessage(message: any): void {
  expect(message).toHaveProperty('jsonrpc', '2.0');
  expect(message).toHaveProperty('id');

  if (message.error) {
    expect(message.error).toHaveProperty('code');
    expect(message.error).toHaveProperty('message');
    expect(typeof message.error.code).toBe('number');
    expect(typeof message.error.message).toBe('string');
  } else {
    expect(message).toHaveProperty('result');
  }
}

/**
 * Mock project context data for testing
 */
export function createMockProjectContext(): any {
  return {
    name: 'test-project',
    path: '/test/project/path',
    technologies: ['typescript', 'node.js'],
    dependencies: {
      production: ['express', 'lodash'],
      development: ['jest', 'typescript'],
    },
    structure: {
      'src/': {
        'index.ts': 'main entry point',
        'utils/': {
          'logger.ts': 'logging utility',
        },
      },
      'tests/': {
        'index.test.ts': 'test file',
      },
    },
    git: {
      branch: 'main',
      remoteUrl: 'https://github.com/test/repo.git',
      lastCommit: {
        hash: 'abc123',
        message: 'Test commit',
        author: 'Test Author',
        date: '2024-01-01T00:00:00Z',
      },
    },
  };
}
