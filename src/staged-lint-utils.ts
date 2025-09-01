import type { StagedLintConfig } from './types'

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
        if (matchingFiles.length === 0) continue

        this.log(`Processing pattern "${pattern}" for ${matchingFiles.length} files`)

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
      } else if (!this.autoRestage) {
        // Check if files were modified but not restaged
        const modifiedFiles = this.getModifiedFiles(originalContent)
        if (modifiedFiles.length > 0) {
          console.warn(`⚠️  Lint modified ${modifiedFiles.length} files but auto-restaging is disabled.`)
          console.warn(`   Modified files: ${modifiedFiles.join(', ')}`)
          console.warn(`   You may need to manually stage these files and commit again.`)
        }
      }

      return !hasErrors

    } catch (error) {
      console.error(`Staged lint process failed: ${error}`)
      return false
    }
  }

  private getStagedFiles(): string[] {
    try {
      const output = execSync('git diff --cached --name-only', {
        cwd: this.projectRoot,
        encoding: 'utf-8'
      })
      return output.trim().split('\n').filter(Boolean)
    } catch {
      return []
    }
  }

  private captureStagedContent(files: string[]): Map<string, string> {
    const content = new Map<string, string>()
    
    for (const file of files) {
      try {
        const stagedContent = execSync(`git show :${file}`, {
          cwd: this.projectRoot,
          encoding: 'utf-8'
        })
        content.set(file, stagedContent)
      } catch {
        try {
          const workingContent = fs.readFileSync(path.join(this.projectRoot, file), 'utf-8')
          content.set(file, workingContent)
        } catch {
          // Skip files that can't be read
        }
      }
    }
    
    return content
  }

  private getMatchingFiles(files: string[], pattern: string): string[] {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    const regex = new RegExp(`^${regexPattern}$`)
    return files.filter(file => regex.test(file))
  }

  private async runLintCommand(command: string, files: string[]): Promise<boolean> {
    try {
      const finalCommand = command.includes('{files}') 
        ? command.replace('{files}', files.join(' '))
        : `${command} ${files.join(' ')}`

      this.log(`Running: ${finalCommand}`)

      execSync(finalCommand, {
        cwd: this.projectRoot,
        stdio: this.verbose ? 'inherit' : 'pipe'
      })

      return true
    } catch (error: any) {
      if (error.status === 1) {
        // Lint errors
        console.error(`Lint errors in files: ${files.join(', ')}`)
        return false
      } else {
        // Other errors
        console.error(`Command failed: ${command} - ${error.message}`)
        return false
      }
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
      } catch {
        // Skip files that can't be read
      }
    }

    return modifiedFiles
  }

  private restageFiles(files: string[]): void {
    if (files.length === 0) return

    try {
      execSync(`git add ${files.join(' ')}`, {
        cwd: this.projectRoot,
        stdio: this.verbose ? 'inherit' : 'pipe'
      })
    } catch (error) {
      throw new Error(`Failed to re-stage files: ${error}`)
    }
  }

  private async validateStagedFiles(config: StagedLintConfig): Promise<boolean> {
    const stagedFiles = this.getStagedFiles()
    
    for (const [pattern, commands] of Object.entries(config)) {
      const matchingFiles = this.getMatchingFiles(stagedFiles, pattern)
      if (matchingFiles.length === 0) continue

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
  options: { verbose?: boolean; autoRestage?: boolean } = {}
): Promise<boolean> {
  const { verbose = false, autoRestage = true } = options
  const processor = new StagedLintProcessor(projectRoot, verbose, autoRestage)
  return processor.process(config)
}
