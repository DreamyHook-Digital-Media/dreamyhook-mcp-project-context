# Testing Infrastructure

This directory contains the testing infrastructure and test suites for the Project Context MCP
Server.

## Directory Structure

```
tests/
├── setup.ts           # Global test setup and configuration
├── helpers/           # Test helper functions and utilities
├── fixtures/          # Test data and mock files
├── unit/             # Unit tests for individual components
├── integration/      # Integration tests for component interactions
└── e2e/             # End-to-end tests for complete workflows
```

## Test Categories

### Unit Tests (`tests/unit/`)

- Test individual functions, classes, and modules in isolation
- Focus on specific functionality and edge cases
- Should be fast and independent
- Mock external dependencies

### Integration Tests (`tests/integration/`)

- Test interactions between multiple components
- Verify component integration works correctly
- May use real dependencies but with controlled environments
- Test data flow and component communication

### End-to-End Tests (`tests/e2e/`)

- Test complete user workflows and scenarios
- Use real MCP protocol communication
- Test with actual file systems and Git repositories
- Slower but provide high confidence in functionality

## Testing Conventions

### File Naming

- Unit tests: `*.test.ts` or `*.spec.ts`
- Integration tests: `*.integration.test.ts`
- End-to-end tests: `*.e2e.test.ts`

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Arrange
      const input = 'test input';

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Mocking Strategy

- Mock external dependencies (file system, network, etc.)
- Use real implementations for internal components when possible
- Provide mock data through fixtures
- Reset mocks between tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.spec.ts

# Run tests matching pattern
npm test -- --testNamePattern="should handle error"
```

## Coverage Requirements

- **Minimum Coverage**: 80% for lines, functions, branches, and statements
- **Critical Components**: Should aim for 90%+ coverage
- **Utility Functions**: Should have 100% coverage
- **Integration Points**: Must have comprehensive test coverage

## Test Data and Fixtures

- Store test data in `tests/fixtures/`
- Use realistic but sanitized data
- Organize fixtures by component or test type
- Include both positive and negative test cases

## Best Practices

1. **Test Isolation**: Each test should be independent and not affect others
2. **Descriptive Names**: Test descriptions should clearly state what is being tested
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Fast Execution**: Unit tests should complete quickly
5. **Maintainable**: Tests should be easy to understand and modify
6. **Comprehensive**: Cover happy paths, edge cases, and error conditions
