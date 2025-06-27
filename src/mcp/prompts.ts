/**
 * MCP Prompts Interface Implementation
 *
 * Defines and implements all context-aware prompts exposed through
 * the Model Context Protocol.
 */

import { createLogger, LogLevel } from '../utils/logger';
import { ServerConfig } from './config';
import {
  errorHandlingMiddleware,
  generateRequestId,
  MiddlewareContext,
  ValidationError,
} from './middleware';
import { ProjectContextResources } from './resources';
import { ProjectContextTools } from './tools';

/**
 * Prompt schema definitions
 */
export interface PromptSchema {
  name: string;
  description: string;
  arguments?: PromptArgument[];
}

export interface PromptArgument {
  name: string;
  description: string;
  required?: boolean;
  type?: string;
}

export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: {
    type: 'text' | 'image';
    text?: string;
    image_url?: string;
  };
}

export interface PromptResponse {
  description: string;
  messages: PromptMessage[];
}

/**
 * Prompt handler class
 */
export class ProjectContextPrompts {
  private config: ServerConfig;
  private logger: ReturnType<typeof createLogger>;
  private resources: ProjectContextResources;
  private tools: ProjectContextTools;

  constructor(config: ServerConfig) {
    this.config = config;
    this.logger = createLogger('ProjectContextPrompts', LogLevel.DEBUG);
    this.resources = new ProjectContextResources(config);
    this.tools = new ProjectContextTools(config);
  }

  /**
   * Get all available prompts
   */
  async listPrompts(): Promise<PromptSchema[]> {
    const context: MiddlewareContext = {
      requestId: generateRequestId(),
      timestamp: new Date(),
      method: 'listPrompts',
    };

    return errorHandlingMiddleware(async () => {
      this.logger.debug(`[${context.requestId}] Listing available prompts`);

      const prompts: PromptSchema[] = [
        {
          name: 'project_overview',
          description:
            'Generate a comprehensive project overview including structure, dependencies, and key insights',
          arguments: [
            {
              name: 'focus_areas',
              description:
                'Specific areas to focus on (e.g., security, performance, architecture)',
              required: false,
              type: 'string',
            },
            {
              name: 'detail_level',
              description: 'Level of detail: brief, standard, detailed',
              required: false,
              type: 'string',
            },
          ],
        },
        {
          name: 'code_analysis',
          description:
            'Analyze specific files or code patterns with project context integration',
          arguments: [
            {
              name: 'file_path',
              description: 'Path to specific file for analysis',
              required: false,
              type: 'string',
            },
            {
              name: 'analysis_type',
              description:
                'Type of analysis: quality, security, performance, patterns',
              required: false,
              type: 'string',
            },
            {
              name: 'include_suggestions',
              description: 'Include improvement suggestions',
              required: false,
              type: 'boolean',
            },
          ],
        },
        {
          name: 'debugging_assistance',
          description:
            'Provide debugging guidance based on project context and error patterns',
          arguments: [
            {
              name: 'error_message',
              description: 'Error message or stack trace to analyze',
              required: false,
              type: 'string',
            },
            {
              name: 'context_files',
              description:
                'Comma-separated list of relevant files for context',
              required: false,
              type: 'string',
            },
            {
              name: 'debug_level',
              description: 'Debug detail level: quick, thorough, comprehensive',
              required: false,
              type: 'string',
            },
          ],
        },
        {
          name: 'architecture_review',
          description:
            'Review project architecture and provide design guidance and recommendations',
          arguments: [
            {
              name: 'review_scope',
              description:
                'Scope of review: overall, module, performance, scalability',
              required: false,
              type: 'string',
            },
            {
              name: 'target_changes',
              description: 'Specific changes or features being considered',
              required: false,
              type: 'string',
            },
            {
              name: 'architecture_goals',
              description: 'Architecture goals: maintainability, performance, scalability',
              required: false,
              type: 'string',
            },
          ],
        },
      ];

      this.logger.debug(
        `[${context.requestId}] Found ${prompts.length} available prompts`,
      );
      return prompts;
    }, context);
  }

