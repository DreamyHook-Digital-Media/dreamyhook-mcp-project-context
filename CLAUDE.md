# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Project Context MCP Server** - an open-source MCP (Model Context Protocol) server that provides intelligent, automatic project context to Claude Code. The project is currently in its initial phase with only the specification document completed.

### Current Status
- **Phase**: Pre-implementation (specification complete)
- **Repository**: https://github.com/DreamyHook-Digital-Media/dreamyhook-mcp-project-context
- **Technology Stack**: Planned Node.js/TypeScript implementation
- **Purpose**: Eliminate manual overhead when explaining project context to AI coding assistants

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