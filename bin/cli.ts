#!/usr/bin/env bun
import process from 'node:process'
import { Logger } from '@stacksjs/clarity'
import { CAC } from 'cac'
import { version } from '../package.json'
import { config } from '../src/config'
import { removeHooks, setHooksFromConfig } from '../src/git-hooks'
import { runStagedLint } from '../src/staged-lint'

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
        setHooksFromConfig(process.cwd(), { configFile: config, verbose: options?.verbose ?? false })
      }
      else {
        setHooksFromConfig(process.cwd(), { verbose: options?.verbose ?? false })
      }

      log.success('Successfully set all git hooks')
    }
    catch (err) {
      log.error(err)
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
  .option('--auto-restage', 'Automatically re-stage files after lint fixes')
  .option('--no-auto-restage', 'Do not automatically re-stage files after lint fixes')
  .example('git-hooks run-staged-lint pre-commit')
  .example('git-hooks run-staged-lint pre-commit --verbose')
  .example('git-hooks run-staged-lint pre-commit --auto-restage')
  .example('git-hooks run-staged-lint pre-commit --no-auto-restage')
  .action(async (hook: string, options?: { verbose?: boolean, autoRestage?: boolean }) => {
    try {
      if (options?.verbose) {
        log.debug(`Running staged lint for hook: ${hook}`)
        log.debug(`Working directory: ${process.cwd()}`)
        if (options?.autoRestage !== undefined) {
          log.debug(`Auto-restage: ${options.autoRestage}`)
        }
      }

      const success = await runStagedLint(hook, config, process.cwd(), options?.verbose, options?.autoRestage)

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
