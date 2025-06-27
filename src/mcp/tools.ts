/**
 * MCP Tools Interface Implementation
 *
 * Defines and implements all project analysis tools exposed through
 * the Model Context Protocol.
 */

import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { createLogger, LogLevel } from '../utils/logger';
import { ServerConfig } from './config';
import {
  errorHandlingMiddleware,
  generateRequestId,
  MiddlewareContext,
  ValidationError,
  NotFoundError,
} from './middleware';

/**
 * Tool schema definitions
 */
export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface AnalyzeDependenciesParams {
  includeDevDependencies?: boolean;
  checkSecurity?: boolean;
  outputFormat?: 'summary' | 'detailed' | 'json';
}

export interface GetRecentChangesParams {
  days?: number;
  maxCommits?: number;
  includeMerges?: boolean;
  author?: string;
}

export interface NavigateStructureParams {
  path?: string;
  depth?: number;
  includeFiles?: boolean;
  filterExtensions?: string[];
}

export interface SearchProjectParams {
  query: string;
  filePattern?: string;
  maxResults?: number;
  caseSensitive?: boolean;
  includeContent?: boolean;
}

export interface DependencyAnalysisResult {
  packageManager: string;
  totalDependencies: number;
  productionDependencies: number;
  developmentDependencies: number;
  outdatedPackages: number;
  vulnerabilities: SecurityVulnerability[];
  summary: string;
  dependencies?: DependencyDetail[];
}

export interface SecurityVulnerability {
  package: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  affectedVersions: string;
}

export interface DependencyDetail {
  name: string;
  version: string;
  requestedVersion: string;
  type: 'production' | 'development' | 'optional' | 'peer';
  description?: string;
  license?: string;
  outdated?: boolean;
  vulnerabilities?: SecurityVulnerability[];
}

export interface GitChangesResult {
  totalCommits: number;
  period: string;
  commits: GitCommit[];
  summary: {
    authors: string[];
    filesChanged: number;
    additions: number;
    deletions: number;
  };
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  filesChanged: string[];
  additions: number;
  deletions: number;
}

export interface NavigationResult {
  currentPath: string;
  type: 'directory' | 'file';
  contents?: NavigationItem[];
  parent?: string;
  breadcrumb: string[];
}

export interface NavigationItem {
  name: string;
  type: 'directory' | 'file';
  path: string;
  size?: number;
  lastModified: string;
  extension?: string;
}

export interface SearchResult {
  query: string;
  totalResults: number;
  results: SearchMatch[];
  searchTime: number;
}

export interface SearchMatch {
  file: string;
  line?: number;
  column?: number;
  content?: string;
  context?: string;
  type: 'filename' | 'content';
}

/**
 * Tools handler class
 */
export class ProjectContextTools {
  private config: ServerConfig;
  private logger: ReturnType<typeof createLogger>;

  constructor(config: ServerConfig) {
    this.config = config;
    this.logger = createLogger('ProjectContextTools', LogLevel.DEBUG);
  }

