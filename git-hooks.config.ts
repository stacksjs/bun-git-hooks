import type { GitHooksConfig } from './src/types'

const config: GitHooksConfig = {
  'pre-commit': 'bun run lint && bun run test',
  'verbose': true,
}

export default config
