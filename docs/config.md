# Configuration Guide

`bun-git-hooks` supports multiple configuration formats and options to suit your needs.

## Configuration Files

You can configure your git hooks using any of these file formats:

1. TypeScript (recommended):
   - `.git-hooks.config.ts`
   - `git-hooks.config.ts`

2. JavaScript:
   - `.git-hooks.config.js`
   - `git-hooks.config.js`
   - `.git-hooks.config.mjs`
   - `git-hooks.config.mjs`
   - `.git-hooks.config.cjs`
   - `git-hooks.config.cjs`

3. JSON:
   - `.git-hooks.config.json`
   - `git-hooks.config.json`
   - `package.json` (using "git-hooks" key)

## Basic Configuration

### TypeScript Configuration

```ts
// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  // Note: staged-lint is only available in pre-commit hook
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts}': 'bunx --bun eslint . --fix',
      '*.{css,scss}': 'stylelint --fix'
    }
  },
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',

  // Optional settings
  'verbose': true, // Enable verbose logging
  'preserveUnused': false, // Remove unused hooks (default)
}

export default config
```

### Package.json Configuration

```json
{
  "git-hooks": {
    "pre-commit": {
      "staged-lint": {
        "*.{js,ts}": "bunx --bun eslint . --fix",
        "*.{css,scss}": "stylelint --fix"
      }
    },
    "commit-msg": "bun commitlint --edit $1",
    "pre-push": "bun run build"
  }
}
```

## Configuration Options

### Hook Commands

Any valid git hook can be configured with either a command string or a staged-lint configuration (pre-commit only):

```ts
const config: GitHooksConfig = {
  // Simple command
  'pre-commit': 'bun run lint',

  // Staged lint configuration (pre-commit only)
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts}': 'bunx --bun eslint . --fix',
      '*.{css,scss}': 'stylelint --fix'
    }
  }
}
```

### Staged Lint Configuration

The `staged-lint` feature is only available in the pre-commit hook. It allows you to run specific commands on staged files matching certain patterns:

```ts
const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      // Run ESLint on JavaScript and TypeScript files
      '*.{js,ts}': 'bunx --bun eslint . --fix',

      // Run Stylelint on CSS and SCSS files
      '*.{css,scss}': 'stylelint --fix',

      // Run multiple commands on TypeScript files
      '*.{ts,tsx}': [
        'eslint . --fix',
        'prettier --write'
      ],

      // Run Prettier on Markdown files
      '*.md': 'prettier --write'
    }
  }
}
```

### Global Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `verbose` | `boolean` | `false` | Enable verbose logging |
| `preserveUnused` | `boolean \| string[]` | `false` | Preserve unused hooks or specify hooks to preserve |

## Advanced Configuration

### Hook Command Arguments

Some hooks receive arguments from Git that you can use in your commands:

```ts
const config: GitHooksConfig = {
  // $1 is the commit message file path
  'commit-msg': 'bun commitlint --edit $1',

  // $1 is the previous HEAD, $2 is the new HEAD
  'post-checkout': 'bun run update-deps $1 $2',
}
```

### Preserving Specific Hooks

```ts
const config: GitHooksConfig = {
  'pre-commit': 'bun run lint',

  // Keep specific hooks when cleaning up
  'preserveUnused': ['post-merge', 'post-checkout'],
}
```

### Multiple Commands

```ts
const config: GitHooksConfig = {
  // Multiple commands with &&
  'pre-commit': 'bun run lint && bun run test && bun run build',

  // Or using array join for better readability
  'pre-push': [
    'bun run build',
    'bun run test:e2e',
    'bun run deploy'
  ].join(' && ')
}
```

## Environment Variables

The following environment variables can override configuration:

- `SKIP_INSTALL_GIT_HOOKS`: Skip hook installation (values: "1", "true")
- `SKIP_BUN_GIT_HOOKS`: Skip hook execution (values: "1", "true")
- `BUN_GIT_HOOKS_RC`: Path to custom environment file

## Configuration Resolution

The configuration is resolved in the following order:

1. Command line specified config file
2. `.git-hooks.config.{ts,js,mjs,cjs,json}`
3. `git-hooks.config.{ts,js,mjs,cjs,json}`
4. `package.json` ("git-hooks" key)

If no configuration is found, an error will be thrown.

## Best Practices

1. **Use TypeScript Configuration**: Get better type checking and IDE support
2. **Keep Hooks Focused**: Each hook should have a specific purpose
3. **Use Environment Variables**: For flexibility in different environments
4. **Preserve Critical Hooks**: Use `preserveUnused` for important custom hooks
5. **Enable Verbose Mode**: When debugging hook issues
6. **Use Exit Codes**: Hooks should exit with non-zero for failures
7. **Use Staged Lint**: For efficient file-specific linting (pre-commit only)
8. **Follow Restrictions**: Remember that staged-lint is only available in pre-commit hook
