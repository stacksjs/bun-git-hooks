# Installation

Installing `bun-git-hooks` is straightforward. You can install it using your preferred package manager or download the binary directly.

## Package Managers

Choose your package manager of choice:

::: code-group

```sh [bun]
bun add -D bun-git-hooks
```

```sh [npm]
npm install --save-dev bun-git-hooks
```

```sh [pnpm]
pnpm add -D bun-git-hooks
```

```sh [yarn]
yarn add -D bun-git-hooks
```

:::

## Binary Installation

You can also install `bun-git-hooks` as a binary. Choose the binary that matches your platform and architecture:

::: code-group

```sh [macOS (arm64)]
# Download the binary
curl -L https://github.com/stacksjs/bun-git-hooks/releases/latest/download/bun-git-hooks-darwin-arm64 -o bun-git-hooks

# Make it executable
chmod +x bun-git-hooks

# Move it to your PATH
mv bun-git-hooks /usr/local/bin/bun-git-hooks
```

```sh [macOS (x64)]
# Download the binary
curl -L https://github.com/stacksjs/bun-git-hooks/releases/latest/download/bun-git-hooks-darwin-x64 -o bun-git-hooks

# Make it executable
chmod +x bun-git-hooks

# Move it to your PATH
mv bun-git-hooks /usr/local/bin/bun-git-hooks
```

```sh [Linux (arm64)]
# Download the binary
curl -L https://github.com/stacksjs/bun-git-hooks/releases/latest/download/bun-git-hooks-linux-arm64 -o bun-git-hooks

# Make it executable
chmod +x bun-git-hooks

# Move it to your PATH
mv bun-git-hooks /usr/local/bin/bun-git-hooks
```

```sh [Linux (x64)]
# Download the binary
curl -L https://github.com/stacksjs/bun-git-hooks/releases/latest/download/bun-git-hooks-linux-x64 -o bun-git-hooks

# Make it executable
chmod +x bun-git-hooks

# Move it to your PATH
mv bun-git-hooks /usr/local/bin/bun-git-hooks
```

```sh [Windows (x64)]
# Download the binary
curl -L https://github.com/stacksjs/bun-git-hooks/releases/latest/download/bun-git-hooks-windows-x64.exe -o bun-git-hooks.exe

# Move it to your PATH (adjust the path as needed)
move bun-git-hooks.exe C:\Windows\System32\bun-git-hooks.exe
```

:::

::: tip
You can also find the `bun-git-hooks` binaries in GitHub [releases](https://github.com/stacksjs/bun-git-hooks/releases).
:::

## Configuration

After installation, you'll need to create a configuration file. The package supports multiple configuration formats:

::: code-group

```ts [TypeScript]
// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': 'bun run lint && bun run test',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',
}

export default config
```

```js [JavaScript]
// git-hooks.config.js
module.exports = {
  'pre-commit': 'bun run lint && bun run test',
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',
}
```

```json [JSON]
// git-hooks.config.json
{
  "pre-commit": "bun run lint && bun run test",
  "commit-msg": "bun commitlint --edit $1",
  "pre-push": "bun run build"
}
```

```json [package.json]
{
  "gitHooks": {
    "pre-commit": "bun run lint && bun run test",
    "commit-msg": "bun commitlint --edit $1",
    "pre-push": "bun run build"
  }
}
```

:::

## Post-Installation

After installation and configuration:

1. The hooks will be automatically installed when you run `bun install`
2. You can verify the installation by checking the `.git/hooks` directory
3. To test if hooks are working, try making a commit

## Environment Variables

You can control the behavior of `bun-git-hooks` using environment variables:

```bash
# Skip hook execution
SKIP_BUN_GIT_HOOKS=1 git commit -m "message"

# Skip hook installation
SKIP_INSTALL_GIT_HOOKS=1 bun install

# Use custom initialization script
BUN_GIT_HOOKS_RC=./.git-hooks.rc
```

## Troubleshooting

If you encounter any issues during installation:

1. Ensure you have the latest version of Bun installed
2. Check that your configuration file is valid
3. Verify that `bun-git-hooks` is in your `devDependencies`
4. Try running with verbose mode enabled in your config

For more detailed troubleshooting, see the [Troubleshooting Guide](/troubleshooting).
