---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "bun-git-hooks"
  text: "Modern Git Hooks Management"
  tagline: A zero-dependency, type-safe tool for managing git hooks in Bun projects
  image:
    src: /images/logo-white.png
    alt: bun-git-hooks logo
  actions:
    - theme: brand
      text: Get Started
      link: /intro
    - theme: alt
      text: View on GitHub
      link: https://github.com/stacksjs/bun-git-hooks

features:
  - icon: 🎯
    title: Simple Configuration
    details: Configure your git hooks using TypeScript, JavaScript, or JSON. Supports multiple config formats for maximum flexibility.

  - icon: 🔄
    title: Automatic Installation
    details: Hooks are installed automatically during package installation. No manual setup required.

  - icon: 🛡️
    title: Type Safe
    details: Written in TypeScript with comprehensive type definitions. Get full IDE support and catch errors early.

  - icon: 📦
    title: Zero Dependencies
    details: Lightweight and fast. No external dependencies to slow you down or create security risks.

  - icon: ⚡
    title: Bun Optimized
    details: Built specifically for Bun with performance in mind. Takes advantage of Bun's speed and features.

  - icon: 🔧
    title: Flexible & Powerful
    details: Support for all git hooks, environment variables, and advanced configuration options.

---

## Quick Start

```bash
# Install the package
bun add -D bun-git-hooks

# Create a configuration file
cat > git-hooks.config.ts << EOL
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': 'bun run lint && bun run test',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',
}

export default config
EOL

# Hooks are automatically installed!
```

## Why bun-git-hooks?

- 🎯 **Simple Yet Powerful**: Easy to set up, but packed with features
- 🔄 **Team Friendly**: Automatically install hooks for all team members
- 🛡️ **Type Safe**: Full TypeScript support with great IDE integration
- 📦 **Zero Dependencies**: Minimal footprint in your project
- ⚡ **Fast**: Built for Bun with performance in mind
- 🔧 **Flexible**: Multiple configuration formats and options

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

## Popular Use Cases

```ts
// Lint and test before commits
'pre-commit': 'bun run lint && bun run test'

// Validate commit messages
'commit-msg': 'bun commitlint --edit $1'

// Build and test before pushing
'pre-push': 'bun run build && bun run test:e2e'

// Update dependencies after checkout
'post-checkout': 'bun install'

// Run security checks before push
'pre-push': 'bun run security:check'

// Format code before commit
'pre-commit': 'bun run format && bun run lint'
```

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

## Community

Join our community to get help, share ideas, and contribute:

- 📖 [Documentation](/intro)
- 💬 [Discord Chat](https://discord.gg/stacksjs)
- 🐙 [GitHub Discussions](https://github.com/stacksjs/bun-git-hooks/discussions)
- 🐦 [Twitter Updates](https://twitter.com/stacksjs)

## Support

If you find this project useful, please consider:

- ⭐ [Starring the repository](https://github.com/stacksjs/bun-git-hooks)
- 🤝 [Contributing](https://github.com/stacksjs/bun-git-hooks/blob/main/.github/CONTRIBUTING.md)
- 💙 [Becoming a sponsor](https://github.com/sponsors/stacksjs)

## License

[MIT License](https://github.com/stacksjs/bun-git-hooks/blob/main/LICENSE.md) © 2024-present [Stacks.js](https://github.com/stacksjs)

<Home />
