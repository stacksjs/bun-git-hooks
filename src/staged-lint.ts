import type { GitHooksConfig, StagedLintConfig } from './types'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Enhanced staged lint processor with configurable auto-restaging
 */
export class StagedLintProcessor {
  private projectRoot: string
  private verbose: boolean
  private autoRestage: boolean

  constructor(projectRoot: string = process.cwd(), verbose: boolean = false, autoRestage: boolean = true) {
    this.projectRoot = projectRoot
    this.verbose = verbose
    this.autoRestage = autoRestage
  }

  /**
   * Process staged lint with optional auto-restaging
   */
  async process(config: StagedLintConfig): Promise<boolean> {
    try {
      const stagedFiles = this.getStagedFiles()
      if (stagedFiles.length === 0) {
        this.log('No staged files found')
        return true
      }

      this.log(`Processing ${stagedFiles.length} staged files`)

      // Store original staged content for comparison (only if auto-restage is enabled)
      const originalContent = this.autoRestage ? this.captureStagedContent(stagedFiles) : new Map()

      let hasErrors = false

      // Process each pattern in the config
      for (const [pattern, commands] of Object.entries(config)) {
        const matchingFiles = this.getMatchingFiles(stagedFiles, pattern)
        if (matchingFiles.length === 0) {
          this.log(`No files match pattern "${pattern}" - skipping`)
          continue
        }

        this.log(`Pattern "${pattern}" matched ${matchingFiles.length} file(s)`)
        if (this.verbose) {
          this.log(`Matched files: ${matchingFiles.join(', ')}`)
        }

        const commandArray = Array.isArray(commands) ? commands : [commands]

        for (const command of commandArray) {
          const success = await this.runLintCommand(command, matchingFiles)
          if (!success) {
            hasErrors = true
          }
        }
      }

      // Handle auto-restaging if enabled and no errors
      if (this.autoRestage && !hasErrors) {
        const modifiedFiles = this.getModifiedFiles(originalContent)
        if (modifiedFiles.length > 0) {
          this.log(`Auto-restaging ${modifiedFiles.length} modified files: ${modifiedFiles.join(', ')}`)
          this.restageFiles(modifiedFiles)

          // Validate that restaged files still pass lint
          const validationSuccess = await this.validateStagedFiles(config)
          if (!validationSuccess) {
            this.log('Validation failed after auto-restaging')
            return false
          }
        }
      }
      else if (!this.autoRestage) {
        // Check if files were modified but not restaged
        const modifiedFiles = this.getModifiedFiles(originalContent)
        if (modifiedFiles.length > 0) {
          console.warn(`⚠️  Lint modified ${modifiedFiles.length} files but auto-restaging is disabled.`)
          console.warn(`   Modified files: ${modifiedFiles.join(', ')}`)
          console.warn(`   You may need to manually stage these files and commit again.`)
        }
      }

      return !hasErrors
    }
    catch (error) {
      console.error(`Staged lint process failed: ${error}`)
      return false
    }
  }

  private getStagedFiles(): string[] {
    try {
      const output = execSync('git diff --cached --name-only', {
        cwd: this.projectRoot,
        encoding: 'utf-8',
      })
      return output.trim().split('\n').filter(Boolean)
    }
    catch {
      return []
    }
  }

  private captureStagedContent(files: string[]): Map<string, string> {
    const content = new Map<string, string>()

    for (const file of files) {
      try {
        const stagedContent = execSync(`git show :${file}`, {
          cwd: this.projectRoot,
          encoding: 'utf-8',
        })
        content.set(file, stagedContent)
      }
      catch {
        try {
          const workingContent = fs.readFileSync(path.join(this.projectRoot, file), 'utf-8')
          content.set(file, workingContent)
        }
        catch {
          // Skip files that can't be read
        }
      }
    }

    return content
  }

  private getMatchingFiles(files: string[], pattern: string): string[] {
    // Handle brace expansion like {js,ts}
    const expandedPatterns = this.expandBracePattern(pattern)

    // Split into include and exclude patterns
    const includePatterns = expandedPatterns.filter(p => !p.startsWith('!'))
    const excludePatterns = expandedPatterns.filter(p => p.startsWith('!'))

    return files.filter((file) => {
      // If there are include patterns, file must match at least one
      const isIncluded = includePatterns.length === 0 || includePatterns.some(p => this.matchesGlob(file, p))

      // File must not match any exclude pattern
      const isExcluded = excludePatterns.some(p => this.matchesGlob(file, p.slice(1)))

      return isIncluded && !isExcluded
    })
  }

