import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { config } from './config'
import type { GitHooksConfig, StagedLintConfig, StagedLintTask, SetHooksFromConfigOptions } from './types'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export const VALID_GIT_HOOKS = [
  'applypatch-msg',
  'pre-applypatch',
  'post-applypatch',
  'pre-commit',
  'pre-merge-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-rebase',
  'post-checkout',
  'post-merge',
  'pre-push',
  'pre-receive',
  'update',
  'proc-receive',
  'post-receive',
  'post-update',
  'reference-transaction',
  'push-to-checkout',
  'pre-auto-gc',
  'post-rewrite',
  'sendemail-validate',
  'fsmonitor-watchman',
  'p4-changelist',
  'p4-prepare-changelist',
  'p4-post-changelist',
  'p4-pre-submit',
  'post-index-change',
] as const

export const VALID_OPTIONS = ['preserveUnused'] as const

export const PREPEND_SCRIPT
  = `#!/bin/sh

if [ "$SKIP_BUN_GIT_HOOKS" = "1" ]; then
    echo "[INFO] SKIP_BUN_GIT_HOOKS is set to 1, skipping hook."
    exit 0
fi

if [ -f "$BUN_GIT_HOOKS_RC" ]; then
    . "$BUN_GIT_HOOKS_RC"
fi

`

/**
 * Recursively gets the .git folder path from provided directory
 */
export function getGitProjectRoot(directory: string = process.cwd()): string | undefined {
  // If the directory itself ends with .git, return it normalized
  if (directory.endsWith('.git')) {
    return path.normalize(directory)
  }

  let start = path.normalize(directory)

  // Stop if we've reached the root directory
  if (!start || start === path.sep || start === '.') {
    return undefined
  }

  const fullPath = path.join(start, '.git')

  if (fs.existsSync(fullPath)) {
    if (!fs.lstatSync(fullPath).isDirectory()) {
      const content = fs.readFileSync(fullPath, { encoding: 'utf-8' })
      // eslint-disable-next-line regexp/no-super-linear-backtracking
      const match = /^gitdir: (.*)\s*$/.exec(content)

      if (match) {
        const gitDir = match[1]
        let commonDir = path.join(gitDir, 'commondir')

        if (fs.existsSync(commonDir)) {
          commonDir = fs.readFileSync(commonDir, 'utf8').trim()

          return path.resolve(gitDir, commonDir)
        }

        return path.normalize(gitDir)
      }
    }

    return path.normalize(fullPath)
  }

  // Move up one directory
  const parentDir = path.dirname(start)

  // If we're already at the root, stop
  if (parentDir === start) {
    return undefined
  }

  return getGitProjectRoot(parentDir)
}

/**
 * Transforms the <project>/node_modules/bun-git-hooks to <project>
 */
export function getProjectRootDirectoryFromNodeModules(projectPath: string): string | undefined {
  function _arraysAreEqual(a1: any[], a2: any[]) {
    return JSON.stringify(a1) === JSON.stringify(a2)
  }

  const projDir = projectPath.split(/[\\/]/) // <- would split both on '/' and '\'

  const indexOfStoreDir = projDir.indexOf('.store')
  if (indexOfStoreDir > -1) {
    return projDir.slice(0, indexOfStoreDir - 1).join('/')
  }

  // Handle .bin case
  if (projDir.length > 3
    && _arraysAreEqual(projDir.slice(-3), ['node_modules', '.bin', 'bun-git-hooks'])) {
    return projDir.slice(0, -3).join('/')
  }

  // Existing node_modules check
  if (projDir.length > 2
    && _arraysAreEqual(projDir.slice(-2), ['node_modules', 'bun-git-hooks'])) {
    return projDir.slice(0, -2).join('/')
  }

  return undefined
}

/**
 * Checks the 'bun-git-hooks' in dependencies of the project
 */
export function checkBunGitHooksInDependencies(projectRootPath: string): boolean {
  if (typeof projectRootPath !== 'string') {
    throw new TypeError('Package json path is not a string!')
  }

  const { packageJsonContent } = _getPackageJson(projectRootPath)

  // if bun-git-hooks in dependencies -> note user that he should remove move it to devDeps
  if ('dependencies' in packageJsonContent && 'bun-git-hooks' in packageJsonContent.dependencies) {
    console.warn('[WARN] You should move `bun-git-hooks` to your devDependencies!')
    return true
  }

  if (!('devDependencies' in packageJsonContent)) {
    return false
  }

  return 'bun-git-hooks' in packageJsonContent.devDependencies
}