  /**
   * Execute a specific prompt
   */
  async executePrompt(
    promptName: string,
    args: Record<string, unknown>,
  ): Promise<PromptResponse> {
    const context: MiddlewareContext = {
      requestId: generateRequestId(),
      timestamp: new Date(),
      method: 'executePrompt',
      params: { promptName, args },
    };

    return errorHandlingMiddleware(async () => {
      this.logger.debug(
        `[${context.requestId}] Executing prompt: ${promptName}`,
        args,
      );

      switch (promptName) {
        case 'project_overview':
          return await this.generateProjectOverview(args, context);

        case 'code_analysis':
          return await this.generateCodeAnalysis(args, context);

        case 'debugging_assistance':
          return await this.generateDebuggingAssistance(args, context);

        case 'architecture_review':
          return await this.generateArchitectureReview(args, context);

        default:
          throw new ValidationError(`Unknown prompt: ${promptName}`);
      }
    }, context);
  }

  /**
   * Generate project overview prompt
   */
  private async generateProjectOverview(
    args: Record<string, unknown>,
    context: MiddlewareContext,
  ): Promise<PromptResponse> {
    const focusAreas = (args['focus_areas'] as string) || 'general';
    const detailLevel = (args['detail_level'] as string) || 'standard';

    this.logger.debug(
      `[${context.requestId}] Generating project overview with focus: ${focusAreas}, detail: ${detailLevel}`,
    );

    // Gather project context data
    const projectOverview = await this.resources.readResource(
      'context://project/overview',
    );
    const projectStructure = await this.resources.readResource(
      'context://project/structure',
    );
    const projectDependencies = await this.resources.readResource(
      'context://project/dependencies',
    );

    const projectData = JSON.parse(projectOverview.contents[0]?.text || '{}');
    const structureData = JSON.parse(projectStructure.contents[0]?.text || '{}');
    const dependenciesData = JSON.parse(projectDependencies.contents[0]?.text || '{}');

    let promptText = `Please analyze this ${projectData.language} project and provide a comprehensive overview. Here's the project information:

## Project Details
- **Name**: ${projectData.name}
- **Version**: ${projectData.version}  
- **Description**: ${projectData.description}
- **Language**: ${projectData.language}
- **Framework**: ${projectData.framework || 'None detected'}
- **Package Manager**: ${projectData.packageManager}
- **File Count**: ${projectData.fileCount}
- **Size**: ${Math.round(projectData.sizeInBytes / 1024 / 1024 * 100) / 100}MB

## Dependencies Summary
- **Total Dependencies**: ${dependenciesData.totalDependencies}
- **Production**: ${dependenciesData.productionDependencies}
- **Development**: ${dependenciesData.developmentDependencies}
- **Package Manager**: ${dependenciesData.packageManager}

## Project Structure Overview
The project has the following top-level structure:
${this.formatStructureForPrompt(structureData, 2)}

## Analysis Request
Focus Areas: ${focusAreas}
Detail Level: ${detailLevel}

Please provide insights on:
1. Project architecture and organization
2. Technology stack assessment
3. Dependency health and recommendations
4. Code quality observations
5. Potential areas for improvement`;

    if (focusAreas !== 'general') {
      promptText += `\n\nPay special attention to ${focusAreas} aspects of the project.`;
    }

    if (detailLevel === 'detailed') {
      promptText += '\n\nProvide detailed analysis with specific recommendations and examples.';
    } else if (detailLevel === 'brief') {
      promptText += '\n\nKeep the analysis concise and focus on key points only.';
    }

    return {
      description: `Comprehensive project overview with focus on ${focusAreas}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }

  /**
   * Generate code analysis prompt
   */
  private async generateCodeAnalysis(
    args: Record<string, unknown>,
    context: MiddlewareContext,
  ): Promise<PromptResponse> {
    const filePath = args['file_path'] as string;
    const analysisType = (args['analysis_type'] as string) || 'quality';
    const includeSuggestions = (args['include_suggestions'] as boolean) ?? true;

    this.logger.debug(
      `[${context.requestId}] Generating code analysis for file: ${filePath}, type: ${analysisType}`,
    );

    let promptText = `Please analyze this code with project context. Here's the analysis request:

## Analysis Configuration
- **Analysis Type**: ${analysisType}
- **Include Suggestions**: ${includeSuggestions}
- **Project Context**: Available

## Project Context
`;

    // Add project overview context
    try {
      const projectOverview = await this.resources.readResource(
        'context://project/overview',
      );
      const projectData = JSON.parse(projectOverview.contents[0]?.text || '{}');
      
      promptText += `- **Language**: ${projectData.language}
- **Framework**: ${projectData.framework || 'None'}
- **Project Type**: ${projectData.description}

`;
    } catch (error) {
      this.logger.debug(`[${context.requestId}] Could not load project context:`, error);
    }

    // Add specific file content if provided
    if (filePath) {
      try {
        const fileContent = await this.resources.readResource(
          `context://file/${filePath}`,
        );
        promptText += `## File Content: ${filePath}
\`\`\`
${fileContent.contents[0]?.text || ''}
\`\`\`

`;
      } catch (error) {
        promptText += `**Note**: Could not load file content for ${filePath}. Please provide the code to analyze.

`;
      }
    } else {
      promptText += `**Note**: No specific file provided. Please share the code you'd like me to analyze.

`;
    }

    promptText += `## Analysis Request
Please analyze the code focusing on ${analysisType} aspects:

`;

    switch (analysisType) {
      case 'quality':
        promptText += `- Code structure and organization
- Naming conventions and clarity
- Function/method design
- Error handling patterns
- Code maintainability`;
        break;
      case 'security':
        promptText += `- Security vulnerabilities
- Input validation
- Authentication/authorization patterns
- Data sanitization
- Secure coding practices`;
        break;
      case 'performance':
        promptText += `- Performance bottlenecks
- Algorithm efficiency
- Memory usage patterns
- I/O operations optimization
- Caching opportunities`;
        break;
      case 'patterns':
        promptText += `- Design patterns usage
- Architectural patterns
- Code patterns and anti-patterns
- Best practices adherence
- Refactoring opportunities`;
        break;
      default:
        promptText += `- Overall code quality
- Best practices adherence
- Improvement opportunities
- Design considerations`;
    }

    if (includeSuggestions) {
      promptText += '\n\nPlease include specific improvement suggestions with examples where applicable.';
    }

    return {
      description: `Code analysis focusing on ${analysisType} with project context`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }

  /**
   * Generate debugging assistance prompt
   */
  private async generateDebuggingAssistance(
    args: Record<string, unknown>,
    context: MiddlewareContext,
  ): Promise<PromptResponse> {
    const errorMessage = args['error_message'] as string;
    const contextFiles = args['context_files'] as string;
    const debugLevel = (args['debug_level'] as string) || 'thorough';

    this.logger.debug(
      `[${context.requestId}] Generating debugging assistance with level: ${debugLevel}`,
    );

    let promptText = `I need help debugging an issue in my project. Here's the context:

## Project Information
`;

    // Add project context
    try {
      const projectOverview = await this.resources.readResource(
        'context://project/overview',
      );
      const projectData = JSON.parse(projectOverview.contents[0]?.text || '{}');
      
      promptText += `- **Language**: ${projectData.language}
- **Framework**: ${projectData.framework || 'None'}
- **Version**: ${projectData.version}
- **Package Manager**: ${projectData.packageManager}

`;
    } catch (error) {
      this.logger.debug(`[${context.requestId}] Could not load project context:`, error);
    }

    // Add error information
    if (errorMessage) {
      promptText += `## Error Details
\`\`\`
${errorMessage}
\`\`\`

`;
    }

    // Add context files if provided
    if (contextFiles) {
      promptText += `## Relevant Files
`;
      const files = contextFiles.split(',').map(f => f.trim());
      
      for (const file of files.slice(0, 3)) { // Limit to 3 files
        try {
          const fileContent = await this.resources.readResource(
            `context://file/${file}`,
          );
          const content = fileContent.contents[0]?.text || '';
          promptText += `### ${file}
\`\`\`
${content.slice(0, 2000)}${content.length > 2000 ? '\n... (truncated)' : ''}
\`\`\`

`;
        } catch (error) {
          promptText += `### ${file}
*Could not load file content*

`;
        }
      }
    }

    promptText += `## Debugging Request
Debug Level: ${debugLevel}

Please help me debug this issue by:

1. **Analyzing the error** - What is the root cause?
2. **Identifying the problem area** - Where in the code is the issue occurring?
3. **Providing solutions** - How can this be fixed?
4. **Suggesting prevention** - How can similar issues be avoided?

`;

    switch (debugLevel) {
      case 'quick':
        promptText += 'Please provide a quick diagnosis and the most likely solution.';
        break;
      case 'comprehensive':
        promptText += `Please provide a comprehensive analysis including:
- Multiple potential causes
- Step-by-step debugging approach
- Alternative solutions
- Related code improvements`;
        break;
      default: // thorough
        promptText += 'Please provide a thorough analysis with clear explanations and practical solutions.';
    }

    if (!errorMessage && !contextFiles) {
      promptText += '\n\n**Note**: Please share the error message and relevant code for more specific assistance.';
    }

    return {
      description: `Debugging assistance with ${debugLevel} analysis`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }

  /**
   * Generate architecture review prompt
   */
  private async generateArchitectureReview(
    args: Record<string, unknown>,
    context: MiddlewareContext,
  ): Promise<PromptResponse> {
    const reviewScope = (args['review_scope'] as string) || 'overall';
    const targetChanges = args['target_changes'] as string;
    const architectureGoals = args['architecture_goals'] as string;

    this.logger.debug(
      `[${context.requestId}] Generating architecture review with scope: ${reviewScope}`,
    );

    let promptText = `Please review the architecture of this project and provide design guidance. Here's the project information:

## Project Context
`;

    // Add comprehensive project context
    try {
      const projectOverview = await this.resources.readResource(
        'context://project/overview',
      );
      const projectStructure = await this.resources.readResource(
        'context://project/structure',
      );
      const projectDependencies = await this.resources.readResource(
        'context://project/dependencies',
      );

      const projectData = JSON.parse(projectOverview.contents[0]?.text || '{}');
      const structureData = JSON.parse(projectStructure.contents[0]?.text || '{}');
      const dependenciesData = JSON.parse(projectDependencies.contents[0]?.text || '{}');

      promptText += `### Project Overview
- **Name**: ${projectData.name}
- **Language**: ${projectData.language}
- **Framework**: ${projectData.framework || 'None detected'}
- **Size**: ${projectData.fileCount} files, ${Math.round(projectData.sizeInBytes / 1024 / 1024 * 100) / 100}MB

### Architecture Structure
${this.formatStructureForPrompt(structureData, 3)}

### Dependencies Analysis
- **Total Dependencies**: ${dependenciesData.totalDependencies}
- **Production**: ${dependenciesData.productionDependencies}
- **Development**: ${dependenciesData.developmentDependencies}
- **Package Manager**: ${dependenciesData.packageManager}

`;
    } catch (error) {
      this.logger.debug(`[${context.requestId}] Could not load project context:`, error);
      promptText += '*Project context not available - please provide project details.*\n\n';
    }

    promptText += `## Review Configuration
- **Review Scope**: ${reviewScope}`;

    if (targetChanges) {
      promptText += `\n- **Target Changes**: ${targetChanges}`;
    }

    if (architectureGoals) {
      promptText += `\n- **Architecture Goals**: ${architectureGoals}`;
    }

    promptText += `\n\n## Architecture Review Request

Please provide an architectural analysis focusing on ${reviewScope} aspects:

`;

    switch (reviewScope) {
      case 'overall':
        promptText += `1. **Overall Architecture Assessment**
   - Current architecture patterns and style
   - Strengths and weaknesses
   - Scalability considerations

2. **Design Principles Evaluation**
   - Separation of concerns
   - Modularity and cohesion
   - Maintainability factors

3. **Recommendations**
   - Architectural improvements
   - Best practices alignment
   - Future-proofing suggestions`;
        break;
      case 'module':
        promptText += `1. **Module Structure Analysis**
   - Module organization and boundaries
   - Inter-module dependencies
   - Coupling and cohesion assessment

2. **Module Design Quality**
   - Single responsibility adherence
   - Interface design
   - Reusability factors

3. **Module Recommendations**
   - Refactoring opportunities
   - Better module boundaries
   - Dependency optimization`;
        break;
      case 'performance':
        promptText += `1. **Performance Architecture Review**
   - Performance bottleneck identification
   - Scalability assessment
   - Resource utilization patterns

2. **Performance Design Patterns**
   - Caching strategies
   - Asynchronous processing
   - Data flow optimization

3. **Performance Recommendations**
   - Optimization opportunities
   - Architectural changes for performance
   - Monitoring and measurement strategies`;
        break;
      case 'scalability':
        promptText += `1. **Scalability Assessment**
   - Current scalability limitations
   - Horizontal vs vertical scaling considerations
   - Load distribution patterns

2. **Scalable Design Patterns**
   - Microservices readiness
   - State management for scale
   - Database scalability

3. **Scalability Roadmap**
   - Immediate improvements
   - Long-term architectural evolution
   - Technology stack considerations`;
        break;
      default:
        promptText += `1. **Architecture Overview**
2. **Design Quality Assessment**
3. **Improvement Recommendations**
4. **Implementation Guidance**`;
    }

    if (targetChanges) {
      promptText += `\n\n## Specific Change Analysis
Please also evaluate the proposed changes: "${targetChanges}"
- Impact on current architecture
- Implementation approach
- Potential risks and mitigations`;
    }

    if (architectureGoals) {
      promptText += `\n\n## Goal Alignment
Please ensure recommendations align with these architecture goals: "${architectureGoals}"`;
    }

    return {
      description: `Architecture review focusing on ${reviewScope} with design guidance`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }

  /**
   * Helper method to format project structure for prompts
   */
  private formatStructureForPrompt(
    structure: Record<string, unknown>,
    maxDepth: number,
    currentDepth: number = 0,
    indent: string = '',
  ): string {
    if (currentDepth >= maxDepth) {
      return '';
    }

    let result = '';
    
    if (structure['name'] && currentDepth > 0) {
      const icon = structure['type'] === 'directory' ? '📁' : '📄';
      result += `${indent}${icon} ${structure['name']}\n`;
    }

    const children = structure['children'];
    if (Array.isArray(children) && structure['type'] === 'directory') {
      const childIndent = indent + '  ';
      const childrenToShow = children.slice(0, 10); // Limit children shown
      
      for (const child of childrenToShow) {
        if (typeof child === 'object' && child !== null) {
          result += this.formatStructureForPrompt(
            child as Record<string, unknown>,
            maxDepth,
            currentDepth + 1,
            childIndent,
          );
        }
      }
      
      if (children.length > 10) {
        result += `${childIndent}... (${children.length - 10} more items)\n`;
      }
    }

    return result;
  }
}