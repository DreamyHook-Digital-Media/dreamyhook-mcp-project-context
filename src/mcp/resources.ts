/**
 * MCP Resource Interface Implementation
 *
 * Defines and implements all project context resources exposed through
 * the Model Context Protocol.
 */

import { promises as fs } from 'fs';
import { join, relative, extname } from 'path';
import { createLogger, LogLevel } from '../utils/logger';
import { ServerConfig } from './config';
import {
  errorHandlingMiddleware,
  generateRequestId,
  MiddlewareContext,
  NotFoundError,
} from './middleware';

// const logger = createLogger('MCPResources', LogLevel.DEBUG);

/**
 * Resource schema definitions
 */
export interface ResourceSchema {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  schema?: Record<string, unknown>;
}

export interface ProjectOverview {
  name: string;
  version: string;
  description: string;
  path: string;
  language: string;
  framework?: string;
  packageManager?: string;
  lastModified: string;
  fileCount: number;
  sizeInBytes: number;
  gitRepository?: string;
  gitBranch?: string;
  gitLastCommit?: string;
}

export interface ProjectStructure {
  path: string;
  type: 'file' | 'directory';
  name: string;
  extension?: string;
  size?: number;
  children?: ProjectStructure[];
  lastModified: string;
}

export interface ProjectDependencies {
  packageManager: string;
  dependencies: Dependency[];
  devDependencies: Dependency[];
  totalCount: number;
  outdatedCount?: number;
  vulnerabilityCount?: number;
  lockFileExists: boolean;
}

export interface Dependency {
  name: string;
  version: string;
  requestedVersion: string;
  type: 'production' | 'development' | 'optional' | 'peer';
  description?: string;
  homepage?: string;
  license?: string;
  outdated?: boolean;
  vulnerabilities?: SecurityVulnerability[];
}

export interface SecurityVulnerability {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
}

/**
 * Resource handler class
 */
export class ProjectContextResources {
  private config: ServerConfig;
  private logger: ReturnType<typeof createLogger>;

  constructor(config: ServerConfig) {
    this.config = config;
    this.logger = createLogger('ProjectContextResources', LogLevel.DEBUG);
  }

