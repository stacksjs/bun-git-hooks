import type { GitHooksConfig } from './src/types'

const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      '**/*.{js,ts,json,yaml,yml,md}': 'bunx --bun pickier {files} --fix',
    },
  },
  'commit-msg': 'bunx gitlint .git/COMMIT_EDITMSG',
}

export default config
