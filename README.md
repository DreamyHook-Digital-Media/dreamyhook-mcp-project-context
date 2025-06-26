# Project Context MCP Server

An intelligent MCP (Model Context Protocol) server that provides automatic project context to Claude Code, eliminating the manual overhead of explaining project structure, dependencies, and recent changes.

## Overview

The Project Context MCP Server transforms how Claude Code understands and interacts with software projects by automatically analyzing project characteristics and providing structured context through the Model Context Protocol. This tool enables more productive and contextually-aware coding assistance.

## Features

- **Automatic Project Analysis**: Scans project structure, dependencies, and Git history
- **MCP Protocol Integration**: Native integration with Claude Code through standardized interfaces
- **Intelligent Context**: Provides comprehensive project understanding without manual input
- **Multi-Language Support**: Works with JavaScript, Python, Java, Rust, and more
- **Real-time Updates**: Incremental analysis for efficient performance

## Installation

```bash
# Install globally via npm
npm install -g @dreamyhook/project-context-mcp-server

# Configure in Claude Code
# Add to your Claude Code MCP configuration:
{
  "mcpServers": {
    "project-context": {
      "command": "project-context-mcp-server"
    }
  }
}
```

## Quick Start

1. Install the server globally
2. Configure Claude Code to use the MCP server
3. Claude Code will automatically access project context when working in any directory

## Development Status

🚧 **This project is currently under active development**

**Current Phase**: Foundation & Infrastructure
**Next Milestone**: MCP Protocol Implementation

See [STORY_TRACKING.md](./STORY_TRACKING.md) for detailed development progress.

## Technology Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript v5+
- **MCP SDK**: @anthropic-ai/mcp-sdk
- **Git Integration**: simple-git
- **File Operations**: fs-extra, fast-glob

## Development

```bash
# Clone the repository
git clone https://github.com/DreamyHook-Digital-Media/dreamyhook-mcp-project-context.git
cd dreamyhook-mcp-project-context

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## Architecture

The server consists of three main components:

- **MCP Protocol Layer**: Handles communication with Claude Code
- **Project Analysis Engine**: Scans and interprets project characteristics
- **Context Data Management**: Manages caching and data retrieval

## Contributing

We welcome contributions! Please see our [contribution guidelines](./CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Links

- [Repository](https://github.com/DreamyHook-Digital-Media/dreamyhook-mcp-project-context)
- [Issues](https://github.com/DreamyHook-Digital-Media/dreamyhook-mcp-project-context/issues)
- [Project Specification](./projectSpecification.md)

## Roadmap

- ✅ Project Foundation & Infrastructure
- 🚧 MCP Protocol Implementation
- 📋 Project Analysis Engine
- 📋 Git Integration
- 📋 Performance & Caching
- 📋 Testing & Quality Assurance
- 📋 Documentation & Community
- 📋 Packaging & Distribution
- 📋 Launch & Marketing

---

Built with ❤️ by [DreamyHook Digital Media](https://github.com/DreamyHook-Digital-Media)