/**
 * Reads package.json file, returns package.json content and path
 */
function _getPackageJson(projectPath = process.cwd()): { packageJsonContent: any; packageJsonPath: string } {
  if (typeof projectPath !== 'string') {
    throw new TypeError('projectPath is not a string')
  }

  const targetPackageJson = path.normalize(`${projectPath}/package.json`)

  if (!fs.statSync(targetPackageJson).isFile()) {
    throw new Error('Package.json doesn\'t exist')
  }

  const packageJsonDataRaw = fs.readFileSync(targetPackageJson, { encoding: 'utf-8' })

  return { packageJsonContent: JSON.parse(packageJsonDataRaw), packageJsonPath: targetPackageJson }
}

/**
 * Parses the config and sets git hooks
 */
export function setHooksFromConfig(projectRootPath: string = process.cwd(), options?: SetHooksFromConfigOptions): void {
  if (!config || Object.keys(config).length === 0)
    throw new Error('[ERROR] Config was not found! Please add `.git-hooks.config.{ts,js,mjs,cjs,mts,cts,json}` or `git-hooks.config.{ts,js,mjs,cjs,mts,cts,json}` or the `git-hooks` entry in package.json.\r\nCheck README for details')

  const configFile = options?.configFile ? options.configFile : config
  // Only validate hook names that aren't options
  const hookKeys = Object.keys(configFile).filter(key => key !== 'preserveUnused' && key !== 'verbose')
  const isValidConfig = hookKeys.every(key => VALID_GIT_HOOKS.includes(key as typeof VALID_GIT_HOOKS[number]))

  if (!isValidConfig)
    throw new Error('[ERROR] Config was not in correct format. Please check git hooks or options name')

  const preserveUnused = Array.isArray(configFile.preserveUnused) ? configFile.preserveUnused : configFile.preserveUnused ? VALID_GIT_HOOKS : []

  for (const hook of VALID_GIT_HOOKS) {
    if (Object.prototype.hasOwnProperty.call(configFile, hook)) {
      if (!configFile[hook])
        throw new Error(`[ERROR] Command for ${hook} is not set`)

      _setHook(hook, configFile[hook], projectRootPath)
    }
    else if (!preserveUnused.includes(hook)) {
      _removeHook(hook, projectRootPath)
    }
  }
}

/**
 * Gets the list of staged files in the git repository
 */
async function getStagedFiles(projectRoot: string = process.cwd()): Promise<string[]> {
  try {
    const { stdout } = await execAsync('git diff --staged --name-only --diff-filter=ACMR', { cwd: projectRoot })
    return stdout.trim().split('\n').filter(Boolean)
  } catch (error) {
    console.error('[ERROR] Failed to get staged files:', error)
    return []
  }
}

/**
 * Checks if a file matches a glob pattern
 */
function matchesGlob(file: string, pattern: string): boolean {
  // Simple implementation - can be expanded with micromatch for more complex patterns
  if (pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(file)
  }

  return file === pattern
}

/**
 * Filters files by glob pattern
 */
function filterFilesByPattern(files: string[], pattern: string): string[] {
  return files.filter(file => matchesGlob(file, pattern))
}

/**
 * Run a command on staged files that match a pattern
 */
async function runCommandOnStagedFiles(
  command: string | string[],
  files: string[],
  projectRoot: string = process.cwd(),
  verbose = false
): Promise<boolean> {
  if (files.length === 0) {
    if (verbose) console.info('[INFO] No matching files for pattern')
    return true
  }

  const commands = Array.isArray(command) ? command : [command]

  for (const cmd of commands) {
    try {
      const fullCommand = `${cmd} ${files.join(' ')}`
      if (verbose) console.info(`[INFO] Running: ${fullCommand}`)

      const { stdout, stderr } = await execAsync(fullCommand, { cwd: projectRoot })

      if (verbose) {
        if (stdout) console.info(stdout)
        if (stderr) console.error(stderr)
      }
    } catch (error) {
      console.error(`[ERROR] Command failed: ${cmd}`, error)
      return false
    }
  }

  return true
}

/**
 * Process a stagedLint configuration for a git hook
 */
async function processStagedLint(
  stagedLintConfig: StagedLintConfig,
  projectRoot: string,
  verbose = false
): Promise<boolean> {
  const stagedFiles = await getStagedFiles(projectRoot)

  if (stagedFiles.length === 0) {
    if (verbose) console.info('[INFO] No staged files found')
    return true
  }

  let success = true

  for (const [pattern, task] of Object.entries(stagedLintConfig)) {
    const matchedFiles = filterFilesByPattern(stagedFiles, pattern)
    const taskResult = await runCommandOnStagedFiles(task, matchedFiles, projectRoot, verbose)

    if (!taskResult) {
      success = false
      break
    }
  }

  return success
}

