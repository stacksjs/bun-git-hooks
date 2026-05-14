import type { GitHooksConfig } from './types'
import process from 'node:process'
import { loadConfig } from 'bunfig'
import bundledDefaultConfig from '../git-hooks.config.ts'

// Lazy-loaded config to avoid top-level await (enables bun --compile)
let _config: GitHooksConfig | null = null
const emptyConfig: GitHooksConfig = {}

export async function getConfig(): Promise<GitHooksConfig> {
  if (!_config) {
    const loadedConfig = await loadConfig({
      name: 'git-hooks',
      cwd: process.cwd(),
      defaultConfig: emptyConfig,
    })

    _config = Object.keys(loadedConfig).length > 0
      ? loadedConfig
      : bundledDefaultConfig
  }

  return _config
}

// For backwards compatibility - synchronous access with default fallback
export const config: GitHooksConfig = bundledDefaultConfig