  /**
   * Expands brace patterns like {js,ts} into [js, ts]
   */
  private expandBracePattern(pattern: string): string[] {
    const braceMatch = pattern.match(/\{([^}]+)\}/g)
    if (!braceMatch)
      return [pattern]

    const results: string[] = [pattern]
    braceMatch.forEach((brace) => {
      const options = brace.slice(1, -1).split(',')
      const newResults: string[] = []

      results.forEach((result) => {
        options.forEach((option) => {
          newResults.push(result.replace(brace, option.trim()))
        })
      })

      results.length = 0
      results.push(...newResults)
    })

    return results
  }

  /**
   * Checks if a file matches a glob pattern
   */
  private matchesGlob(file: string, pattern: string): boolean {
    // Handle negation patterns (e.g., !node_modules/**)
    if (pattern.startsWith('!')) {
      return !this.matchesGlob(file, pattern.slice(1))
    }

    // Convert glob pattern to regex step by step
    let regexPattern = pattern

    // First, escape special regex characters except * and ?
    regexPattern = regexPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')

    // Replace ** with a placeholder to avoid conflicts
    regexPattern = regexPattern.replace(/\*\*/g, '__DOUBLESTAR__')

    // Replace single * with pattern that doesn't cross directory boundaries
    regexPattern = regexPattern.replace(/\*/g, '[^/]*')

    // Replace ** placeholder with pattern that can cross directories
    regexPattern = regexPattern.replace(/__DOUBLESTAR__/g, '.*')

    // Handle single character match
    regexPattern = regexPattern.replace(/\?/g, '[^/]')

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(file)
  }

  private async runLintCommand(command: string, files: string[]): Promise<boolean> {
    try {
      const finalCommand = command.includes('{files}')
        ? command.replace('{files}', files.join(' '))
        : `${command} ${files.join(' ')}`

      this.log(`Running command on ${files.length} file(s): ${command}`)
      if (this.verbose) {
        this.log(`Files: ${files.join(', ')}`)
        this.log(`Full command: ${finalCommand}`)
      }

      const result = execSync(finalCommand, {
        cwd: this.projectRoot,
        stdio: this.verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8',
      })

      if (this.verbose && result) {
        console.warn(result)
      }

      this.log(`Command completed successfully for ${files.length} file(s)`)
      return true
    }
    catch (error: any) {
      // Any non-zero exit code indicates failure
      if (error.stdout && this.verbose)
        console.warn(error.stdout)
      if (error.stderr)
        console.error('[ERROR] Command stderr:', error.stderr)
      console.error(`[ERROR] Command failed: ${command}`)
      console.error(`[ERROR] Failed on files: ${files.join(', ')}`)
      return false
    }
  }

  private getModifiedFiles(originalContent: Map<string, string>): string[] {
    const modifiedFiles: string[] = []

    for (const [file, originalText] of originalContent) {
      try {
        const currentContent = fs.readFileSync(path.join(this.projectRoot, file), 'utf-8')
        if (currentContent !== originalText) {
          modifiedFiles.push(file)
        }
      }
      catch {
        // Skip files that can't be read
      }
    }

    return modifiedFiles
  }

  private restageFiles(files: string[]): void {
    if (files.length === 0)
      return

    try {
      execSync(`git add ${files.join(' ')}`, {
        cwd: this.projectRoot,
        stdio: this.verbose ? 'inherit' : 'pipe',
      })
    }
    catch (error) {
      throw new Error(`Failed to re-stage files: ${error}`)
    }
  }

  private async validateStagedFiles(config: StagedLintConfig): Promise<boolean> {
    const stagedFiles = this.getStagedFiles()

    for (const [pattern, commands] of Object.entries(config)) {
      const matchingFiles = this.getMatchingFiles(stagedFiles, pattern)
      if (matchingFiles.length === 0)
        continue

      const commandArray = Array.isArray(commands) ? commands : [commands]

      for (const command of commandArray) {
        // Remove --fix flag for validation
        const validationCommand = command.replace(/--fix\b/g, '').trim()

        const success = await this.runLintCommand(validationCommand, matchingFiles)
        if (!success) {
          return false
        }
      }
    }

    return true
  }

  private log(message: string): void {
    if (this.verbose) {
      console.warn(`[staged-lint] ${message}`)
    }
  }
}

