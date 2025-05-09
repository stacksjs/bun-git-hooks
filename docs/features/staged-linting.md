# Staged Linting

The staged linting feature allows you to run commands only on files that are staged for commit. This is particularly useful for ensuring code quality before commits.

## Usage

```ts
const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts}': 'bunx --bun eslint . --fix',
      '*.{css,scss}': 'stylelint --fix',
      '*.md': 'prettier --write'
    }
  }
}
```

## Key Features

- 🎯 **Pattern Matching**: Use glob patterns to target specific files
- 🔄 **Multiple Commands**: Run multiple commands for the same file pattern
- ⚡ **Performance**: Only lints files that have changed
- 🛠️ **Auto-fixing**: Supports tools that can automatically fix issues

## Configuration Options

### File Patterns

You can use any glob pattern supported by Git:

```json
{
  // Single extension
  "*.js": "eslint --fix",

  // Multiple extensions
  "*.{js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],

  // Specific directories
  "src/**/*.ts": "tsc --noEmit",

  // Exclude patterns
  "!(*test).ts": "eslint"
}
```

### Command Types

Commands can be specified in two ways:

1. **Single Command String**:

   ```json
   {
     "*.js": "eslint --fix"
   }
   ```

2. **Array of Commands**:

   ```json
   {
     "*.js": [
       "eslint --fix",
       "prettier --write"
     ]
   }
   ```

## Best Practices

1. **Order Matters**: Place more specific patterns before general ones
2. **Use Auto-fixing**: Enable auto-fix options when available
3. **Combine Tools**: Use multiple tools for comprehensive checks
4. **Performance**: Keep commands fast to maintain good developer experience

## Examples

### Basic JavaScript/TypeScript Linting

```json
{
  "pre-commit": {
    "staged-lint": {
      "*.{js,ts}": "bunx --bun eslint . --fix"
    }
  }
}
```

### Comprehensive Code Quality Checks

```json
{
  "pre-commit": {
    "staged-lint": {
      // Lint and format TypeScript files
      "*.{ts,tsx}": [
        "bunx --bun eslint . --fix",
        "prettier --write",
        "tsc --noEmit"
      ],

      // Style files
      "*.{css,scss}": "stylelint --fix",

      // Markdown files
      "*.md": "prettier --write",

      // JSON files
      "*.json": "prettier --write"
    }
  }
}
```

### Custom Script Integration

```json
{
  "pre-commit": {
    "staged-lint": {
      "*.{js,ts}": [
        "bun run test:unit",
        "bun run lint:fix",
        "bun run type-check"
      ]
    }
  }
}
```
