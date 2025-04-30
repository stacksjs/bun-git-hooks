#!/usr/bin/env bun
import process from 'node:process'
import { Logger } from '@stacksjs/clarity'
import { CAC } from 'cac'
import { version } from '../package.json'
import { removeHooks, runStagedLint, setHooksFromConfig } from '../src/git-hooks'

const cli = new CAC('git-hooks')
const log = new Logger('git-hooks', {
  showTags: true,
})

// Check if installation should be skipped
const { SKIP_INSTALL_GIT_HOOKS } = process.env
if (['1', 'true'].includes(SKIP_INSTALL_GIT_HOOKS || '')) {
  log.info(`SKIP_INSTALL_GIT_HOOKS is set to "${SKIP_INSTALL_GIT_HOOKS}", skipping installing hooks.`)
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
        log.debug(`Config path: ${configPath || 'using default'}`)
        log.debug(`Working directory: ${process.cwd()}`)
      }

      if (configPath) {
        const config = await import(configPath)
        setHooksFromConfig(process.cwd(), { configFile: config })
      }
      else {
        setHooksFromConfig(process.cwd())
      }

      log.success('Successfully set all git hooks')
    }
    catch (err) {
      log.error('Was not able to set git hooks. Error:', err)
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
        log.debug(`Removing hooks from: ${process.cwd()}`)
      }

      removeHooks(process.cwd(), options?.verbose)
      log.success('Successfully removed all git hooks')
    }
    catch (err) {
      log.error('Was not able to remove git hooks. Error:', err)
      process.exit(1)
    }
  })

cli
  .command('run-staged-lint <hook>', 'Run staged lint for a specific git hook')
  .option('--verbose', 'Enable verbose logging')
  .example('git-hooks run-staged-lint pre-commit')
  .example('git-hooks run-staged-lint pre-push --verbose')
  .action(async (hook: string, options?: { verbose?: boolean }) => {
    try {
      if (options?.verbose) {
        log.debug(`Running staged lint for hook: ${hook}`)
        log.debug(`Working directory: ${process.cwd()}`)
      }

      const success = await runStagedLint(hook)

      if (success) {
        log.success('Staged lint completed successfully')
      }
      else {
        log.error('Staged lint failed')
        process.exit(1)
      }
    }
    catch (err) {
      log.error('Was not able to run staged lint. Error:', err)
      process.exit(1)
    }
  })

cli.version(version)
cli.help()

// Parse CLI args
cli.parse()
