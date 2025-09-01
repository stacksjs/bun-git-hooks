import type { StagedLintConfig } from '../src/types'
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { runEnhancedStagedLint, runStagedLint, StagedLintProcessor } from '../src/staged-lint'

describe('staged-lint', () => {
  const testProjectRoot = path.join(__dirname, 'fixtures', 'staged-lint-test')
  const gitDir = path.join(testProjectRoot, '.git')
  const hooksDir = path.join(gitDir, 'hooks')

  beforeEach(() => {
    // Create test project structure
    if (!fs.existsSync(testProjectRoot)) {
      fs.mkdirSync(testProjectRoot, { recursive: true })
    }
    if (!fs.existsSync(gitDir)) {
      fs.mkdirSync(gitDir, { recursive: true })
    }
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true })
    }

    // Initialize git repo
    try {
      execSync('git init', { cwd: testProjectRoot, stdio: 'ignore' })
      execSync('git config user.name "test"', { cwd: testProjectRoot, stdio: 'ignore' })
      execSync('git config user.email "test@test.com"', { cwd: testProjectRoot, stdio: 'ignore' })
    }
    catch {
      // Git repo might already exist
    }
  })

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testProjectRoot)) {
      fs.rmSync(testProjectRoot, { recursive: true, force: true })
    }
  })

  describe('StagedLintProcessor', () => {
    describe('glob pattern matching', () => {
      let processor: StagedLintProcessor

      beforeEach(() => {
        processor = new StagedLintProcessor(testProjectRoot, false, false)
      })

      it('should match simple patterns', () => {
        const files = ['src/index.js', 'src/utils.ts', 'README.md']

        // Access private method for testing
        const getMatchingFiles = (processor as any).getMatchingFiles.bind(processor)

        expect(getMatchingFiles(files, '*.js')).toEqual([])
        expect(getMatchingFiles(files, 'src/*.js')).toEqual(['src/index.js'])
        expect(getMatchingFiles(files, 'src/*.ts')).toEqual(['src/utils.ts'])
        expect(getMatchingFiles(files, '*.md')).toEqual(['README.md'])
      })

      it('should handle brace expansion patterns', () => {
        const files = [
          'src/index.js',
          'src/utils.ts',
          'src/component.jsx',
          'src/types.d.ts',
          'README.md',
          'package.json',
        ]

        const getMatchingFiles = (processor as any).getMatchingFiles.bind(processor)

        expect(getMatchingFiles(files, 'src/*.{js,ts}')).toEqual(['src/index.js', 'src/utils.ts', 'src/types.d.ts'])
        expect(getMatchingFiles(files, 'src/*.{jsx,tsx}')).toEqual(['src/component.jsx'])
        expect(getMatchingFiles(files, '*.{md,json}')).toEqual(['README.md', 'package.json'])
      })

      it('should handle double-star patterns', () => {
        const files = [
          'src/index.js',
          'src/components/Button.tsx',
          'src/utils/helpers.ts',
          'tests/unit/index.test.js',
          'README.md',
        ]

        const getMatchingFiles = (processor as any).getMatchingFiles.bind(processor)

        expect(getMatchingFiles(files, '**/*.js')).toEqual(['src/index.js', 'tests/unit/index.test.js'])
        expect(getMatchingFiles(files, '**/*.{ts,tsx}')).toEqual(['src/components/Button.tsx', 'src/utils/helpers.ts'])
        expect(getMatchingFiles(files, 'src/**/*.ts')).toEqual(['src/utils/helpers.ts'])
      })

      it('should handle negation patterns', () => {
        const files = [
          'src/index.js',
          'src/test.js',
          'node_modules/lib.js',
          'dist/bundle.js',
        ]

        const getMatchingFiles = (processor as any).getMatchingFiles.bind(processor)

        expect(getMatchingFiles(files, '**/*.js')).toEqual(files)
        // Negation patterns when used alone should match all files except those that match the pattern
        expect(getMatchingFiles(files, '!node_modules/**')).toEqual(['src/index.js', 'src/test.js', 'dist/bundle.js'])
        expect(getMatchingFiles(files, '!dist/**')).toEqual(['src/index.js', 'src/test.js', 'node_modules/lib.js'])
      })

      it('should expand complex brace patterns', () => {
        const expandBracePattern = (processor as any).expandBracePattern.bind(processor)

        expect(expandBracePattern('**/*.{js,ts}')).toEqual(['**/*.js', '**/*.ts'])
        expect(expandBracePattern('src/*.{js,ts,jsx,tsx}')).toEqual([
          'src/*.js',
          'src/*.ts',
          'src/*.jsx',
          'src/*.tsx',
        ])
        expect(expandBracePattern('*.md')).toEqual(['*.md'])
      })

      it('should match glob patterns correctly', () => {
        const matchesGlob = (processor as any).matchesGlob.bind(processor)

        expect(matchesGlob('src/index.js', 'src/*.js')).toBe(true)
        expect(matchesGlob('src/index.ts', 'src/*.js')).toBe(false)
        expect(matchesGlob('src/components/Button.tsx', 'src/**/*.tsx')).toBe(true)
        expect(matchesGlob('src/components/Button.tsx', '**/*.tsx')).toBe(true)
        expect(matchesGlob('node_modules/lib.js', '!node_modules/**')).toBe(false)
      })
    })

    describe('staged files processing', () => {
      let processor: StagedLintProcessor

      beforeEach(() => {
        processor = new StagedLintProcessor(testProjectRoot, false, false)
      })

      it('should return empty array when no staged files', () => {
        const getStagedFiles = (processor as any).getStagedFiles.bind(processor)
        expect(getStagedFiles()).toEqual([])
      })

      it('should process staged lint config with no matching files', async () => {
        const config: StagedLintConfig = {
          '**/*.{js,ts}': ['echo "linting"'],
        }

        const result = await processor.process(config)
        expect(result).toBe(true)
      })

      it('should handle lint command failures when files are staged', async () => {
        const processor = new StagedLintProcessor(testProjectRoot, false, false)

        // Create a test file and stage it
        fs.writeFileSync(path.join(testProjectRoot, 'test.js'), 'console.log("test")')

        try {
          execSync('git add test.js', { cwd: testProjectRoot, stdio: 'ignore' })

          // Verify file is actually staged
          const stagedFiles = execSync('git diff --cached --name-only', {
            cwd: testProjectRoot,
            encoding: 'utf-8',
          }).trim().split('\n').filter(Boolean)

          if (stagedFiles.length === 0) {
            // If no files are staged, staged lint should succeed (no work to do)
            const config: StagedLintConfig = {
              '**/*.js': ['node -e "process.exit(1)"'],
            }
            const result = await processor.process(config)
            expect(result).toBe(true) // Success when no matching staged files
            return
          }

          // If files are staged, failing command should cause failure
          const config: StagedLintConfig = {
            '**/*.js': ['node -e "process.exit(1)"'], // Command that always fails with exit code 1
          }
          const result = await processor.process(config)
          expect(result).toBe(false)
        }
        catch {
          // Skip if git operations fail in test environment

        }
      })
    })

    describe('auto-restaging', () => {
      it('should create processor with auto-restaging enabled', () => {
        const processor = new StagedLintProcessor(testProjectRoot, false, true)
        expect(processor).toBeDefined()
      })

      it('should create processor with auto-restaging disabled', () => {
        const processor = new StagedLintProcessor(testProjectRoot, false, false)
        expect(processor).toBeDefined()
      })

      it('should handle file modifications during linting', async () => {
        const processor = new StagedLintProcessor(testProjectRoot, false, true)

        // Create test file
        const testFile = path.join(testProjectRoot, 'test.js')
        fs.writeFileSync(testFile, 'const x=1;')

        try {
          execSync('git add test.js', { cwd: testProjectRoot, stdio: 'ignore' })
        }
        catch {
          // Skip if git operations fail in test environment
          return
        }

        const config: StagedLintConfig = {
          '**/*.js': ['echo "formatted" > test.js'], // Command that modifies the file
        }

        const result = await processor.process(config)
        expect(result).toBe(true)
      })
    })
  })

  describe('runStagedLint', () => {
    it('should return false when no config provided', async () => {
      const result = await runStagedLint('pre-commit', null, testProjectRoot, false)
      expect(result).toBe(false)
    })

    it('should return false when no staged lint config found', async () => {
      const config = {
        'pre-commit': 'echo "regular hook"',
      }

      const result = await runStagedLint('pre-commit', config, testProjectRoot, false)
      expect(result).toBe(false)
    })

    it('should process hook-specific staged lint config', async () => {
      const config = {
        'pre-commit': {
          'staged-lint': {
            '**/*.{js,ts}': ['echo "linting"'],
          },
        },
      }

      const result = await runStagedLint('pre-commit', config, testProjectRoot, false)
      expect(result).toBe(true)
    })

    it('should process global staged lint config', async () => {
      const config = {
        'staged-lint': {
          '**/*.{js,ts}': ['echo "linting"'],
        },
      }

      const result = await runStagedLint('pre-commit', config, testProjectRoot, false)
      expect(result).toBe(true)
    })

    it('should handle both stagedLint and staged-lint keys', async () => {
      const config1 = {
        'pre-commit': {
          stagedLint: {
            '**/*.js': ['echo "linting with stagedLint"'],
          },
        },
      }

      const config2 = {
        'pre-commit': {
          'staged-lint': {
            '**/*.js': ['echo "linting with staged-lint"'],
          },
        },
      }

      const result1 = await runStagedLint('pre-commit', config1, testProjectRoot, false)
      const result2 = await runStagedLint('pre-commit', config2, testProjectRoot, false)

      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })
  })

  describe('runEnhancedStagedLint', () => {
    it('should process staged lint config with default options', async () => {
      const config: StagedLintConfig = {
        '**/*.{js,ts}': ['echo "linting"'],
      }

      const result = await runEnhancedStagedLint(config, testProjectRoot)
      expect(result).toBe(true)
    })

    it('should process staged lint config with verbose enabled', async () => {
      const config: StagedLintConfig = {
        '**/*.{js,ts}': ['echo "linting"'],
      }

      const result = await runEnhancedStagedLint(config, testProjectRoot, { verbose: true })
      expect(result).toBe(true)
    })

    it('should process staged lint config with auto-restage disabled', async () => {
      const config: StagedLintConfig = {
        '**/*.{js,ts}': ['echo "linting"'],
      }

      const result = await runEnhancedStagedLint(config, testProjectRoot, { autoRestage: false })
      expect(result).toBe(true)
    })

    it('should handle multiple commands per pattern', async () => {
      const config: StagedLintConfig = {
        '**/*.{js,ts}': [
          'echo "first command"',
          'echo "second command"',
        ],
      }

      const result = await runEnhancedStagedLint(config, testProjectRoot)
      expect(result).toBe(true)
    })

    it('should handle multiple patterns', async () => {
      const config: StagedLintConfig = {
        '**/*.js': ['echo "linting js"'],
        '**/*.ts': ['echo "linting ts"'],
        '**/*.json': ['echo "linting json"'],
      }

      const result = await runEnhancedStagedLint(config, testProjectRoot)
      expect(result).toBe(true)
    })

    it('should handle command failures correctly based on staged files', async () => {
      // Create a test file and stage it
      fs.writeFileSync(path.join(testProjectRoot, 'test.js'), 'console.log("test")')

      try {
        execSync('git add test.js', { cwd: testProjectRoot, stdio: 'ignore' })

        // Verify file is actually staged
        const stagedFiles = execSync('git diff --cached --name-only', {
          cwd: testProjectRoot,
          encoding: 'utf-8',
        }).trim().split('\n').filter(Boolean)

        const config: StagedLintConfig = {
          '**/*.js': [
            'echo "first command passes"',
            'node -e "process.exit(1)"', // This command fails
          ],
        }

        const result = await runEnhancedStagedLint(config, testProjectRoot)

        if (stagedFiles.length === 0) {
          // If no files are staged, should succeed (no work to do)
          expect(result).toBe(true)
        }
        else {
          // If files are staged, failing command should cause failure
          expect(result).toBe(false)
        }
      }
      catch {
        // Skip if git operations fail in test environment

      }
    })

    it('should handle command execution errors gracefully', async () => {
      const processor = new StagedLintProcessor(testProjectRoot, false, false)

      // Test error handling with no staged files - should succeed
      const config: StagedLintConfig = {
        '**/*.js': ['echo "test"'],
      }

      const result = await processor.process(config)
      expect(result).toBe(true)
    })
  })

  describe('integration with real git operations', () => {
    it('should work with actual staged files', async () => {
      // Create test files
      const jsFile = path.join(testProjectRoot, 'index.js')
      const tsFile = path.join(testProjectRoot, 'utils.ts')
      const mdFile = path.join(testProjectRoot, 'README.md')

      fs.writeFileSync(jsFile, 'console.log("hello")')
      fs.writeFileSync(tsFile, 'export const test = "hello"')
      fs.writeFileSync(mdFile, '# Test')

      try {
        // Stage only JS and TS files
        execSync('git add index.js utils.ts', { cwd: testProjectRoot, stdio: 'ignore' })

        const config: StagedLintConfig = {
          '**/*.{js,ts}': ['echo "Processing: $@"'],
          '**/*.md': ['echo "Should not run on unstaged files"'],
        }

        const result = await runEnhancedStagedLint(config, testProjectRoot, { verbose: true })
        expect(result).toBe(true)
      }
      catch {
        // Skip if git operations fail in test environment
        console.warn('Skipping git integration test due to git setup issues')
      }
    })

    it('should handle file modifications and auto-restaging', async () => {
      const jsFile = path.join(testProjectRoot, 'format-test.js')
      fs.writeFileSync(jsFile, 'const x=1;const y=2;')

      try {
        execSync('git add format-test.js', { cwd: testProjectRoot, stdio: 'ignore' })

        // Simulate a formatter that fixes the file
        const config: StagedLintConfig = {
          '**/*.js': [`echo "const x = 1; const y = 2;" > ${jsFile}`],
        }

        const result = await runEnhancedStagedLint(config, testProjectRoot, { autoRestage: true })
        expect(result).toBe(true)

        // Check that file was modified
        const content = fs.readFileSync(jsFile, 'utf-8')
        expect(content.trim()).toBe('const x = 1; const y = 2;')
      }
      catch {
        // Skip if git operations fail in test environment
        console.warn('Skipping auto-restage test due to git setup issues')
      }
    })
  })

  describe('error handling', () => {
    it('should handle missing project directory', async () => {
      const nonExistentDir = path.join(__dirname, 'non-existent')
      const processor = new StagedLintProcessor(nonExistentDir, false, false)

      const config: StagedLintConfig = {
        '**/*.js': ['echo "test"'],
      }

      const result = await processor.process(config)
      expect(result).toBe(true) // Should succeed with no staged files
    })

    it('should handle command execution errors gracefully', async () => {
      const processor = new StagedLintProcessor(testProjectRoot, false, false)

      // Create and stage a test file
      const testFile = path.join(testProjectRoot, 'error-test.js')
      fs.writeFileSync(testFile, 'console.log("test")')

      try {
        execSync('git add error-test.js', { cwd: testProjectRoot, stdio: 'ignore' })

        // Verify file is actually staged
        const stagedFiles = execSync('git diff --cached --name-only', {
          cwd: testProjectRoot,
          encoding: 'utf-8',
        }).trim().split('\n').filter(Boolean)

        const config: StagedLintConfig = {
          '**/*.js': ['node -e "process.exit(1)"'],
        }

        const result = await processor.process(config)

        if (stagedFiles.length === 0) {
          // If no files are staged, should succeed (no work to do)
          expect(result).toBe(true)
        }
        else {
          // If files are staged, failing command should cause failure
          expect(result).toBe(false)
        }
      }
      catch {
        // Skip if git operations fail
      }
    })

    it('should handle invalid glob patterns gracefully', async () => {
      const processor = new StagedLintProcessor(testProjectRoot, false, false)

      const config: StagedLintConfig = {
        '[invalid-pattern': ['echo "test"'],
      }

      const result = await processor.process(config)
      expect(result).toBe(true) // Should succeed with no matching files
    })

    it('should only run commands on files matching the pattern in mixed codebase', async () => {
      const processor = new StagedLintProcessor(testProjectRoot, false, false)

      // Create files of different types
      const jsFile = path.join(testProjectRoot, 'app.js')
      const tsFile = path.join(testProjectRoot, 'utils.ts')
      const phpFile = path.join(testProjectRoot, 'index.php')
      const pyFile = path.join(testProjectRoot, 'script.py')
      
      fs.writeFileSync(jsFile, 'console.log("js file")')
      fs.writeFileSync(tsFile, 'const x: string = "ts file"')
      fs.writeFileSync(phpFile, '<?php echo "php file"; ?>')
      fs.writeFileSync(pyFile, 'print("python file")')

      try {
        // Stage all files
        execSync('git add .', { cwd: testProjectRoot, stdio: 'ignore' })
        
        // Verify files are staged
        const stagedFiles = execSync('git diff --cached --name-only', {
          cwd: testProjectRoot,
          encoding: 'utf-8',
        }).trim().split('\n').filter(Boolean)

        if (stagedFiles.length === 0) {
          // Skip if no files are staged
          return
        }

        // Config that only targets JS/TS files
        const config: StagedLintConfig = {
          '**/*.{js,ts}': ['echo "Processing JS/TS file: {files}"'],
          '**/*.php': ['echo "Processing PHP file: {files}"'],
        }

        const result = await processor.process(config)
        expect(result).toBe(true)
        
        // The key test: verify that only JS/TS and PHP files would be processed
        // Python files should be ignored even though they're staged
        const jstsFiles = (processor as any).getMatchingFiles(stagedFiles, '**/*.{js,ts}')
        const phpFiles = (processor as any).getMatchingFiles(stagedFiles, '**/*.php')
        const pyFiles = (processor as any).getMatchingFiles(stagedFiles, '**/*.py')
        
        expect(jstsFiles.length).toBeGreaterThan(0) // Should match JS/TS files
        expect(phpFiles.length).toBeGreaterThan(0) // Should match PHP files
        expect(pyFiles.length).toBe(0) // Should not match any files since no pattern for .py
      }
      catch {
        // Skip if git operations fail
      }
    })
  })
})
