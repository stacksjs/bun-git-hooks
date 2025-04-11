<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# bun-git-hooks

> A Bun-optimized TypeScript library for managing Git hooks with a robust set of configuration options.

## Features

- 🎯 **Simple Configuration** _Easy setup through multiple config file formats_
- 🔄 **Automatic Installation** _Hooks are installed on package installation_
- 🛡️ **Type Safe** _Written in TypeScript with comprehensive type definitions_
- 🔧 **Flexible Config** _Supports `.ts`, `.js`, `.mjs`, `.json` configurations_
- 💪 **Robust** _Handles complex Git workspace configurations_
- 🚫 **Skip Option** _Environment variable to skip hook installation_
- 🧹 **Cleanup** _Optional cleanup of unused hooks_
- 📦 **Zero Dependencies** _Minimal footprint_
- ⚡ **Fast** _Built for Bun with performance in mind_
- 🔍 **Verbose Mode** _Detailed logging for troubleshooting_
- 🔀 **Staged Lint** _Run commands only on staged files that match specific patterns_

## Installation

```bash
bun add -D bun-git-hooks
```

## Usage

### Basic Configuration

Create a `git-hooks.config.{ts,js,mjs,cjs,mts,cts,json}` _(`git-hooks.ts` works too)_ file in your project root:

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

### JSON Configuration

```json
{
  "git-hooks": {
    "pre-commit": "bun run lint && bun run test",
    "commit-msg": "bun commitlint --edit $1",
    "pre-push": "bun run build"
  }
}
```

### CLI Usage

```bash
# Install hooks from config
git-hooks

# alternatively, trigger the CLI with bunx
bunx git-hooks
bunx bun-git-hooks

# Use specific config file
git-hooks ./custom-config.ts

# Remove all hooks
git-hooks uninstall

# Enable verbose logging
git-hooks --verbose

# Run staged lint for a specific hook manually
git-hooks run-staged-lint pre-commit
```

### Environment Variables

Skip hook installation when needed:

```bash
# Skip hook installation
SKIP_INSTALL_GIT_HOOKS=1 bun install

# Skip hook execution
SKIP_BUN_GIT_HOOKS=1 git commit -m "skipping hooks"

# Set custom environment for hooks
BUN_GIT_HOOKS_RC=/path/to/env git-hooks
```

### Advanced Configuration

```ts
export default {
  // Hook commands
  'pre-commit': 'bun run lint && bun run test',
  'commit-msg': 'bun commitlint --edit $1',

  // Preserve specific unused hooks
  'preserveUnused': ['post-merge', 'post-checkout'],

  // Configure multiple hooks
  'pre-push': [
    'bun run build',
    'bun run test:e2e'
  ].join(' && ')
}
```

### Staged Lint (Lint Only Changed Files)

You can run linters and formatters only on staged files that match specific patterns, similar to lint-staged. This is particularly useful in pre-commit hooks to ensure quality checks run only on the files being committed.

#### Configuration

Add a `stagedLint` property to your hook configuration:

```ts
// git-hooks.config.ts
export default {
  'pre-commit': {
    stagedLint: {
      '*.js': 'eslint --fix',
      '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
      '*.css': 'stylelint --fix',
      '*.md': 'prettier --write'
    }
  },
  'verbose': true
}
```

#### Manual CLI Usage

You can also run the staged lint manually using the CLI:

```bash
# Run staged lint for pre-commit
git-hooks run-staged-lint pre-commit

# Run with verbose output
git-hooks run-staged-lint pre-commit --verbose
```

#### Pattern Matching

For each file pattern, you can specify either a single command or an array of commands that will run in sequence. The commands will only receive the staged files that match the pattern.

For example:

```ts
// git-hooks.config.ts
export default {
  '*.{js,jsx}': 'eslint --fix', // Run eslint only on JavaScript files
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'], // Run eslint and then prettier on TypeScript files
  '*.css': 'stylelint --fix', // Run stylelint only on CSS files
  '*.md': 'prettier --write' // Run prettier only on Markdown files
}
```

The output will show which files are being processed and which tasks are being run:

```bash
$ git commit

❯ Running tasks for staged files...
  ❯ *.js — 2 files
    ⠼ eslint --fix
  ❯ *.{ts,tsx} — 3 files
    ⠹ eslint --fix
    ⠹ prettier --write
  ❯ *.css — 1 file
    ⠼ stylelint --fix
  ❯ *.md — no files [SKIPPED]
```

### Error Handling

The library provides clear error messages:

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

### TypeScript Support

Full TypeScript support with detailed type definitions:

```ts
interface GitHooksConfig {
  'pre-commit'?: string
  'pre-push'?: string
  'commit-msg'?: string
  'post-merge'?: string
  // ... other git hooks
  'preserveUnused'?: Array<string> | boolean
}

// Types are automatically inferred
const config: GitHooksConfig = {
  'pre-commit': 'bun run test',
  'preserveUnused': ['post-checkout']
}
```

## Testing

```bash
bun test
```

## Changelog

Please see our [releases](https://github.com/stackjs/bun-git-hooks/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/bun-git-hooks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

“Software that is free, but hopes for a postcard.” We love receiving postcards from around the world showing where `bun-git-hooks` is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Credits

Many thanks to [`simple-git-hooks`](https://github.com/toplenboren/simple-git-hooks) and its contributors for inspiring this project.

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/bun-git-hooks?style=flat-square
[npm-version-href]: https://npmjs.com/package/bun-git-hooks
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/bun-git-hooks/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/bun-git-hooks/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/bun-git-hooks/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/bun-git-hooks -->