/**
 * Enhanced staged lint function with configurable auto-restaging
 */
export async function runEnhancedStagedLint(
  config: StagedLintConfig,
  projectRoot: string = process.cwd(),
  options: { verbose?: boolean, autoRestage?: boolean } = {},
): Promise<boolean> {
  const { verbose = false, autoRestage = true } = options
  const processor = new StagedLintProcessor(projectRoot, verbose, autoRestage)
  return processor.process(config)
}

/**
 * Hook name mapping between camelCase and kebab-case
 */
export const HOOK_NAME_MAP: Record<string, string> = {
  'preCommit': 'pre-commit',
  'prepareCommitMsg': 'prepare-commit-msg',
  'commitMsg': 'commit-msg',
  'postCommit': 'post-commit',
  'prePush': 'pre-push',
  'postMerge': 'post-merge',
  'postCheckout': 'post-checkout',
  'preRebase': 'pre-rebase',
  'postRewrite': 'post-rewrite',
  // Reverse mapping
  'pre-commit': 'preCommit',
  'prepare-commit-msg': 'prepareCommitMsg',
  'commit-msg': 'commitMsg',
  'post-commit': 'postCommit',
  'pre-push': 'prePush',
  'post-merge': 'postMerge',
  'post-checkout': 'postCheckout',
  'pre-rebase': 'preRebase',
  'post-rewrite': 'postRewrite',
}

/**
 * Check if a hook name is valid (supports both camelCase and kebab-case)
 */
export function isValidHookName(hookName: string, validHooks: readonly string[]): boolean {
  // Check if it's directly in the valid hooks list (kebab-case)
  if (validHooks.includes(hookName)) {
    return true
  }

  // Check if it's a camelCase version that maps to a valid kebab-case hook
  const kebabCase = HOOK_NAME_MAP[hookName]
  if (kebabCase && validHooks.includes(kebabCase)) {
    return true
  }

  return false
}

/**
 * Main staged lint function that should be used by git hooks
 * This is the primary entry point for staged lint functionality
 */
export async function runStagedLint(
  hook: string,
  config: GitHooksConfig,
  projectRoot: string,
  verbose: boolean = false,
  autoRestage?: boolean,
): Promise<boolean> {
  if (!config) {
    console.error(`[ERROR] No configuration found`)
    return false
  }

  // Determine autoRestage setting: CLI option > hook config > global config > default true
  let shouldAutoRestage = autoRestage !== undefined ? autoRestage : true

  // Try both the original hook name and its mapped version
  const hookVariants = [hook, HOOK_NAME_MAP[hook]].filter(Boolean)

  // First check for hook-specific configuration
  for (const hookName of hookVariants) {
    if (hookName && hookName in config) {
      const hookConfig = config[hookName as keyof typeof config]
      if (typeof hookConfig === 'object' && !Array.isArray(hookConfig)) {
        const stagedLintConfig = (hookConfig as { 'stagedLint'?: StagedLintConfig, 'staged-lint'?: StagedLintConfig }).stagedLint
          || (hookConfig as { 'stagedLint'?: StagedLintConfig, 'staged-lint'?: StagedLintConfig })['staged-lint']

        // Check for hook-specific autoRestage setting
        const hookAutoRestage = (hookConfig as { autoRestage?: boolean }).autoRestage
        if (autoRestage === undefined && hookAutoRestage !== undefined) {
          shouldAutoRestage = hookAutoRestage
        }

        if (stagedLintConfig) {
          const processor = new StagedLintProcessor(projectRoot, verbose, shouldAutoRestage)
          return processor.process(stagedLintConfig)
        }
      }
    }
  }

  // If no hook-specific configuration, check for global stagedLint
  if (config.stagedLint || config['staged-lint']) {
    // Use global autoRestage if no CLI override
    if (autoRestage === undefined && config.autoRestage !== undefined) {
      shouldAutoRestage = config.autoRestage
    }

    const processor = new StagedLintProcessor(projectRoot, verbose, shouldAutoRestage)
    return processor.process(config.stagedLint || config['staged-lint']!)
  }

  console.error(`[ERROR] No staged lint configuration found for hook ${hook}`)
  return false
}
