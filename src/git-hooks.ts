import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { config } from './config'

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
 * @param {string} directory
 * @return {string | undefined} .git folder path or undefined if it was not found
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
 * @param projectPath - path to the bun-git-hooks in node modules
 * @return {string | undefined} - an absolute path to the project or undefined if projectPath is not in node_modules
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
 * @param {string} projectRootPath
 * @throws TypeError if packageJsonData not an object
 * @return {boolean}
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
 * @param {string} projectPath - a path to the project, defaults to process.cwd
 * @return {{packageJsonContent: any, packageJsonPath: string}}
 * @throws TypeError if projectPath is not a string
 * @throws Error if cant read package.json
 * @private
 */
function _getPackageJson(projectPath = process.cwd()) {
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
 * @param {string} projectRootPath
 */
export function setHooksFromConfig(projectRootPath: string = process.cwd(), options?: { configFile?: string } = {}): void {
  if (!config || Object.keys(config).length === 0)
    throw new Error('[ERROR] Config was not found! Please add `.git-hooks.config.{ts,js,mjs,cjs,mts,cts,json}` or `git-hooks.config.{ts,js,mjs,cjs,mts,cts,json}` or the `git-hooks` entry in package.json.\r\nCheck README for details')

  // Only validate hook names that aren't options
  const hookKeys = Object.keys(config).filter(key => key !== 'preserveUnused')
  const isValidConfig = hookKeys.every(key => VALID_GIT_HOOKS.includes(key as typeof VALID_GIT_HOOKS[number]))

  if (!isValidConfig)
    throw new Error('[ERROR] Config was not in correct format. Please check git hooks or options name')

  const preserveUnused = Array.isArray(config.preserveUnused) ? config.preserveUnused : config.preserveUnused ? VALID_GIT_HOOKS : []

  for (const hook of VALID_GIT_HOOKS) {
    if (Object.prototype.hasOwnProperty.call(config, hook)) {
      if (!config[hook])
        throw new Error(`[ERROR] Command for ${hook} is not set`)

      _setHook(hook, config[hook], projectRootPath)
    }
    else if (!preserveUnused.includes(hook))
      _removeHook(hook, projectRootPath)
  }
}

/**
 * Creates or replaces an existing executable script in .git/hooks/<hook> with provided command
 * @param {string} hook
 * @param {string} command
 * @param {string} projectRoot
 * @private
 */
function _setHook(hook: string, command: string, projectRoot: string = process.cwd()) {
  const gitRoot = getGitProjectRoot(projectRoot)

  if (!gitRoot) {
    console.info('[INFO] No `.git` root folder found, skipping')
    return
  }

  const hookCommand = PREPEND_SCRIPT + command
  const hookDirectory = path.join(gitRoot, 'hooks')
  const hookPath = path.normalize(path.join(hookDirectory, hook))

  // Ensure hooks directory exists
  if (!fs.existsSync(hookDirectory))
    fs.mkdirSync(hookDirectory, { recursive: true })

  fs.writeFileSync(hookPath, hookCommand, { mode: 0o755 })
}

/**
 * Deletes all git hooks
 * @param {string} projectRoot
 */
export function removeHooks(projectRoot: string = process.cwd(), verbose = false): void {
  for (const configEntry of VALID_GIT_HOOKS)
    _removeHook(configEntry, projectRoot, verbose)
}

/**
 * Removes the pre-commit hook from .git/hooks
 * @param {string} hook
 * @param {string} projectRoot
 * @private
 */
function _removeHook(hook: string, projectRoot = process.cwd(), verbose = false) {
  const gitRoot = getGitProjectRoot(projectRoot)
  const hookPath = path.normalize(`${gitRoot}/hooks/${hook}`)

  if (fs.existsSync(hookPath))
    fs.unlinkSync(hookPath)

  if (verbose)
    // eslint-disable-next-line no-console
    console.info(`[INFO] Successfully removed the ${hook} hook`)
}

/**
 * Validates the config, checks that every git hook or option is named correctly
 * @return {boolean}
 * @param {{string: string}} config
 */
function _validateHooks(config: Record<string, string>) {
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
} = {
  PREPEND_SCRIPT,
  setHooksFromConfig,
  removeHooks,
  checkBunGitHooksInDependencies,
  getProjectRootDirectoryFromNodeModules,
  getGitProjectRoot,
}

export default gitHooks
