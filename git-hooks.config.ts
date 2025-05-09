import type { GitHooksConfig } from './src/types'

const config: GitHooksConfig = {

  // Hook-specific configuration (takes precedence)
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts}': 'bunx --bun eslint . --fix --max-warnings=0'
    }
  },
  'commit-msg': 'bunx gitlint .git/COMMIT_EDITMSG',
  verbose: true
}

export default config
