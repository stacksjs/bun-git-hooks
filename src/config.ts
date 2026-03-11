import type { GitHooksConfig } from './types'
import process from 'node:process'
import { loadConfig } from 'bunfig'
import defaultConfig from '../git-hooks.config.ts'

// Lazy-loaded config to avoid top-level await (enables bun --compile)
let _config: GitHooksConfig | null = null

export async function getConfig(): Promise<GitHooksConfig> {
  if (!_config) {
    _config = await loadConfig({
      name: 'git-hooks',
      cwd: process.cwd(),
      defaultConfig,
    })
  }
  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: GitHooksConfig = defaultConfig