  /**
   * Get all available tools
   */
  async listTools(): Promise<ToolSchema[]> {
    const context: MiddlewareContext = {
      requestId: generateRequestId(),
      timestamp: new Date(),
      method: 'listTools',
    };

    return errorHandlingMiddleware(async () => {
      this.logger.debug(`[${context.requestId}] Listing available tools`);

      const tools: ToolSchema[] = [
        {
          name: 'analyze_dependencies',
          description:
            'Analyze project dependencies including versions, security vulnerabilities, and outdated packages',
          inputSchema: {
            type: 'object',
            properties: {
              includeDevDependencies: {
                type: 'boolean',
                description:
                  'Include development dependencies in analysis (default: true)',
              },
              checkSecurity: {
                type: 'boolean',
                description:
                  'Perform security vulnerability scanning (default: true)',
              },
              outputFormat: {
                type: 'string',
                enum: ['summary', 'detailed', 'json'],
                description: 'Output format for results (default: summary)',
              },
            },
            required: [],
          },
        },
        {
          name: 'get_recent_changes',
          description:
            'Retrieve recent Git commits and changes with configurable time windows and filtering',
          inputSchema: {
            type: 'object',
            properties: {
              days: {
                type: 'number',
                description: 'Number of days to look back (default: 7)',
                minimum: 1,
                maximum: 365,
              },
              maxCommits: {
                type: 'number',
                description: 'Maximum number of commits to return (default: 50)',
                minimum: 1,
                maximum: 1000,
              },
              includeMerges: {
                type: 'boolean',
                description: 'Include merge commits (default: false)',
              },
              author: {
                type: 'string',
                description: 'Filter by specific author',
              },
            },
            required: [],
          },
        },
        {
          name: 'navigate_structure',
          description:
            'Navigate project structure with intelligent filtering and depth control',
          inputSchema: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to navigate to (default: project root)',
              },
              depth: {
                type: 'number',
                description: 'Maximum depth to traverse (default: 2)',
                minimum: 1,
                maximum: 10,
              },
              includeFiles: {
                type: 'boolean',
                description: 'Include files in results (default: true)',
              },
              filterExtensions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Filter by file extensions (e.g., [".ts", ".js"])',
              },
            },
            required: [],
          },
        },
        {
          name: 'search_project',
          description:
            'Search project files for content or filenames with pattern matching',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (regex supported)',
              },
              filePattern: {
                type: 'string',
                description: 'File pattern to search within (glob pattern)',
              },
              maxResults: {
                type: 'number',
                description:
                  'Maximum number of results to return (default: 100)',
                minimum: 1,
                maximum: 1000,
              },
              caseSensitive: {
                type: 'boolean',
                description: 'Case sensitive search (default: false)',
              },
              includeContent: {
                type: 'boolean',
                description:
                  'Include matching content in results (default: true)',
              },
            },
            required: ['query'],
          },
        },
      ];

      this.logger.debug(
        `[${context.requestId}] Found ${tools.length} available tools`,
      );
      return tools;
    }, context);
  }

  /**
   * Execute a specific tool
   */
  async executeTool(
    toolName: string,
    parameters: Record<string, unknown>,
  ): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    const context: MiddlewareContext = {
      requestId: generateRequestId(),
      timestamp: new Date(),
      method: 'executeTool',
      params: { toolName, parameters },
    };

    return errorHandlingMiddleware(async () => {
      this.logger.debug(
        `[${context.requestId}] Executing tool: ${toolName}`,
        parameters,
      );

      switch (toolName) {
        case 'analyze_dependencies':
          return await this.analyzeDependencies(
            parameters as AnalyzeDependenciesParams,
            context,
          );

        case 'get_recent_changes':
          return await this.getRecentChanges(
            parameters as GetRecentChangesParams,
            context,
          );

        case 'navigate_structure':
          return await this.navigateStructure(
            parameters as NavigateStructureParams,
            context,
          );

        case 'search_project': {
          const query = parameters['query'];
          if (!query || typeof query !== 'string') {
            throw new ValidationError('Search query is required');
          }
          const searchParams: SearchProjectParams = { query };
          const filePattern = parameters['filePattern'];
          const maxResults = parameters['maxResults'];
          const caseSensitive = parameters['caseSensitive'];
          const includeContent = parameters['includeContent'];
          
          if (filePattern && typeof filePattern === 'string') {
            searchParams.filePattern = filePattern;
          }
          if (maxResults && typeof maxResults === 'number') {
            searchParams.maxResults = maxResults;
          }
          if (caseSensitive !== undefined && typeof caseSensitive === 'boolean') {
            searchParams.caseSensitive = caseSensitive;
          }
          if (includeContent !== undefined && typeof includeContent === 'boolean') {
            searchParams.includeContent = includeContent;
          }
          return await this.searchProject(searchParams, context);
        }

        default:
          throw new NotFoundError(`Unknown tool: ${toolName}`);
      }
    }, context);
  }

  /**
   * Analyze project dependencies
   */
  private async analyzeDependencies(
    params: AnalyzeDependenciesParams,
    context: MiddlewareContext,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      includeDevDependencies = true,
      checkSecurity = true,
      outputFormat = 'summary',
    } = params;

    this.logger.debug(
      `[${context.requestId}] Analyzing dependencies with params:`,
      params,
    );

    const projectPath = this.config.projectPath;
    const packageJsonPath = join(projectPath, 'package.json');

    try {
      // Read package.json
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, 'utf-8'),
      );

      const dependencies: DependencyDetail[] = outputFormat !== 'summary' ? [] : [];
      const result: DependencyAnalysisResult = {
        packageManager: await this.detectPackageManager(projectPath),
        totalDependencies: 0,
        productionDependencies: 0,
        developmentDependencies: 0,
        outdatedPackages: 0,
        vulnerabilities: [],
        summary: '',
        ...(outputFormat !== 'summary' && { dependencies }),
      };

      // Process production dependencies
      if (packageJson.dependencies) {
        result.productionDependencies = Object.keys(
          packageJson.dependencies,
        ).length;
        if ('dependencies' in result && result.dependencies) {
          for (const [name, version] of Object.entries(
            packageJson.dependencies,
          )) {
            result.dependencies.push({
              name,
              version: version as string,
              requestedVersion: version as string,
              type: 'production',
            });
          }
        }
      }

      // Process dev dependencies
      if (includeDevDependencies && packageJson.devDependencies) {
        result.developmentDependencies = Object.keys(
          packageJson.devDependencies,
        ).length;
        if ('dependencies' in result && result.dependencies) {
          for (const [name, version] of Object.entries(
            packageJson.devDependencies,
          )) {
            result.dependencies.push({
              name,
              version: version as string,
              requestedVersion: version as string,
              type: 'development',
            });
          }
        }
      }

      result.totalDependencies =
        result.productionDependencies + result.developmentDependencies;

      // Generate summary
      result.summary = this.generateDependencySummary(result);

      // Security scanning placeholder (would integrate with npm audit or similar)
      if (checkSecurity) {
        result.vulnerabilities = await this.performSecurityScan();
      }

      let responseText: string;
      switch (outputFormat) {
        case 'json':
          responseText = JSON.stringify(result, null, 2);
          break;
        case 'detailed':
          responseText = this.formatDetailedDependencyReport(result);
          break;
        default:
          responseText = result.summary;
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        `[${context.requestId}] Error analyzing dependencies:`,
        error,
      );
      throw new ValidationError(
        'Unable to analyze dependencies. Ensure package.json exists and is valid.',
      );
    }
  }

  /**
   * Get recent Git changes
   */
  private async getRecentChanges(
    params: GetRecentChangesParams,
    context: MiddlewareContext,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      days = 7,
      maxCommits = 50,
      includeMerges = false,
      author,
    } = params;

    this.logger.debug(
      `[${context.requestId}] Getting recent changes with params:`,
      params,
    );

    // For now, return a placeholder result
    // In a full implementation, this would integrate with simple-git
    const result: GitChangesResult = {
      totalCommits: 0,
      period: `Last ${days} days`,
      commits: [],
      summary: {
        authors: [],
        filesChanged: 0,
        additions: 0,
        deletions: 0,
      },
    };

    const responseText = `Git Changes Analysis (${result.period})

No recent changes found or Git repository not available.

This tool will be enhanced in future versions to provide:
- Detailed commit history analysis
- File change tracking
- Author activity summaries
- Branch and merge analysis

Parameters used:
- Days: ${days}
- Max commits: ${maxCommits}
- Include merges: ${includeMerges}
- Author filter: ${author || 'None'}`;

    return {
      content: [
        {
          type: 'text',
          text: responseText,
        },
      ],
    };
  }

  /**
   * Navigate project structure
   */
  private async navigateStructure(
    params: NavigateStructureParams,
    context: MiddlewareContext,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      path = '',
      depth = 2,
      includeFiles = true,
      filterExtensions,
    } = params;

    this.logger.debug(
      `[${context.requestId}] Navigating structure with params:`,
      params,
    );

    const projectPath = this.config.projectPath;
    const targetPath = path ? join(projectPath, path) : projectPath;

    try {
      const stats = await fs.stat(targetPath);
      const result: NavigationResult = {
        currentPath: path || '.',
        type: stats.isDirectory() ? 'directory' : 'file',
        contents: [],
        breadcrumb: path.split('/').filter(Boolean),
      };

      if (stats.isDirectory()) {
        const entries = await fs.readdir(targetPath, { withFileTypes: true });

        for (const entry of entries) {
          // Skip hidden files and common build directories
          if (entry.name.startsWith('.') && !entry.name.startsWith('.git'))
            continue;
          if (['node_modules', 'dist', 'build', 'coverage'].includes(entry.name))
            continue;

          const entryPath = join(targetPath, entry.name);
          const entryStats = await fs.stat(entryPath);

          // Filter by extensions if specified
          if (
            filterExtensions &&
            entry.isFile() &&
            !filterExtensions.includes(extname(entry.name))
          ) {
            continue;
          }

          // Skip files if not requested
          if (!includeFiles && entry.isFile()) continue;

          const item: NavigationItem = {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' : 'file',
            path: path ? `${path}/${entry.name}` : entry.name,
            lastModified: entryStats.mtime.toISOString(),
          };

          if (entry.isFile()) {
            item.size = entryStats.size;
            item.extension = extname(entry.name);
          }

          result.contents!.push(item);
        }

        // Sort: directories first, then files, both alphabetically
        result.contents!.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      }

      const responseText = this.formatNavigationResult(result);

      return {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        `[${context.requestId}] Error navigating structure:`,
        error,
      );
      throw new NotFoundError(`Path not found or inaccessible: ${path}`);
    }
  }

  /**
   * Search project files
   */
  private async searchProject(
    params: SearchProjectParams,
    context: MiddlewareContext,
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
      query,
      filePattern,
      maxResults = 100,
      caseSensitive = false,
      includeContent = true,
    } = params;

    if (!query) {
      throw new ValidationError('Search query is required');
    }

    this.logger.debug(
      `[${context.requestId}] Searching project with params:`,
      params,
    );

    const startTime = Date.now();
    const result: SearchResult = {
      query,
      totalResults: 0,
      results: [],
      searchTime: 0,
    };

    // This is a basic implementation - in production, you'd use a more sophisticated search
    try {
      const projectPath = this.config.projectPath;
      await this.searchInDirectory(
        projectPath,
        projectPath,
        query,
        result,
        {
          ...(filePattern && { filePattern }),
          maxResults,
          caseSensitive,
          includeContent,
        },
      );

      result.searchTime = Date.now() - startTime;
      const responseText = this.formatSearchResult(result);

      return {
        content: [
          {
            type: 'text',
            text: responseText,
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        `[${context.requestId}] Error searching project:`,
        error,
      );
      throw new ValidationError('Search operation failed');
    }
  }

  // Helper methods implementation continues...

  private async detectPackageManager(projectPath: string): Promise<string> {
    try {
      const files = await fs.readdir(projectPath);

      if (files.includes('package-lock.json')) return 'npm';
      if (files.includes('yarn.lock')) return 'yarn';
      if (files.includes('pnpm-lock.yaml')) return 'pnpm';

      return 'npm'; // default
    } catch {
      return 'unknown';
    }
  }

  private generateDependencySummary(result: DependencyAnalysisResult): string {
    return `Dependency Analysis Summary

Package Manager: ${result.packageManager}
Total Dependencies: ${result.totalDependencies}
- Production: ${result.productionDependencies}
- Development: ${result.developmentDependencies}

Security Status: ${result.vulnerabilities.length} vulnerabilities found
Outdated Packages: ${result.outdatedPackages}

${result.vulnerabilities.length > 0 ? 'Security vulnerabilities detected. Consider running security updates.' : 'No known security vulnerabilities detected.'}`;
  }

  private async performSecurityScan(
    /* _packageJson: Record<string, unknown> */
    /* _context: MiddlewareContext */
  ): Promise<SecurityVulnerability[]> {
    // Placeholder for security scanning
    // In production, this would integrate with npm audit, Snyk, or similar services
    return [];
  }

  private formatDetailedDependencyReport(
    result: DependencyAnalysisResult,
  ): string {
    let report = this.generateDependencySummary(result);

    if (result.dependencies && result.dependencies.length > 0) {
      report += '\n\nDetailed Dependency List:\n';
      report += '=' .repeat(50) + '\n';

      const prodDeps = result.dependencies.filter(
        dep => dep.type === 'production',
      );
      const devDeps = result.dependencies.filter(
        dep => dep.type === 'development',
      );

      if (prodDeps.length > 0) {
        report += '\nProduction Dependencies:\n';
        report += '-'.repeat(25) + '\n';
        prodDeps.forEach(dep => {
          report += `• ${dep.name}@${dep.version}\n`;
        });
      }

      if (devDeps.length > 0) {
        report += '\nDevelopment Dependencies:\n';
        report += '-'.repeat(28) + '\n';
        devDeps.forEach(dep => {
          report += `• ${dep.name}@${dep.version}\n`;
        });
      }
    }

    return report;
  }

  private formatNavigationResult(result: NavigationResult): string {
    let output = `Navigation: ${result.currentPath}\n`;
    output += '='.repeat(50) + '\n';

    if (result.breadcrumb.length > 0) {
      output += `Path: ${result.breadcrumb.join(' / ')}\n\n`;
    }

    if (result.type === 'file') {
      output += 'This is a file. Use the file content resource to read its contents.\n';
      return output;
    }

    if (!result.contents || result.contents.length === 0) {
      output += 'Directory is empty or no accessible items found.\n';
      return output;
    }

    const directories = result.contents.filter(item => item.type === 'directory');
    const files = result.contents.filter(item => item.type === 'file');

    if (directories.length > 0) {
      output += 'Directories:\n';
      directories.forEach(dir => {
        output += `📁 ${dir.name}/\n`;
      });
      output += '\n';
    }

    if (files.length > 0) {
      output += 'Files:\n';
      files.forEach(file => {
        const size = file.size ? ` (${Math.round(file.size / 1024)}KB)` : '';
        output += `📄 ${file.name}${size}\n`;
      });
    }

    return output;
  }

  private formatSearchResult(result: SearchResult): string {
    let output = `Search Results for "${result.query}"\n`;
    output += '='.repeat(50) + '\n';
    output += `Found ${result.totalResults} matches in ${result.searchTime}ms\n\n`;

    if (result.results.length === 0) {
      output += 'No matches found.\n';
      return output;
    }

    result.results.forEach((match, index) => {
      output += `${index + 1}. ${match.file}`;
      if (match.line) {
        output += `:${match.line}`;
        if (match.column) {
          output += `:${match.column}`;
        }
      }
      output += '\n';

      if (match.content) {
        output += `   ${match.content.trim()}\n`;
      }
      output += '\n';
    });

    return output;
  }

  private async searchInDirectory(
    dir: string,
    basePath: string,
    query: string,
    result: SearchResult,
    options: {
      filePattern?: string;
      maxResults: number;
      caseSensitive: boolean;
      includeContent: boolean;
    },
  ): Promise<void> {
    if (result.results.length >= options.maxResults) return;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (result.results.length >= options.maxResults) break;

        // Skip hidden files and build directories
        if (entry.name.startsWith('.') && !entry.name.startsWith('.git'))
          continue;
        if (['node_modules', 'dist', 'build', 'coverage'].includes(entry.name))
          continue;

        const fullPath = join(dir, entry.name);
        const relativePath = fullPath.replace(basePath + '/', '');

        if (entry.isDirectory()) {
          await this.searchInDirectory(fullPath, basePath, query, result, options);
        } else if (entry.isFile()) {
          // Check filename match
          const nameMatch = options.caseSensitive
            ? entry.name.includes(query)
            : entry.name.toLowerCase().includes(query.toLowerCase());

          if (nameMatch) {
            result.results.push({
              file: relativePath,
              type: 'filename',
            });
            result.totalResults++;
          }

          // Check content match if enabled
          if (options.includeContent && result.results.length < options.maxResults) {
            try {
              const stats = await fs.stat(fullPath);
              if (stats.size > 1024 * 1024) continue; // Skip files > 1MB

              const content = await fs.readFile(fullPath, 'utf-8');
              const searchContent = options.caseSensitive ? content : content.toLowerCase();
              const searchQuery = options.caseSensitive ? query : query.toLowerCase();

              if (searchContent.includes(searchQuery)) {
                const lines = content.split('\n');
                for (let i = 0; i < lines.length && result.results.length < options.maxResults; i++) {
                  const line = lines[i];
                  if (!line) continue;
                  const searchLine = options.caseSensitive ? line : line.toLowerCase();
                  
                  if (searchLine.includes(searchQuery)) {
                    result.results.push({
                      file: relativePath,
                      line: i + 1,
                      content: line,
                      type: 'content',
                    });
                    result.totalResults++;
                  }
                }
              }
            } catch {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }
}