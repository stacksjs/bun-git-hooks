import type { GitHooksConfig } from './src/types'

const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.js': 'eslint --fix',
      '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
      '*.css': 'stylelint --fix',
      '*.md': 'prettier --write'
    }
  },
  // Example of a regular command hook
  'commit-msg': 'bun commitlint --edit $1',
  'verbose': true,
}

export default config
