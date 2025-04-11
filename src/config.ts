import type { GitHooksConfig } from './types'
import process from 'node:process'
import { loadConfig } from 'bunfig'
import defaultConfig from '../git-hooks.config.ts'

// eslint-disable-next-line antfu/no-top-level-await
export const config: GitHooksConfig = await loadConfig({
  name: 'git-hooks',
  cwd: process.cwd(),
  defaultConfig,
})
