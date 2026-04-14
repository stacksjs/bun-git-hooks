---
title: Hook Types
description: Complete guide to all Git hook types supported by bun-git-hooks
---
  const currentMsg = await Bun.file(commitMsgFile).text()
  if (!currentMsg.includes(issueMatch[1])) {
    await Bun.write(commitMsgFile, `[${issueMatch[1]}] ${currentMsg}`)
  }
}
```

### commit-msg

Runs after the commit message is entered. Used to validate commit messages.

```typescript
const config: GitHooksConfig = {
  'commit-msg': 'bunx gitlint --edit $1',
}
```

**Use cases:**

- Enforce commit message format (conventional commits)
- Check for required prefixes
- Validate message length

**Example with commitlint:**

```bash

# Install commitlint

bun add -D @commitlint/cli @commitlint/config-conventional
```

```typescript
// commitlint.config.ts
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'test', 'chore', 'perf', 'ci', 'build',
    ]],
    'subject-case': [2, 'always', 'lower-case'],
  },
}
```

### post-commit

Runs after a commit is created. Used for notifications or cleanup.

```typescript
const config: GitHooksConfig = {
  'post-commit': 'echo "Commit created successfully!"',
}
```

**Use cases:**

- Send notifications
- Update local documentation
- Trigger builds

### pre-push

Runs before pushing to a remote. This is where you run expensive checks.

```typescript
const config: GitHooksConfig = {
  'pre-push': 'bun run build && bun run test:e2e',
}
```

**Use cases:**

- Run full test suite
- Build and verify project
- Check for uncommitted changes
- Verify branch naming conventions

**Example with branch protection:**

```typescript
// git-hooks.config.ts
const config: GitHooksConfig = {
  'pre-push': 'bun run scripts/pre-push.ts',
}
```

```typescript
// scripts/pre-push.ts
const branch = await Bun.$`git branch --show-current`.text()

// Prevent direct push to main/master
if (['main', 'master'].includes(branch.trim())) {
  console.error('Cannot push directly to main/master!')
  process.exit(1)
}

// Run tests
await Bun.$`bun run test`
await Bun.$`bun run build`
```

### post-checkout

Runs after `git checkout` or `git switch`.

```typescript
const config: GitHooksConfig = {
  'post-checkout': 'bun install',
}
```

**Use cases:**

- Install dependencies when switching branches
- Clean build artifacts
- Update environment files

### post-merge

Runs after a successful merge.

```typescript
const config: GitHooksConfig = {
  'post-merge': 'bun install',
}
```

**Use cases:**

- Install new dependencies
- Run database migrations
- Clean caches

### pre-rebase

Runs before `git rebase` starts.

```typescript
const config: GitHooksConfig = {
  'pre-rebase': 'bun run scripts/check-clean.ts',
}
```

**Use cases:**

- Ensure working directory is clean
- Prevent rebase on protected branches

### post-rewrite

Runs after commands that rewrite commits (rebase, amend).

```typescript
const config: GitHooksConfig = {
  'post-rewrite': 'bun run scripts/post-rewrite.ts',
}
```

**Use cases:**

- Update dependent branches
- Re-run tests on rewritten commits

## Server-Side Hooks

These hooks run on the server (rarely used in local development):

### pre-receive

Runs on the remote when receiving a push.

### update

Runs once per branch being updated.

### post-receive

Runs after the entire receive process completes.

## All Supported Hooks

Here's the complete list of hooks you can configure:

```typescript
interface GitHooksConfig {
  // Client-side hooks
  'pre-commit'?: string | StagedLintConfig
  'prepare-commit-msg'?: string
  'commit-msg'?: string
  'post-commit'?: string
  'pre-rebase'?: string
  'post-checkout'?: string
  'post-merge'?: string
  'pre-push'?: string
  'post-rewrite'?: string

  // Server-side hooks
  'pre-receive'?: string
  'update'?: string
  'post-receive'?: string
  'post-update'?: string
  'pre-auto-gc'?: string
  'push-to-checkout'?: string

  // Configuration options
  'preserveUnused'?: boolean | string[]
  'verbose'?: boolean
}
```

## Hook Arguments

Some hooks receive arguments that you can use:

| Hook | Arguments |
|------|-----------|
| `commit-msg` | `$1` = path to commit message file |
| `prepare-commit-msg` | `$1` = path to commit message, `$2` = source type, `$3` = SHA-1 (if amend) |
| `pre-push` | `$1` = remote name, `$2` = remote URL |
| `post-checkout` | `$1` = previous HEAD, `$2` = new HEAD, `$3` = branch flag |
| `post-merge` | `$1` = squash flag |
| `pre-rebase` | `$1` = upstream, `$2` = rebased branch |

**Example using arguments:**

```typescript
const config: GitHooksConfig = {
  'commit-msg': 'bunx gitlint --edit $1',
  'pre-push': 'echo "Pushing to $1 ($2)" && bun run test',
}
```

## Combining Multiple Commands

### Sequential Execution

Use `&&` for commands that must all succeed:

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint && bun run test && bun run typecheck',
}
```

### Independent Commands

Use `; ` for commands that can run independently:

```typescript
const config: GitHooksConfig = {
  'post-commit': 'echo "Committed!"; bun run notify || true',
}
```

### Script Files

For complex logic, use script files:

```typescript
const config: GitHooksConfig = {
  'pre-commit': 'bun run scripts/pre-commit.ts',
}
```

```typescript
// scripts/pre-commit.ts
import { $ } from 'bun'

// Run lint
const lintResult = await $`bun run lint`.nothrow()
if (lintResult.exitCode !== 0) {
  console.error('Lint failed!')
  process.exit(1)
}

// Run tests
const testResult = await $`bun run test`.nothrow()
if (testResult.exitCode !== 0) {
  console.error('Tests failed!')
  process.exit(1)
}

console.log('All checks passed!')
```

## Best Practices

### Keep Pre-commit Fast

Pre-commit runs on every commit, so keep it fast:

```typescript
const config: GitHooksConfig = {
  // Fast: only check staged files
  'pre-commit': {
    stagedLint: {
      '*.ts': 'eslint --fix',
    },
  },

  // Slow checks go to pre-push
  'pre-push': 'bun run test:all && bun run build',
}
```

### Provide Escape Hatches

Document how to skip hooks for emergencies:

```bash

# Skip all hooks

SKIP*BUN*GIT_HOOKS=1 git commit -m "emergency fix"

# Skip specific hook

git commit --no-verify -m "emergency fix"
```

### Use Meaningful Exit Codes

Exit with non-zero to prevent the Git action:

```typescript
// scripts/check-branch.ts
const branch = await Bun.$`git branch --show-current`.text()

if (branch.trim() === 'main') {
  console.error('Cannot commit directly to main!')
  process.exit(1) // Prevents commit
}

process.exit(0) // Allows commit
```

## Next Steps

- Learn about [Staged File Linting](/guide/staged)
- Explore [Configuration Options](/config)
- Review [Troubleshooting](/advanced/troubleshooting)
