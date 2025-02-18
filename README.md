<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# bun-git-hooks

> A Bun-optimized TypeScript library for managing Git hooks with a robust set of configuration options.

## Features

- 🎯 **Simple Configuration**: Easy setup through multiple config file formats
- 🔄 **Automatic Installation**: Hooks are installed on package installation
- 🛡️ **Type Safe**: Written in TypeScript with comprehensive type definitions
- 🔧 **Flexible Config**: Supports `.ts`, `.js`, `.mjs`, `.json` configurations
- 💪 **Robust**: Handles complex Git workspace configurations
- 🚫 **Skip Option**: Environment variable to skip hook installation
- 🧹 **Cleanup**: Optional cleanup of unused hooks
- 📦 **Zero Dependencies**: Minimal footprint
- ⚡ **Fast**: Built for Bun with performance in mind
- 🔍 **Verbose Mode**: Detailed logging for troubleshooting

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
