---
title: Getting Started with bun-git-hooks
description: Learn how to set up and use bun-git-hooks for managing Git hooks in your Bun projects
---

```typescript
// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',
  'verbose': true,
}

export default config
```

### JavaScript

```javascript
// git-hooks.config.js
export default {
  'pre-commit': 'bun run lint',
  'commit-msg': 'bun commitlint --edit $1',
}
```

### JSON

```json
// git-hooks.config.json
{
  "pre-commit": "bun run lint",
  "commit-msg": "bun commitlint --edit $1"
}
```

### Package.json

```json
// package.json
{
  "name": "my-project",
  "git-hooks": {
    "pre-commit": "bun run lint",
    "commit-msg": "bun commitlint --edit $1"
  }
}
```

## Basic Hook Configuration

### Single Command

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',
}
```

### Multiple Commands

Chain multiple commands with `&&`:

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint && bun run test && bun run typecheck',
  'pre-push': 'bun run build && bun run test:e2e',
}
```

### With Staged File Linting

Run linters only on staged files (pre-commit only):

```typescript
const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.{js,ts,jsx,tsx}': 'eslint --fix',
      '*.{css,scss}': 'stylelint --fix',
      '*.md': 'prettier --write',
    },
  },
}
```

## Verbose Mode

Enable verbose logging for debugging:

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',
  'verbose': true,
}
```

## Skipping Hooks

### Skip Temporarily

```bash

# Skip hooks for a single command

SKIP*BUN*GIT*HOOKS=1 git commit -m "wip: work in progress"
```

### Skip Installation

```bash

# Skip hook installation during bun install

SKIP*INSTALL*GIT*HOOKS=1 bun install
```

## Preserving Existing Hooks

If you have existing hooks you want to keep:

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',
  'preserveUnused': ['post-merge', 'post-checkout'],
}
```

Or preserve all existing hooks:

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',
  'preserveUnused': true,
}
```

## CLI Usage

### Install Hooks

```bash

# Install hooks from config

bunx git-hooks

# Use specific config file

bunx git-hooks ./custom-config.ts

# Enable verbose logging

bunx git-hooks --verbose
```

### Uninstall Hooks

```bash

# Remove all hooks

bunx git-hooks uninstall
```

### Run Staged Lint Manually

```bash

# Run staged lint for pre-commit

bunx git-hooks run-staged-lint pre-commit
```

## Project Setup Example

Complete example for a typical project:

```typescript
// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  // Run linters on staged files before commit
  'pre-commit': {
    stagedLint: {
      '*.{js,ts,jsx,tsx}': ['eslint --fix', 'prettier --write'],
      '*.{css,scss}': 'stylelint --fix',
      '*.json': 'prettier --write',
      '*.md': 'prettier --write',
    },
  },

  // Validate commit message format
  'commit-msg': 'bunx gitlint --edit $1',

  // Build and test before pushing
  'pre-push': 'bun run build && bun run test',

  // Update deps after checkout/merge
  'post-checkout': 'bun install',
  'post-merge': 'bun install',

  // Enable verbose logging
  'verbose': true,
}

export default config
```

Add to your `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "bun test",
    "build": "bun run build.ts",
    "postinstall": "bunx git-hooks"
  }
}
```

## Troubleshooting

### Hooks Not Running

1. Check if hooks are installed:

```bash
ls -la .git/hooks/
```

2. Verify config file exists and is valid:

```bash
bunx git-hooks --verbose
```

3. Make sure Git is initialized:

```bash
git status
```

### Permission Issues

On Unix systems, ensure hooks are executable:

```bash
chmod +x .git/hooks/*
```

### Config Not Found

bun-git-hooks looks for config in this order:

1. `git-hooks.config.ts`
2. `git-hooks.config.js`
3. `git-hooks.config.mjs`
4. `git-hooks.config.cjs`
5. `git-hooks.config.json`
6. `git-hooks.ts`
7. `package.json` (`git-hooks` field)

## Next Steps

- Learn about all [Hook Types](/guide/hooks)
- Set up [Staged File Linting](/guide/staged)
- Explore [Configuration Options](/config)