  /**
   * Get all available resources
   */
  async listResources(): Promise<ResourceSchema[]> {
    const context: MiddlewareContext = {
      requestId: generateRequestId(),
      timestamp: new Date(),
      method: 'listResources',
    };

    return errorHandlingMiddleware(async () => {
      this.logger.debug(`[${context.requestId}] Listing available resources`);

      const resources: ResourceSchema[] = [
        {
          uri: 'context://project/overview',
          name: 'Project Overview',
          description:
            'Comprehensive overview of the project including metadata, statistics, and Git information',
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              path: { type: 'string' },
              language: { type: 'string' },
              framework: { type: 'string' },
              packageManager: { type: 'string' },
              lastModified: { type: 'string' },
              fileCount: { type: 'number' },
              sizeInBytes: { type: 'number' },
              gitRepository: { type: 'string' },
              gitBranch: { type: 'string' },
              gitLastCommit: { type: 'string' },
            },
          },
        },
        {
          uri: 'context://project/structure',
          name: 'Project Structure',
          description: 'Complete file and directory structure of the project',
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              type: { type: 'string', enum: ['file', 'directory'] },
              name: { type: 'string' },
              extension: { type: 'string' },
              size: { type: 'number' },
              children: { type: 'array' },
              lastModified: { type: 'string' },
            },
          },
        },
        {
          uri: 'context://project/dependencies',
          name: 'Project Dependencies',
          description:
            'Analysis of project dependencies including versions, security, and outdated packages',
          mimeType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              packageManager: { type: 'string' },
              dependencies: { type: 'array' },
              devDependencies: { type: 'array' },
              totalCount: { type: 'number' },
              outdatedCount: { type: 'number' },
              vulnerabilityCount: { type: 'number' },
              lockFileExists: { type: 'boolean' },
            },
          },
        },
        {
          uri: 'context://file/{path}',
          name: 'File Content',
          description:
            'Content of a specific file in the project (use context://file/path/to/file.ext)',
          mimeType: 'text/plain',
          schema: {
            type: 'string',
          },
        },
      ];

      this.logger.debug(
        `[${context.requestId}] Found ${resources.length} available resources`,
      );
      return resources;
    }, context);
  }

  /**
   * Read a specific resource
   */
  async readResource(
    uri: string,
  ): Promise<{
    contents: Array<{ uri: string; mimeType: string; text: string }>;
  }> {
    const context: MiddlewareContext = {
      requestId: generateRequestId(),
      timestamp: new Date(),
      method: 'readResource',
      params: { uri },
    };

    return errorHandlingMiddleware(async () => {
      this.logger.debug(`[${context.requestId}] Reading resource: ${uri}`);

      if (uri === 'context://project/overview') {
        const overview = await this.getProjectOverview(context);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(overview, null, 2),
            },
          ],
        };
      }

      if (uri === 'context://project/structure') {
        const structure = await this.getProjectStructure(context);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(structure, null, 2),
            },
          ],
        };
      }

      if (uri === 'context://project/dependencies') {
        const dependencies = await this.getProjectDependencies(context);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(dependencies, null, 2),
            },
          ],
        };
      }

      if (uri.startsWith('context://file/')) {
        const filePath = uri.replace('context://file/', '');
        const content = await this.getFileContent(filePath, context);
        return {
          contents: [
            {
              uri,
              mimeType: this.getMimeTypeForFile(filePath),
              text: content,
            },
          ],
        };
      }

      throw new NotFoundError(`Resource not found: ${uri}`);
    }, context);
  }

  /**
   * Get project overview information
   */
  private async getProjectOverview(
    context: MiddlewareContext,
  ): Promise<ProjectOverview> {
    const projectPath = this.config.projectPath;
    this.logger.debug(
      `[${context.requestId}] Analyzing project at: ${projectPath}`,
    );

    // Read package.json for basic info
    let packageInfo: Record<string, unknown> = {};
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
      packageInfo = JSON.parse(packageJson);
    } catch (error) {
      this.logger.debug(
        `[${context.requestId}] No package.json found or invalid format`,
      );
    }

    // Get project statistics
    const stats = await this.getProjectStats(projectPath);

    // Get Git information
    const gitInfo = await this.getGitInfo(projectPath);

    const overview: ProjectOverview = {
      name:
        packageInfo.name || projectPath.split('/').pop() || 'Unknown Project',
      version: packageInfo.version || '0.0.0',
      description: packageInfo.description || 'No description available',
      path: projectPath,
      language: await this.detectPrimaryLanguage(projectPath),
      framework: await this.detectFramework(packageInfo),
      packageManager: await this.detectPackageManager(projectPath),
      lastModified: stats.lastModified,
      fileCount: stats.fileCount,
      sizeInBytes: stats.sizeInBytes,
      ...gitInfo,
    };

    this.logger.debug(
      `[${context.requestId}] Project overview generated successfully`,
    );
    return overview;
  }

  /**
   * Get project structure as a tree
   */
  private async getProjectStructure(
    context: MiddlewareContext,
  ): Promise<ProjectStructure> {
    const projectPath = this.config.projectPath;
    this.logger.debug(
      `[${context.requestId}] Building project structure for: ${projectPath}`,
    );

    const structure = await this.buildFileTree(
      projectPath,
      projectPath,
      context,
    );

    this.logger.debug(
      `[${context.requestId}] Project structure built successfully`,
    );
    return structure;
  }

  /**
   * Get project dependencies analysis
   */
  private async getProjectDependencies(
    context: MiddlewareContext,
  ): Promise<ProjectDependencies> {
    const projectPath = this.config.projectPath;
    this.logger.debug(`[${context.requestId}] Analyzing project dependencies`);

    const packageManager = await this.detectPackageManager(projectPath);

    if (packageManager === 'npm') {
      return await this.analyzeNpmDependencies(projectPath, context);
    }

    // For other package managers, return basic structure
    return {
      packageManager,
      dependencies: [],
      devDependencies: [],
      totalCount: 0,
      lockFileExists: false,
    };
  }

  /**
   * Get file content with proper encoding detection
   */
  private async getFileContent(
    filePath: string,
    context: MiddlewareContext,
  ): Promise<string> {
    const fullPath = join(this.config.projectPath, filePath);

    try {
      // Check if file exists and is readable
      await fs.access(fullPath);
      const stats = await fs.stat(fullPath);

      if (stats.isDirectory()) {
        throw new Error('Cannot read directory as file');
      }

      // Check file size (limit to 1MB for safety)
      if (stats.size > 1024 * 1024) {
        throw new Error('File too large to read (>1MB)');
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      this.logger.debug(
        `[${context.requestId}] File content read: ${filePath} (${stats.size} bytes)`,
      );

      return content;
    } catch (error) {
      this.logger.error(
        `[${context.requestId}] Failed to read file: ${filePath}`,
        error,
      );
      throw new NotFoundError(`Cannot read file: ${filePath}`);
    }
  }

  // Helper methods implementation continues...

  private async getProjectStats(
    projectPath: string,
  ): Promise<{ fileCount: number; sizeInBytes: number; lastModified: string }> {
    // Implementation for project statistics
    let fileCount = 0;
    let sizeInBytes = 0;
    let lastModified = new Date(0);

    const countFiles = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.startsWith('.') && !entry.name.startsWith('.git')) {
            continue; // Skip hidden files except .git
          }

          const fullPath = join(dir, entry.name);

          if (entry.isDirectory()) {
            if (
              !['node_modules', 'dist', 'build', 'coverage'].includes(
                entry.name,
              )
            ) {
              await countFiles(fullPath);
            }
          } else {
            fileCount++;
            const stats = await fs.stat(fullPath);
            sizeInBytes += stats.size;
            if (stats.mtime > lastModified) {
              lastModified = stats.mtime;
            }
          }
        }
      } catch (_error) {
        // Ignore read errors for directories we can't access
      }
    };

    await countFiles(projectPath);

    return {
      fileCount,
      sizeInBytes,
      lastModified: lastModified.toISOString(),
    };
  }

  private async detectPrimaryLanguage(projectPath: string): Promise<string> {
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.js': 'JavaScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.go': 'Go',
      '.rs': 'Rust',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.cs': 'C#',
    };

    const extensionCounts: Record<string, number> = {};

    const countExtensions = async (dir: string): Promise<void> => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.name.startsWith('.')) continue;

          const fullPath = join(dir, entry.name);

          if (
            entry.isDirectory() &&
            !['node_modules', 'dist', 'build'].includes(entry.name)
          ) {
            await countExtensions(fullPath);
          } else if (entry.isFile()) {
            const ext = extname(entry.name);
            if (languageMap[ext]) {
              extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
            }
          }
        }
      } catch (_error) {
        // Ignore read errors
      }
    };

    await countExtensions(projectPath);

    const primaryExtension = Object.entries(extensionCounts).sort(
      ([, a], [, b]) => b - a,
    )[0]?.[0];

    return primaryExtension ? languageMap[primaryExtension] : 'Unknown';
  }

  private async detectFramework(
    packageInfo: Record<string, unknown>,
  ): Promise<string | undefined> {
    const dependencies = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies,
    };

    if (dependencies.react) return 'React';
    if (dependencies.vue) return 'Vue.js';
    if (dependencies.angular) return 'Angular';
    if (dependencies.svelte) return 'Svelte';
    if (dependencies.express) return 'Express.js';
    if (dependencies.fastify) return 'Fastify';
    if (dependencies.nest || dependencies['@nestjs/core']) return 'NestJS';
    if (dependencies.next) return 'Next.js';
    if (dependencies.nuxt) return 'Nuxt.js';

    return undefined;
  }

  private async detectPackageManager(projectPath: string): Promise<string> {
    try {
      const files = await fs.readdir(projectPath);

      if (files.includes('package-lock.json')) return 'npm';
      if (files.includes('yarn.lock')) return 'yarn';
      if (files.includes('pnpm-lock.yaml')) return 'pnpm';
      if (files.includes('Cargo.toml')) return 'cargo';
      if (files.includes('requirements.txt') || files.includes('Pipfile'))
        return 'pip';
      if (files.includes('go.mod')) return 'go mod';
      if (files.includes('Gemfile')) return 'bundler';
      if (files.includes('composer.json')) return 'composer';

      return 'unknown';
    } catch (_error) {
      return 'unknown';
    }
  }

  private async getGitInfo(
    projectPath: string,
  ): Promise<Record<string, string>> {
    // Basic Git info - could be enhanced with simple-git
    const gitInfo: Record<string, string> = {};

    try {
      // Check if .git directory exists
      await fs.access(join(projectPath, '.git'));
      gitInfo.gitRepository = 'Local Git Repository';

      // Try to read basic Git info (simplified)
      try {
        const headContent = await fs.readFile(
          join(projectPath, '.git', 'HEAD'),
          'utf-8',
        );
        const match = headContent.match(/ref: refs\/heads\/(.+)/);
        if (match) {
          gitInfo.gitBranch = match[1].trim();
        }
      } catch (_error) {
        // Ignore errors reading Git info
      }
    } catch (_error) {
      // No Git repository
    }

    return gitInfo;
  }

  private async buildFileTree(
    currentPath: string,
    basePath: string,
    context: MiddlewareContext,
  ): Promise<ProjectStructure> {
    const stats = await fs.stat(currentPath);
    const relativePath = relative(basePath, currentPath);
    const name = relativePath || currentPath.split('/').pop() || '';

    const node: ProjectStructure = {
      path: relativePath,
      type: stats.isDirectory() ? 'directory' : 'file',
      name,
      lastModified: stats.mtime.toISOString(),
    };

    if (stats.isFile()) {
      node.extension = extname(name);
      node.size = stats.size;
    } else if (stats.isDirectory()) {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        node.children = [];

        for (const entry of entries) {
          // Skip certain directories and hidden files
          if (entry.name.startsWith('.') && !entry.name.startsWith('.git'))
            continue;
          if (
            ['node_modules', 'dist', 'build', 'coverage'].includes(entry.name)
          )
            continue;

          const childPath = join(currentPath, entry.name);
          const child = await this.buildFileTree(childPath, basePath, context);
          node.children.push(child);
        }

        // Sort children: directories first, then files
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      } catch (_error) {
        this.logger.debug(
          `[${context.requestId}] Error reading directory: ${currentPath}`,
        );
      }
    }

    return node;
  }

  private async analyzeNpmDependencies(
    projectPath: string,
    context: MiddlewareContext,
  ): Promise<ProjectDependencies> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf-8'),
      );

      const dependencies: Dependency[] = [];
      const devDependencies: Dependency[] = [];

      // Process production dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(
          packageJson.dependencies,
        )) {
          dependencies.push({
            name,
            version: version as string,
            requestedVersion: version as string,
            type: 'production',
          });
        }
      }

      // Process dev dependencies
      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(
          packageJson.devDependencies,
        )) {
          devDependencies.push({
            name,
            version: version as string,
            requestedVersion: version as string,
            type: 'development',
          });
        }
      }

      // Check for lock file
      const lockFileExists = await fs
        .access(join(projectPath, 'package-lock.json'))
        .then(() => true)
        .catch(() => false);

      return {
        packageManager: 'npm',
        dependencies,
        devDependencies,
        totalCount: dependencies.length + devDependencies.length,
        lockFileExists,
      };
    } catch (error) {
      this.logger.error(
        `[${context.requestId}] Error analyzing npm dependencies:`,
        error,
      );
      return {
        packageManager: 'npm',
        dependencies: [],
        devDependencies: [],
        totalCount: 0,
        lockFileExists: false,
      };
    }
  }

  private getMimeTypeForFile(filePath: string): string {
    const ext = extname(filePath).toLowerCase();

    const mimeTypes: Record<string, string> = {
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.ts': 'text/typescript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.xml': 'application/xml',
      '.yaml': 'application/yaml',
      '.yml': 'application/yaml',
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.php': 'text/x-php',
      '.rb': 'text/x-ruby',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.cs': 'text/x-csharp',
    };

    return mimeTypes[ext] || 'text/plain';
  }
}
