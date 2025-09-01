# Usage Guide

## Installation

```bash
bun add -D bun-git-hooks
```

## Basic Usage

### Configuration File

Create a `git-hooks.config.{ts,js,mjs,cjs,json}` file in your project root:

```ts
// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  // Note: stagedLint is only available in preCommit hook
  'preCommit': {
    'stagedLint': {
      '*.{js,ts}': 'bunx --bun eslint . --fix',
      '*.{css,scss}': 'stylelint --fix'
    }
  },
  'commitMsg': 'bun commitlint --edit $1',
  'prePush': 'bun run build',
  'verbose': true,
}

export default config
```

### Package.json Configuration

You can also use JSON format in your `package.json`:

```json
{
  "git-hooks": {
    "preCommit": {
      "stagedLint": {
        "*.{js,ts}": "bunx --bun eslint . --fix",
        "*.{css,scss}": "stylelint --fix"
      }
    },
    "commitMsg": "bun commitlint --edit $1",
    "prePush": "bun run build"
  }
}
```

## CLI Commands

```bash
# Install hooks from config
git-hooks

# Use specific config file
git-hooks ./custom-config.ts

# Remove all hooks
git-hooks uninstall
git-hooks remove  # alias

# Enable verbose logging
git-hooks --verbose

# Run staged lint for pre-commit hook
git-hooks run-staged-lint pre-commit
```

## Staged Lint Usage

The `stagedLint` feature is only available in the preCommit hook. It allows you to run specific commands on staged files matching certain patterns. This is more efficient than running commands on all files.

### Basic Staged Lint

```ts
const config: GitHooksConfig = {
  'preCommit': {
    'stagedLint': {
      // Run ESLint on JavaScript and TypeScript files
      '*.{js,ts}': 'bunx --bun eslint . --fix',

      // Run Stylelint on CSS and SCSS files
      '*.{css,scss}': 'stylelint --fix'
    }
  }
}
```

### Multiple Commands

You can run multiple commands on the same file pattern:

```ts
const config: GitHooksConfig = {
  'preCommit': {
    'stagedLint': {
      // Run both ESLint and Prettier on TypeScript files
      '*.{ts,tsx}': [
        'eslint . --fix',
        'prettier --write'
      ]
    }
  }
}
```

## Environment Variables

### SKIP_INSTALL_GIT_HOOKS

Skip hook installation during package installation:

```bash
# Skip hook installation
SKIP_INSTALL_GIT_HOOKS=1 bun install
```

### SKIP_BUN_GIT_HOOKS

Skip hook execution for a specific git command:

```bash
# Skip hook execution
SKIP_BUN_GIT_HOOKS=1 git commit -m "skipping hooks"
```

### BUN_GIT_HOOKS_RC

Set custom environment for hooks:

```bash
# Set custom environment
BUN_GIT_HOOKS_RC=/path/to/env git-hooks
```

## Advanced Usage

### Multiple Commands in a Hook

You can combine multiple commands in a single hook:

```ts
const config: GitHooksConfig = {
  // Using && operator
  'preCommit': 'bun run lint && bun run test && bun run build',

  // Using array join for better readability
  'prePush': [
    'bun run build',
    'bun run test:e2e',
    'bun run deploy'
  ].join(' && ')
}
```

### Preserving Specific Hooks

You can preserve specific hooks while removing others:

```ts
const config: GitHooksConfig = {
  'preCommit': 'bun run lint && bun run test',

  // Preserve these hooks even if not configured
  'preserveUnused': ['postMerge', 'postCheckout']
}
```

## Available Git Hooks

The following git hooks are supported:

- `preCommit`: Run before committing (supports stagedLint)
- `prepareCommitMsg`: Run before the commit message editor is opened
- `commitMsg`: Run to verify commit message
- `postCommit`: Run after committing
- `prePush`: Run before pushing
- `postCheckout`: Run after checking out a branch
- `preRebase`: Run before rebasing
- `postMerge`: Run after merging
- `postRewrite`: Run after commands that rewrite commits
- `preAutoGc`: Run before garbage collection

## Error Handling

The library provides clear error messages and proper error handling:

```ts
try {
  await setHooksFromConfig()
}
catch (err) {
  if (err.message.includes('Config was not found')) {
    console.error('Missing configuration file')
  }
  else if (err.message.includes('git root')) {
    console.error('Not a Git repository')
  }
  else if (err.message.includes('stagedLint is only allowed in preCommit hook')) {
    console.error('stagedLint can only be used in preCommit hook')
  }
}
```

## TypeScript Support

Full TypeScript support with detailed type definitions:

```ts
interface GitHooksConfig {
  'preCommit'?: string | {
    'stagedLint'?: {
      [pattern: string]: string | string[]
    }
  }
  'prePush'?: string
  'commitMsg'?: string
  'postMerge'?: string
  // ... other git hooks
  'preserveUnused'?: Array<string> | boolean
  'verbose'?: boolean
}
```

## Testing Your Hooks

To test if your hooks are working:

1. Make a change to your codebase
2. Try to commit the change:

```bash
git add .
git commit -m "test: checking if hooks work"
```

1. Your preCommit hook should run staged linting on the changed files
2. Your commitMsg hook should validate the message
3. When pushing, your prePush hook should run

If you need to bypass hooks temporarily:

```bash
SKIP_BUN_GIT_HOOKS=1 git commit -m "bypass: temporary commit"
```
