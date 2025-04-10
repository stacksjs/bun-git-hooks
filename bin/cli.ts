#!/usr/bin/env node
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { removeHooks, setHooksFromConfig } from '../src/git-hooks'

const cli = new CAC('git-hooks')

// Check if installation should be skipped
const { SKIP_INSTALL_GIT_HOOKS } = process.env
if (['1', 'true'].includes(SKIP_INSTALL_GIT_HOOKS || '')) {
  console.log(`[INFO] SKIP_INSTALL_GIT_HOOKS is set to "${SKIP_INSTALL_GIT_HOOKS}", skipping installing hooks.`)
  process.exit(0)
}

cli
  .command('[configPath]', 'Install git hooks, optionally from specified config file')
  .option('--verbose', 'Enable verbose logging')
  .example('bun-git-hooks')
  .example('bun-git-hooks ../src/config.ts')
  .example('bun-git-hooks --verbose')
  .action(async (configPath?: string, options?: { verbose?: boolean }) => {
    try {
      if (options?.verbose) {
        console.log('[DEBUG] Config path:', configPath || 'using default')
        console.log('[DEBUG] Working directory:', process.cwd())
      }

      setHooksFromConfig(process.cwd())
      console.log('[INFO] Successfully set all git hooks')
    }
    catch (err) {
      console.error('[ERROR] Was not able to set git hooks. Error:', err)
      process.exit(1)
    }
  })

cli
  .command('uninstall', 'Remove all git hooks')
  .alias('remove') // Add alias for uninstall
  .option('--verbose', 'Enable verbose logging')
  .example('bun-git-hooks uninstall')
  .example('bunx bun-git-hooks remove')
  .example('bunx git-hooks uninstall --verbose')
  .action(async (options?: { verbose?: boolean }) => {
    try {
      if (options?.verbose) {
        console.log('[DEBUG] Removing hooks from:', process.cwd())
      }

      removeHooks(process.cwd(), options?.verbose)
      console.log('[INFO] Successfully removed all git hooks')
    }
    catch (err) {
      console.error('[ERROR] Was not able to remove git hooks. Error:', err)
      process.exit(1)
    }
  })

cli.version(version)
cli.help()
cli.parse()