/**
 * Creates or replaces an existing executable script in .git/hooks/<hook> with provided command or stagedLint config
 */
function _setHook(hook: string, commandOrConfig: string | { stagedLint?: StagedLintConfig }, projectRoot: string = process.cwd()): void {
  const gitRoot = getGitProjectRoot(projectRoot)

  if (!gitRoot) {
    console.info('[INFO] No `.git` root folder found, skipping')
    return
  }

  let hookCommand: string

  if (typeof commandOrConfig === 'string') {
    hookCommand = PREPEND_SCRIPT + commandOrConfig
  } else if (commandOrConfig.stagedLint) {
    // Create a command that will execute the bun-git-hooks stagedLint handler
    // Use the CLI command directly
    hookCommand = PREPEND_SCRIPT + `git-hooks run-staged-lint ${hook}`
  } else {
    console.error(`[ERROR] Invalid command or config for hook ${hook}`)
    return
  }

  const hookDirectory = path.join(gitRoot, 'hooks')
  const hookPath = path.normalize(path.join(hookDirectory, hook))

  // Ensure hooks directory exists
  if (!fs.existsSync(hookDirectory)){
    fs.mkdirSync(hookDirectory, { recursive: true })
  }

  fs.writeFileSync(hookPath, hookCommand, { mode: 0o755 })
}

/**
 * Deletes all git hooks
 */
export function removeHooks(projectRoot: string = process.cwd(), verbose = false): void {
  for (const configEntry of VALID_GIT_HOOKS)
    _removeHook(configEntry, projectRoot, verbose)
}

/**
 * Removes the pre-commit hook from .git/hooks
 */
function _removeHook(hook: string, projectRoot = process.cwd(), verbose = false): void {
  const gitRoot = getGitProjectRoot(projectRoot)
  const hookPath = path.normalize(`${gitRoot}/hooks/${hook}`)

  if (fs.existsSync(hookPath))
    fs.unlinkSync(hookPath)

  if (verbose)
    // eslint-disable-next-line no-console
    console.info(`[INFO] Successfully removed the ${hook} hook`)
}

/**
 * Runs the staged lint tasks defined in the config file
 */
export async function runStagedLint(hook: string): Promise<boolean> {
  try {
    // Get the stagedLint config for the specific hook from the config
    // Use type assertion to handle the index
    const hookConfig = config[hook as keyof typeof config]

    // Check if it has the expected structure
    if (!hookConfig || typeof hookConfig !== 'object' || !('stagedLint' in hookConfig)) {
      console.error(`[ERROR] No stagedLint configuration found for hook ${hook}`)
      return false
    }

    const stagedLintConfig = (hookConfig as { stagedLint?: StagedLintConfig }).stagedLint

    if (!stagedLintConfig) {
      console.error(`[ERROR] Invalid stagedLint configuration for hook ${hook}`)
      return false
    }

    const verbose = config.verbose === true
    return await processStagedLint(stagedLintConfig, process.cwd(), verbose)
  } catch (error) {
    console.error('[ERROR] Failed to run staged lint:', error)
    return false
  }
}

/**
 * Validates the config, checks that every git hook or option is named correctly
 */
function _validateHooks(config: Record<string, any>): boolean {
  for (const hookOrOption in config) {
    if (!VALID_GIT_HOOKS.includes(hookOrOption as typeof VALID_GIT_HOOKS[number]) && !VALID_OPTIONS.includes(hookOrOption as typeof VALID_OPTIONS[number]))
      return false
  }

  return true
}

const gitHooks: {
  PREPEND_SCRIPT: typeof PREPEND_SCRIPT
  setHooksFromConfig: typeof setHooksFromConfig
  removeHooks: typeof removeHooks
  checkBunGitHooksInDependencies: typeof checkBunGitHooksInDependencies
  getProjectRootDirectoryFromNodeModules: typeof getProjectRootDirectoryFromNodeModules
  getGitProjectRoot: typeof getGitProjectRoot
  runStagedLint: typeof runStagedLint
  getStagedFiles: typeof getStagedFiles
} = {
  PREPEND_SCRIPT,
  setHooksFromConfig,
  removeHooks,
  checkBunGitHooksInDependencies,
  getProjectRootDirectoryFromNodeModules,
  getGitProjectRoot,
  runStagedLint,
  getStagedFiles
}

export default gitHooks
