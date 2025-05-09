# API Reference

This page contains the API reference for `bun-git-hooks`. It documents all the types, interfaces, and configurations available in the package.

## Configuration Types

### GitHooksConfig

The main configuration type for the package. It defines the structure of your git hooks configuration.

```ts
type GitHooksConfig = {
  // Git hook configurations
  [hookName in GitHook]?: string | {
    'stagedLint'?: StagedLintConfig
    'staged-lint'?: StagedLintConfig
  }
} & {
  // Global options
  'preserveUnused'?: boolean | GitHook[]
  'verbose'?: boolean
  'staged-lint'?: StagedLintConfig
}
```

#### Properties

- **[hookName]**: Configuration for individual git hooks
  - Type: `string | { stagedLint?: StagedLintConfig, 'staged-lint'?: StagedLintConfig }`
  - Optional
  - Example: `'pre-commit': 'bun run lint'`

- **preserveUnused**
  - Type: `boolean | GitHook[]`
  - Optional
  - Description: Specifies which hooks should not be managed by bun-git-hooks
  - Example: `preserveUnused: ['post-checkout', 'post-merge']`

- **verbose**
  - Type: `boolean`
  - Optional
  - Description: Enables verbose logging
  - Default: `false`

- **staged-lint**
  - Type: `StagedLintConfig`
  - Optional
  - Description: Global staged linting configuration

### StagedLintConfig

Configuration for staged file linting.

```ts
interface StagedLintConfig {
  [pattern: string]: StagedLintTask
}

type StagedLintTask = string | string[]
```

#### Properties

- **[pattern]**: Git-style glob pattern for matching files
  - Type: `string | string[]`
  - Description: Command(s) to run on matched files
  - Example: `'*.ts': 'eslint --fix'`

## Supported Git Hooks

The following Git hooks are supported:

- `pre-commit`: Run before committing
- `prepare-commit-msg`: Run before the commit message editor is launched
- `commit-msg`: Run after the commit message is saved
- `post-commit`: Run after the commit is created
- `pre-push`: Run before pushing commits
- `post-checkout`: Run after checking out a branch
- `pre-rebase`: Run before rebasing
- `post-merge`: Run after merging
- `post-rewrite`: Run after commands that rewrite commits
- `pre-auto-gc`: Run before garbage collection

## Environment Variables

### Configuration Variables

- `SKIP_BUN_GIT_HOOKS`
  - Type: `string`
  - Description: Skip hook execution when set to "1"
  - Example: `SKIP_BUN_GIT_HOOKS=1 git commit -m "quick fix"`

- `BUN_GIT_HOOKS_RC`
  - Type: `string`
  - Description: Path to custom initialization script
  - Example: `BUN_GIT_HOOKS_RC=/path/to/init.sh`

- `SKIP_INSTALL_GIT_HOOKS`
  - Type: `string`
  - Description: Skip hook installation when set to "1"
  - Example: `SKIP_INSTALL_GIT_HOOKS=1 bun install`

## Configuration File

The configuration can be defined in any of these files:

```bash
git-hooks.config.ts    # TypeScript (recommended)
git-hooks.config.js    # JavaScript
git-hooks.config.mjs   # ES Modules
git-hooks.config.cjs   # CommonJS
git-hooks.config.json  # JSON
```

Or in `package.json`:

```json
{
  "gitHooks": {
    "pre-commit": "bun run lint"
  }
}
```

## Examples

### Basic Configuration

```ts
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run test'
}
```

### Advanced Configuration with Staged Linting

```ts
const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts}': ['eslint --fix', 'prettier --write'],
      '*.{css,scss}': 'stylelint --fix'
    }
  },
  'verbose': true,
  'preserveUnused': ['post-checkout']
}
```

### Dynamic Configuration

```ts
const config: GitHooksConfig = {
  'pre-commit': process.env.CI
    ? 'bun run test:ci'
    : {
        'staged-lint': {
          '*.ts': 'eslint --fix'
        }
      },
  'verbose': !process.env.CI
}
```
