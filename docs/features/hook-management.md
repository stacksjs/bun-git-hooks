# Hook Management

bun-git-hooks provides a powerful system for managing Git hooks with automatic installation, configuration, and lifecycle management.

## Supported Hooks

All standard Git hooks are supported:

- `preCommit`
- `prepareCommitMsg`
- `commitMsg`
- `postCommit`
- `prePush`
- `postCheckout`
- `preRebase`
- And [many more](https://git-scm.com/docs/githooks)

## Configuration

### Basic Hook Setup

```ts
const config: GitHooksConfig = {
  preCommit: 'bun run lint',
  commitMsg: 'bun commitlint --edit $1',
  prePush: 'bun run test'
}
```

### Advanced Hook Configuration

```ts
const config: GitHooksConfig = {
  // Hook with staged linting
  preCommit: {
    stagedLint: {
      '*.ts': 'eslint --fix'
    }
  },

  // Simple command hook
  commitMsg: 'bun commitlint --edit $1',

  // Preserve specific unused hooks
  preserveUnused: ['postCheckout', 'postMerge'],

  // Enable verbose logging
  verbose: true
}
```

## Features

### 🔄 Automatic Installation

Hooks are automatically installed when:

- The package is installed via `bun install`
- The configuration file is updated
- The project is cloned by a new team member

### 🛡️ Hook Protection

- Prevents accidental hook overwrites
- Maintains hook permissions
- Preserves custom hooks when configured

### ⚡ Performance

- Minimal overhead on Git operations
- Efficient hook execution
- Smart caching of configurations

## Environment Variables

### Environment Configuration

```bash
# Skip hook execution
SKIP_BUN_GIT_HOOKS=1

# Custom initialization script
BUN_GIT_HOOKS_RC=/path/to/init.sh

# Skip hook installation
SKIP_INSTALL_GIT_HOOKS=1
```

### Usage Examples

```bash
# Skip hooks for a single commit
SKIP_BUN_GIT_HOOKS=1 git commit -m "quick fix"

# Skip installation during package install
SKIP_INSTALL_GIT_HOOKS=1 bun install
```

## Best Practices

1. **Keep Hooks Fast**: Long-running hooks can frustrate developers
2. **Use Staged Linting**: Only process changed files when possible
3. **Enable Verbose Mode**: When debugging hook issues
4. **Preserve Custom Hooks**: Use `preserveUnused` for manual hooks

## Examples

### Development Workflow

```ts
const config: GitHooksConfig = {
  // Quality checks before commit
  preCommit: {
    stagedLint: {
      '*.{js,ts}': 'eslint --fix',
      '*.{css,scss}': 'stylelint --fix'
    }
  },

  // Validate commit messages
  commitMsg: 'bun commitlint --edit $1',

  // Run tests before push
  prePush: 'bun run test',

  // Update dependencies after branch switch
  postCheckout: 'bun install',

  // Verbose output for debugging
  verbose: true
}
```

### Production Safeguards

```ts
const config: GitHooksConfig = {
  // Comprehensive checks before commit
  preCommit: [
    'bun run lint',
    'bun run test:unit',
    'bun run build'
  ],

  // Prevent direct commits to main
  prePush: 'bash scripts/prevent-main-push.sh',

  // Run security checks
  preCommit: 'bun run security:audit'
}
```
