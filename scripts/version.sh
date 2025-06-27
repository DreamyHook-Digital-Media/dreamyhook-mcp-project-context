#!/bin/bash

# Version management script for Project Context MCP Server
# Usage: ./scripts/version.sh [patch|minor|major]

set -e

# Check if argument is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 [patch|minor|major]"
    echo "  patch: Bug fixes (0.0.x)"
    echo "  minor: New features (0.x.0)"
    echo "  major: Breaking changes (x.0.0)"
    exit 1
fi

BUMP_TYPE=$1

# Validate bump type
if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
    echo "Error: Invalid bump type. Use 'patch', 'minor', or 'major'"
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Run tests to make sure everything is working
echo "Running tests..."
npm test

# Run build to make sure everything compiles
echo "Running build..."
npm run build

# Run linting and type checking
echo "Running quality checks..."
npm run lint
npm run typecheck

# Bump version
echo "Bumping $BUMP_TYPE version..."
NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version | sed 's/v//')

echo "New version: $NEW_VERSION"

# Commit the version bump
git add package.json
git commit -m "chore: Release version $NEW_VERSION

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create and push tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo "Version $NEW_VERSION is ready!"
echo "To push to remote: git push origin master && git push origin v$NEW_VERSION"