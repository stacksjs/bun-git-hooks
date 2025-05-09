# Advanced Configuration

bun-git-hooks provides powerful configuration options for advanced use cases and complex workflows.

## Configuration Files

### Supported Formats

```bash
# TypeScript (recommended)
git-hooks.config.ts

# JavaScript
git-hooks.config.js
git-hooks.config.mjs
git-hooks.config.cjs

# JSON
git-hooks.config.json
```

### Package.json Format

```json
{
  "git-hooks": {
    "pre-commit": "..."
  }
}
```

## Advanced Features

### Conditional Hooks

```ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': process.env.CI
    ? 'bun run test:ci'
    : {
        'staged-lint': {
          '*.ts': 'eslint --fix'
        }
      }
}
```

### Dynamic Configuration

```ts
import type { GitHooksConfig } from 'bun-git-hooks'

function getConfig(): GitHooksConfig {
  const isProduction = process.env.NODE_ENV === 'production'
  const isCI = Boolean(process.env.CI)

  return {
    'pre-commit': {
      'staged-lint': {
        '*.ts': [
          'eslint --fix',
          isProduction ? 'tsc --noEmit' : null,
        ].filter(Boolean)
      }
    },
    'pre-push': isCI ? 'bun run test:ci' : 'bun run test',
    'verbose': !isCi
  }
}

export default getConfig()
```

### Multiple Configurations

```ts
// base.config.ts
// dev.config.ts
import { baseConfig } from './base.config'

export const baseConfig: GitHooksConfig = {
  'pre-commit': 'bun run lint',
  'commit-msg': 'bun commitlint --edit $1'
}

export default {
  ...baseConfig,
  'pre-commit': {
    'staged-lint': {
      '*.ts': 'eslint --fix'
    }
  }
}

export default {
  ...baseConfig,
  'pre-push': [
    'bun run test',
    'bun run build',
    'bun run security:check'
  ]
}
```

## Advanced Use Cases

### Monorepo Configuration

```ts
import type { GitHooksConfig } from 'bun-git-hooks'
import { getAffectedPackages } from './scripts/monorepo'

const config: GitHooksConfig = {
  'pre-commit': async () => {
    const packages = await getAffectedPackages()
    return {
      'staged-lint': {
        [`packages/{${packages.join(',')}}/src/**/*.ts`]: [
          'eslint --fix',
          'prettier --write'
        ]
      }
    }
  },
  'pre-push': 'bun run test:affected'
}
```

### Custom Hook Scripts

```ts
const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      // Custom script for specific files
      '*.graphql': async (files) => {
        const schema = await loadSchema()
        return files.every(file => validateGraphQL(file, schema))
      },

      // Multiple operations
      '*.ts': async (files) => {
        await lint(files)
        await test(files)
        await typeCheck(files)
      }
    }
  }
}
```

### Environment-specific Configuration

```ts
const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      '*.ts': async (files) => {
        // Development: Fast checks
        if (process.env.NODE_ENV === 'development') {
          return 'eslint --fix'
        }

        // Staging: More thorough checks
        if (process.env.NODE_ENV === 'staging') {
          return [
            'eslint --fix',
            'prettier --write',
            'tsc --noEmit'
          ]
        }

        // Production: Most strict
        return [
          'eslint --fix --max-warnings=0',
          'prettier --write',
          'tsc --noEmit',
          'bun run test:affected'
        ]
      }
    }
  }
}
```

## Best Practices

1. **Type Safety**: Use TypeScript for better IDE support
2. **Modular Config**: Split complex configurations into modules
3. **Environment Awareness**: Adapt behavior based on environment
4. **Performance**: Use conditional checks to skip unnecessary work
5. **Error Handling**: Add proper error handling for custom scripts
