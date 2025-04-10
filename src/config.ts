import type { GitHooksConfig } from './types'
import { resolve } from 'node:path'
import { loadConfig } from 'bunfig'

export const defaultConfig: GitHooksConfig = {
  // 'pre-commit': 'echo "pre-commit"',
  verbose: true,
}

// @ts-expect-error dtsx issue
// eslint-disable-next-line antfu/no-top-level-await
export const config: GitHooksConfig = await loadConfig({
  name: 'git-hooks',
  cwd: resolve(__dirname, '..'),
  defaultConfig,
})
