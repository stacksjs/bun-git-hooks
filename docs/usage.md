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
  'pre-commit': 'bun run lint && bun run test',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',
  'verbose': true,
}

export default config
```

### Package.json Configuration

You can also use JSON format in your `package.json`:

```json
{
  "git-hooks": {
    "pre-commit": "bun run lint && bun run test",
    "commit-msg": "bun commitlint --edit $1",
    "pre-push": "bun run build"
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
  'pre-commit': 'bun run lint && bun run test && bun run build',

  // Using array join for better readability
  'pre-push': [
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
  'pre-commit': 'bun run lint && bun run test',

  // Preserve these hooks even if not configured
  'preserveUnused': ['post-merge', 'post-checkout']
}
```

## Available Git Hooks

The following git hooks are supported:

- `pre-commit`: Run before committing
- `prepare-commit-msg`: Run before the commit message editor is opened
- `commit-msg`: Run to verify commit message
- `post-commit`: Run after committing
- `pre-push`: Run before pushing
- `post-merge`: Run after merging
- `post-checkout`: Run after checking out
- `pre-rebase`: Run before rebasing
- `post-rewrite`: Run after rewriting commits

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
}
```

## TypeScript Support

Full TypeScript support with detailed type definitions:

```ts
interface GitHooksConfig {
  'pre-commit'?: string
  'pre-push'?: string
  'commit-msg'?: string
  'post-merge'?: string
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

3. Your pre-commit hook should run
4. Your commit-msg hook should validate the message
5. When pushing, your pre-push hook should run

If you need to bypass hooks temporarily:

```bash
SKIP_BUN_GIT_HOOKS=1 git commit -m "bypass: temporary commit"
```
