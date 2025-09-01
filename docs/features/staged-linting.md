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

## Auto-Restaging

The `autoRestage` feature automatically re-stages files that are modified by linting commands (like `--fix` flags). This ensures that auto-fixes are included in your commit.

### How it works

1. **Captures original content** of staged files before running lint commands
2. **Runs lint commands** which may modify files in the working directory
3. **Detects modifications** by comparing file content before and after linting
4. **Automatically re-stages** modified files so fixes are included in the commit
5. **Validates re-staged files** to ensure they still pass linting

### Configuration

```json
{
  "pre-commit": {
    "stagedLint": {
      "*.{js,ts}": "eslint --fix"
    },
    "autoRestage": true  // Default: true
  }
}
```

### When to disable autoRestage

Set `autoRestage: false` when you want to:

- **Fail builds** if files need fixing (useful in CI)
- **Manually review** auto-fixes before committing
- **Debug linting** configurations without side effects

```json
{
  "preCommit": {
    "stagedLint": {
      "*.js": "eslint --fix"
    },
    "autoRestage": false
  }
}
```

When disabled, you'll see a warning if files are modified:

```bash
⚠️  Lint modified 3 files but auto-restaging is disabled.
   Modified files: src/utils.js, src/helpers.js, src/main.js
   You may need to manually stage these files and commit again.
```
