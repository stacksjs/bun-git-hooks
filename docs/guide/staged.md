---
title: Staged File Linting
description: Run linters and formatters only on staged files with bun-git-hooks
---

### Negation Patterns

Exclude files from matching:

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // All TypeScript except test files
      '*.ts': 'eslint --fix',
      '!*.test.ts': '', // Exclude test files

      // Or use glob negation in the pattern
      '!(*.test).ts': 'eslint --fix',
    },
  },
}
```

## Multiple Commands

### Command Array

Run multiple commands sequentially on matching files:

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write',
      ],

      '*.css': [
        'stylelint --fix',
        'prettier --write',
      ],
    },
  },
}
```

### Execution Order

Commands run in order. If any command fails, the process stops:

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.ts': [
        'eslint --fix --max-warnings=0', // Lint first
        'prettier --write',               // Then format
        'tsc --noEmit',                   // Then type check
      ],
    },
  },
}
```

## How It Works

1. When you run `git commit`, the pre-commit hook activates
2. bun-git-hooks gets the list of staged files
3. For each pattern, it finds matching staged files
4. It runs the specified commands with the matched files as arguments
5. If any command fails, the commit is aborted
6. If all succeed, the modified files are re-staged and commit proceeds

### Example Output

```bash
$ git commit -m "update features"

Running tasks for staged files...
  *.ts - 5 files
    eslint --fix
    prettier --write
  *.css - 2 files
    stylelint --fix
  *.md - no files [SKIPPED]

All tasks completed successfully!
[main abc1234] update features
```

## Common Configurations

### Full Stack Project

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // TypeScript/JavaScript
      '*.{js,jsx,ts,tsx}': [
        'eslint --fix --max-warnings=0',
        'prettier --write',
      ],

      // Styles
      '*.{css,scss,less}': [
        'stylelint --fix',
        'prettier --write',
      ],

      // Data files
      '*.{json,yaml,yml}': 'prettier --write',

      // Markdown
      '*.md': 'prettier --write',

      // HTML
      '*.html': 'prettier --write',
    },
  },
}
```

### Monorepo Project

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // Frontend package
      'packages/frontend/**/*.{ts,tsx}': [
        'eslint --fix',
        'prettier --write',
      ],

      // Backend package
      'packages/backend/**/*.ts': [
        'eslint --fix',
        'prettier --write',
      ],

      // Shared package
      'packages/shared/**/*.ts': [
        'eslint --fix',
        'prettier --write',
      ],
    },
  },
}
```

### Vue/React Project

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // Vue files
      '*.vue': [
        'eslint --fix',
        'prettier --write',
      ],

      // React files
      '*.{jsx,tsx}': [
        'eslint --fix',
        'prettier --write',
      ],

      // TypeScript
      '*.ts': [
        'eslint --fix',
        'prettier --write',
      ],

      // Styles
      '*.{css,scss}': 'stylelint --fix',
    },
  },
}
```

## Combining with Regular Commands

You can combine staged lint with regular pre-commit commands:

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.ts': 'eslint --fix',
    },
    // This would be a separate pre-commit command
  },

  // Regular command hooks
  'commit-msg': 'bunx gitlint --edit $1',
  'pre-push': 'bun run test',
}
```

## CLI Usage

### Run Staged Lint Manually

```bash

# Run staged lint for pre-commit hook

bunx git-hooks run-staged-lint pre-commit

# With verbose output

bunx git-hooks run-staged-lint pre-commit --verbose
```

This is useful for testing your configuration without actually committing.

## Troubleshooting

### Files Not Being Linted

1. Check if files are staged:

```bash
git status
```

2. Verify your patterns match:

```typescript
// Test pattern matching
const files = ['src/index.ts', 'test/app.test.ts']
const pattern = '*.ts'

// This pattern matches all .ts files
// To exclude test files, use:
// '*.ts' with '!*.test.ts'
// or '!(*.test).ts'
```

### Commands Not Finding Files

Make sure your command accepts file arguments:

```bash

# Good - accepts file arguments

eslint --fix file1.ts file2.ts

# Bad - doesn't know what to lint

eslint --fix  # No files!
```

### Changes Not Being Re-staged

After auto-fixing, changes should be re-staged automatically. If not:

1. Make sure commands output to the same file
2. Check file permissions
3. Enable verbose mode to see what's happening

### Pattern Debugging

Enable verbose mode to see pattern matching:

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.ts': 'eslint --fix',
    },
  },
  'verbose': true,
}
```

## Best Practices

### Keep Commands Fast

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // Fast: only lint, don't run full test suite
      '*.ts': 'eslint --fix',
    },
  },

  // Slow operations go to pre-push
  'pre-push': 'bun run test && bun run build',
}
```

### Use Auto-fix When Possible

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // Auto-fix makes the experience smoother
      '*.ts': 'eslint --fix',     // Not just 'eslint'
      '*.css': 'stylelint --fix', // Not just 'stylelint'
    },
  },
}
```

### Order Commands Logically

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.ts': [
        'eslint --fix',      // 1. Fix lint issues
        'prettier --write',  // 2. Format code
        'tsc --noEmit',      // 3. Type check (after fixes)
      ],
    },
  },
}
```

### Handle All File Types

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      // Don't forget about config files and documentation
      '*.{json,yaml,yml}': 'prettier --write',
      '*.md': 'prettier --write',
      'Dockerfile': 'hadolint',
    },
  },
}
```

## Comparison with lint-staged

| Feature | bun-git-hooks | lint-staged |
|---------|---------------|-------------|
| Zero dependencies | Yes | No |
| Built-in to hooks | Yes | Requires husky |
| Bun optimized | Yes | No |
| Glob patterns | Yes | Yes |
| Command arrays | Yes | Yes |
| Parallel execution | No | Yes |
| Custom task runner | No | Yes |

## Next Steps

- Learn about all [Hook Types](/guide/hooks)
- Explore [Configuration Options](/config)
- Review [Troubleshooting](/advanced/troubleshooting)
