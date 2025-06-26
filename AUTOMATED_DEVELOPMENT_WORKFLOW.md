# Automated Development Workflow

## Overview

This document describes the automated development workflow for the Project Context MCP Server. The system follows an agile methodology with automated story tracking, task management, and semantic versioning.

## Workflow Process

### 1. Starting a Story

When you say "start with the story", the system will:

1. **Check Story Status**: Read `STORY_TRACKING.md` to find the last completed story
2. **Select Next Story**: Identify the next story in the epic sequence
3. **Create Task Breakdown**: Split the story into smaller, manageable tasks
4. **Initialize Version**: Set up version tracking for the story

### 2. Task Management

For each story, tasks are:
- Created in the todo list with unique IDs
- Tracked through status changes (pending → in_progress → completed)
- Committed individually with descriptive messages
- Version bumped appropriately

### 3. Commit Strategy

#### Task-Level Commits
Each completed task gets a commit with:
- **Format**: `<type>(<scope>): <description>`
- **Types**: 
  - `feat`: New feature
  - `fix`: Bug fix
  - `docs`: Documentation
  - `style`: Code style changes
  - `refactor`: Code refactoring
  - `test`: Test additions/changes
  - `chore`: Build/tool changes
- **Version Bump**: Patch version (0.0.x)

#### Story-Level Commits
Each completed story gets:
- **Summary Commit**: Consolidating all story changes
- **Version Bump**: 
  - Minor version (0.x.0) for features
  - Patch version (0.0.x) for fixes/improvements
  - Major version (x.0.0) for breaking changes

### 4. Version Management

#### Semantic Versioning Rules

**During Development (0.x.x)**:
- Major: 0 (stays at 0 during initial development)
- Minor: Increments for each completed story with new features
- Patch: Increments for each task commit and bug fixes

**Post 1.0 Release**:
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes and minor improvements

#### Version Tracking
Versions are tracked in:
- `package.json` (once created)
- `STORY_TRACKING.md` (story completion)
- Git tags (story completion)

### 5. Story Completion Process

1. **Complete All Tasks**: Ensure all story tasks are marked completed
2. **Run Tests**: Execute test suite (when available)
3. **Update Documentation**: Add/update relevant docs
4. **Story Summary Commit**: Create comprehensive commit
5. **Version Bump**: Update version per story type
6. **Update Tracking**: Mark story complete in `STORY_TRACKING.md`
7. **Create Git Tag**: Tag the story completion

### 6. Epic Transition

When all stories in an epic are complete:
1. Create epic summary in completion folder
2. Review epic acceptance criteria
3. Prepare for next epic
4. Major version consideration for significant milestones

## File Structure

```
dreamyhook-mcp-project-context/
├── STORY_TRACKING.md          # Story status and progress
├── AUTOMATED_DEVELOPMENT_WORKFLOW.md  # This file
├── completion/                # Story completion records
│   ├── EPIC-1/               # Epic 1 completion records
│   │   ├── INFRA-001/        # Individual story records
│   │   └── ...
│   └── ...
└── src/                      # Source code (when created)
```

## Command Reference

### Start Development
```
"start with the story"
```
This command triggers the automated workflow to:
- Find next story
- Create task breakdown
- Begin development

### Story Status Check
The system automatically:
- Reads current status from tracking file
- Identifies in-progress work
- Determines next priorities

### Completion Triggers
Tasks complete when:
- Implementation matches acceptance criteria
- Tests pass (when applicable)
- Documentation is updated

## Tracking Fields

### Story Tracking
- **Story ID**: Unique identifier (e.g., INFRA-001)
- **Status**: Not Started | In Progress | Completed
- **Version**: Version when story completed
- **Completion Date**: Timestamp of completion
- **Notes**: Additional context or issues

### Task Tracking
- **Task ID**: Story ID + task number (e.g., INFRA-001-1)
- **Description**: Clear task objective
- **Status**: pending | in_progress | completed
- **Commit Hash**: Git commit reference

## Quality Gates

Before marking a story complete:
1. All acceptance criteria met
2. Code follows project standards
3. Tests written and passing
4. Documentation updated
5. No critical issues remaining

## Error Handling

If issues occur during development:
1. Document in story notes
2. Create fix tasks if needed
3. Adjust version strategy if scope changes
4. Update completion estimates

## Continuous Improvement

The workflow supports:
- Retrospective notes per story
- Process improvements
- Metric tracking
- Velocity measurements