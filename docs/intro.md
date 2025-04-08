# bun-git-hooks

> A modern, zero-dependency tool for managing git hooks in Bun projects with a robust set of configuration options.

<p align="center"><img src="https://github.com/stacksjs/bun-git-hooks/blob/main/.github/art/cover.jpg?raw=true" alt="Social Card of bun-git-hooks"></p>

## Introduction

`bun-git-hooks` is a powerful tool designed to simplify git hooks management in your Bun projects. It provides a type-safe, flexible way to configure and manage your git hooks with minimal setup.

## Key Features

- 🎯 **Simple Configuration**: Easy setup through multiple config file formats
- 🔄 **Automatic Installation**: Hooks are installed automatically during package installation
- 🛡️ **Type Safe**: Written in TypeScript with comprehensive type definitions
- 🔧 **Flexible Config**: Supports `.ts`, `.js`, `.mjs`, `.json` configurations
- 💪 **Robust**: Handles complex Git workspace configurations
- 🚫 **Skip Option**: Environment variables to skip hook installation or execution
- 🧹 **Cleanup**: Optional cleanup of unused hooks
- 📦 **Zero Dependencies**: Minimal footprint
- ⚡ **Fast**: Built for Bun with performance in mind
- 🔍 **Verbose Mode**: Detailed logging for troubleshooting

## Why bun-git-hooks?

Git hooks are powerful tools for automating tasks in your development workflow, but they can be challenging to manage and distribute across a team. `bun-git-hooks` solves this by:

1. **Simplifying Configuration**: Use TypeScript/JavaScript/JSON to define your hooks
2. **Ensuring Consistency**: Automatically install hooks for all team members
3. **Providing Flexibility**: Skip hooks when needed with environment variables
4. **Type Safety**: Get IDE autocompletion and type checking for your configurations

## Quick Start

1. Install the package:

```bash
bun add -D bun-git-hooks
```

2. Create a configuration file (e.g., `git-hooks.config.ts`):

```ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': 'bun run lint && bun run test',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',
  'verbose': true,
}

export default config
```

3. The hooks will be automatically installed when you run `bun install`

## Configuration Options

### Supported Config Files

- `git-hooks.config.ts` (TypeScript)
- `git-hooks.config.js` (JavaScript)
- `git-hooks.config.cjs` (CommonJS)
- `git-hooks.config.json` (JSON)
- `package.json` (with `gitHooks` field)

### Environment Variables

- `SKIP_BUN_GIT_HOOKS`: Set to "1" to skip hook execution
- `BUN_GIT_HOOKS_RC`: Path to initialization script
- `SKIP_INSTALL_GIT_HOOKS`: Set to "1" to skip hook installation

## Advanced Features

### Custom Initialization Scripts

Create a `.git-hooks.rc` file to set up environment variables or perform custom initialization:

```bash
#!/bin/bash
export NODE_ENV=development
export CUSTOM_VAR=value
```

### Skip Hooks Temporarily

```bash
# Skip hooks for a single command
SKIP_BUN_GIT_HOOKS=1 git commit -m "message"

# Skip hook installation
SKIP_INSTALL_GIT_HOOKS=1 bun install
```

## Troubleshooting

### Common Issues

1. **Hooks not installing**
   - Ensure `bun-git-hooks` is in your `devDependencies`
   - Check if `SKIP_INSTALL_GIT_HOOKS` is not set to "1"
   - Verify your configuration file is valid

2. **Hooks not executing**
   - Check if `SKIP_BUN_GIT_HOOKS` is not set to "1"
   - Verify hook scripts have execute permissions
   - Enable verbose mode in config for detailed logs

3. **TypeScript configuration issues**
   - Ensure you're using the correct type imports
   - Check your `tsconfig.json` includes the package types

## Stargazers

[![Stargazers over time](https://starchart.cc/stacksjs/bun-git-hooks.svg?variant=adaptive)](https://starchart.cc/stacksjs/bun-git-hooks)

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/bun-git-hooks/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

Two things are true: Stacks OSS will always stay open-source, and we do love to receive postcards from wherever Stacks is used! 🌍

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/rpx/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/rpx -->
