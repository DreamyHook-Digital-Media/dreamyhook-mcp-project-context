# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Project Context MCP Server** - an open-source MCP (Model Context Protocol) server that provides intelligent, automatic project context to Claude Code. The project is currently in its initial phase with only the specification document completed.

### Current Status
- **Phase**: Active Development (Story-driven implementation)
- **Repository**: https://github.com/DreamyHook-Digital-Media/dreamyhook-mcp-project-context
- **Technology Stack**: Node.js v18+ with TypeScript v5+
- **Purpose**: Eliminate manual overhead when explaining project context to AI coding assistants
- **Development Approach**: Automated story-driven development using STORY_TRACKING.md

## Development Commands

### Initial Project Setup (when implementation begins)
```bash
# Initialize Node.js project
npm init -y

# Install TypeScript and core dependencies
npm install --save-dev typescript @types/node ts-node jest @types/jest ts-jest
npm install @anthropic-ai/mcp-sdk simple-git fs-extra js-yaml xml2js lru-cache fast-glob

# Initialize TypeScript configuration
npx tsc --init

# Setup test environment
npm test -- --init
```

### Common Development Tasks (once project is set up)
```bash
# Run TypeScript compiler
npm run build

# Run tests
npm test

# Run specific test file
npm test -- path/to/test.spec.ts

# Run development server
npm run dev

# Lint code
npm run lint

# Type check
npm run typecheck
```

## Architecture Overview

### Core Components

1. **MCP Protocol Layer** (`src/mcp/`)
   - Implements Model Context Protocol specification
   - Handles communication with Claude Code
   - Exposes resources, tools, and prompts

2. **Project Analysis Engine** (`src/analysis/`)
   - File System Scanner - traverses project directories
   - Technology Detection Module - identifies languages/frameworks
   - Dependency Analyzer - parses package managers
   - Git Integration Component - extracts development activity

3. **Context Data Management** (`src/context/`)
   - Intelligent caching system with multi-level strategies
   - Data serialization for MCP protocol
   - Configuration management

### MCP Resources
- `context://project/overview` - Comprehensive project summary
- `context://project/dependencies` - Dependency graph and analysis
- `context://project/structure` - Project file structure

### MCP Tools
- `analyze_dependencies` - Performs dependency analysis with security scanning
- `get_recent_changes` - Retrieves Git activity with configurable windows
- `navigate_structure` - Provides intelligent project navigation

## Implementation Roadmap

### Phase 1 (Months 1-2): Foundation
- Core MCP server functionality
- Basic project analysis capabilities
- Essential dependency parsing (npm, pip, Maven, Cargo)
- Git integration basics

### Phase 2 (Months 3-4): Enhancement
- Advanced dependency analysis with security scanning
- Performance optimizations and caching
- Enhanced Git integration with impact assessment

### Phase 3 (Months 5-6): Community/Enterprise
- Plugin architecture for extensions
- Team collaboration features
- CI/CD integrations

## Key Design Principles

1. **Modularity**: Independent modules for each analysis aspect
2. **Extensibility**: Plugin-based architecture for community contributions
3. **Performance**: Sub-200ms response time for context queries
4. **Reliability**: Comprehensive error handling for unusual project structures

## Testing Strategy

- Unit tests for individual components
- Integration tests for MCP protocol compatibility
- End-to-end tests for real-world project scenarios
- Cross-platform testing on multiple Node.js versions

## Performance Requirements

- Context gathering: < 200ms for typical projects
- Incremental updates: < 50ms for file changes
- Initial analysis: < 2 seconds for projects up to 10,000 files
- Memory footprint: < 100MB for typical usage

## Automated Development Instructions

### Story-Driven Development Process

**CRITICAL**: This project follows automated story-driven development. When working on this project:

1. **Always read STORY_TRACKING.md first** to understand current progress
2. **Use "start with the story" command** to begin automated development
3. **Follow the exact workflow** defined in AUTOMATED_DEVELOPMENT_WORKFLOW.md
4. **Use TodoWrite tool** to track all tasks and progress
5. **Follow commit conventions** from COMMIT_AND_VERSION_RULES.md

### Development Workflow Commands

```bash
# To start automated development (Claude Code MUST use this)
# Command: "start with the story"
# This triggers the automated workflow system
```

### Exact Process for Claude Code

1. **Read STORY_TRACKING.md** to find the next story to implement
2. **Create task breakdown** for the selected story using TodoWrite
3. **Implement each task systematically** with proper commits
4. **Update version numbers** according to semantic versioning rules
5. **Mark story complete** when all acceptance criteria are met
6. **Update tracking files** and create completion documentation

### Required Files to Monitor
- `STORY_TRACKING.md` - Current story progress and status
- `AUTOMATED_DEVELOPMENT_WORKFLOW.md` - Development process rules
- `COMMIT_AND_VERSION_RULES.md` - Commit message and version standards
- `DEVELOPMENT_CONTROL_SYSTEM.md` - Control system documentation

### Versioning Strategy
- **Task completion**: Patch version increment (0.0.x)
- **Story completion**: Minor version increment (0.x.0)
- **Epic completion**: Consider major version increment

### Quality Gates
Before completing any story:
- All acceptance criteria must be met
- All tasks must be completed and committed
- Version must be properly incremented
- Documentation must be updated
- Story tracking must be updated

**Next Story to Implement**: INFRA-001 - Project Repository Setup