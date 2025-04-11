#!/usr/bin/env bun
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
  .example('git-hooks')
  .example('git-hooks ../src/config.ts')
  .example('git-hooks --verbose')
  .action(async (configPath?: string, options?: { verbose?: boolean }) => {
    try {
      if (options?.verbose) {
        console.log('[DEBUG] Config path:', configPath || 'using default')
        console.log('[DEBUG] Working directory:', process.cwd())
      }

      if (configPath) {
        const config = await import(configPath)
        setHooksFromConfig(process.cwd(), { configFile: config })
      }
      else {
        setHooksFromConfig(process.cwd())
      }

      console.log('[INFO] Successfully set all git hooks')
    }
    catch (err) {
      console.error('[ERROR] Was not able to set git hooks. Error:', err)
      process.exit(1)
    }
  })

cli
  .command('uninstall', 'Remove all git hooks')
  .alias('remove')
  .option('--verbose', 'Enable verbose logging')
  .example('git-hooks uninstall')
  .example('git-hooks remove')
  .example('git-hooks uninstall --verbose')
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

// Parse CLI args
cli.parse()
