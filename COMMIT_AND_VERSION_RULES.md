# Commit Message Templates and Versioning Rules

## Commit Message Convention

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files

### Scopes
Based on project structure:
- **mcp**: MCP protocol implementation
- **analysis**: Project analysis engine
- **git**: Git integration features
- **cache**: Caching and performance
- **config**: Configuration system
- **core**: Core functionality
- **deps**: Dependencies
- **docs**: Documentation
- **test**: Testing infrastructure

### Commit Templates

#### Feature Implementation
```
feat(<scope>): implement <feature-name>

- Add <specific-functionality>
- Include <additional-capability>
- Support <use-case>

Story: <STORY-ID>
```

#### Bug Fix
```
fix(<scope>): resolve <issue-description>

- Fix <specific-problem>
- Handle <edge-case>
- Prevent <error-condition>

Fixes: #<issue-number>
Story: <STORY-ID>
```

#### Task Completion
```
<type>(<scope>): <task-description>

Task: <TASK-ID>
Story: <STORY-ID>
```

#### Story Completion
```
feat(<epic>): complete <story-name> implementation

Summary:
- Implemented <major-feature-1>
- Added <major-feature-2>
- Integrated <component>

This completes all acceptance criteria for <STORY-ID>.

Story: <STORY-ID>
Version: <new-version>
```

## Semantic Versioning Rules

### Version Format
```
MAJOR.MINOR.PATCH
```

### During Initial Development (0.x.x)

#### Task-Level Commits
- **Patch increment (0.0.1)**: Each task completion
- Example: 0.1.0 → 0.1.1 → 0.1.2

#### Story-Level Completion
- **Minor increment (0.1.0)**: Feature stories
- **Patch increment (0.0.1)**: Fix/improvement stories
- Example: Complete INFRA-001 → 0.1.0 → 0.2.0

#### Epic Completion
- **Minor increment (0.1.0)**: Most epics
- Consider larger increment for major milestones

### Post 1.0 Release

#### Version Increments
- **Major (1.0.0)**: Breaking API changes
- **Minor (0.1.0)**: New features (backward compatible)
- **Patch (0.0.1)**: Bug fixes and minor improvements

### Story-Specific Versioning

| Story Type | Version Change | Example |
|------------|---------------|---------|
| Infrastructure Setup | Minor | 0.0.0 → 0.1.0 |
| New Feature | Minor | 0.1.0 → 0.2.0 |
| Enhancement | Minor | 0.2.0 → 0.3.0 |
| Bug Fix | Patch | 0.3.0 → 0.3.1 |
| Documentation | Patch | 0.3.1 → 0.3.2 |
| Performance | Patch | 0.3.2 → 0.3.3 |
| Refactoring | Patch | 0.3.3 → 0.3.4 |

### Pre-release Versions

For beta/alpha releases:
```
0.1.0-alpha.1
0.1.0-beta.1
0.1.0-rc.1
```

## Automated Version Bumping

### Task Commit Script
```bash
# After task completion
npm version patch -m "chore: bump version for task %s"
git add .
git commit -m "<type>(<scope>): <description>"
```

### Story Completion Script
```bash
# After story completion
npm version minor -m "chore: bump version for story %s"
git add .
git commit -m "feat(<epic>): complete <story-name>"
git tag -a "story-<STORY-ID>" -m "Completed story <STORY-ID>"
```

## Git Tag Convention

### Tag Formats
- **Story completion**: `story-<STORY-ID>` (e.g., `story-INFRA-001`)
- **Epic completion**: `epic-<EPIC-NUMBER>` (e.g., `epic-1`)
- **Release versions**: `v<VERSION>` (e.g., `v0.1.0`)
- **Milestones**: `milestone-<NAME>` (e.g., `milestone-mvp`)

### Tag Messages
Include:
- Summary of changes
- Key features/fixes
- Breaking changes (if any)
- Story/Epic reference

## Example Workflow

### Starting Story INFRA-001
```bash
# Current version: 0.0.0
# Create task todo items
# Start first task
```

### Task 1 Completion
```bash
git add .
git commit -m "chore(infra): initialize repository structure

Task: INFRA-001-1
Story: INFRA-001"
# Version: 0.0.0 → 0.0.1
```

### Task 2 Completion
```bash
git add .
git commit -m "build(infra): add MIT license and gitignore

Task: INFRA-001-2
Story: INFRA-001"
# Version: 0.0.1 → 0.0.2
```

### Story Completion
```bash
npm version minor -m "chore: bump version for story INFRA-001"
git add .
git commit -m "feat(infra): complete project repository setup

Summary:
- Created GitHub repository structure
- Added MIT license
- Configured .gitignore for Node.js
- Setup issue templates
- Created initial folder structure

This completes all acceptance criteria for INFRA-001.

Story: INFRA-001
Version: 0.1.0"

git tag -a "story-INFRA-001" -m "Completed project repository setup"
```

## Commit Message Examples

### Good Examples
```
feat(mcp): implement resource listing endpoint

- Add GET /resources endpoint
- Include pagination support
- Return proper MCP format

Story: MCP-002
```

```
fix(analysis): handle missing package.json gracefully

- Check file existence before parsing
- Return empty dependencies array
- Log warning instead of throwing

Fixes: #42
Story: ANAL-003
```

### Bad Examples
```
update code  // Too vague
fixed bug    // Which bug?
WIP          // Don't commit work in progress
stuff        // Meaningless
```