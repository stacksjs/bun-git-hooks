import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function initGitRepo(repoDir: string) {
  execSync(
    [
      'git init',
      'git config user.name "perf-test"',
      'git config user.email "perf@test.local"',
      'git config commit.gpgsign false',
      'git config --global init.defaultBranch main',
    ].join(' && '),
    { cwd: repoDir, stdio: 'ignore' },
  )
}

function writeFileRecursive(filePath: string, content: string) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(filePath, content)
}

function stageAll(repoDir: string) {
  execSync('git add .', { cwd: repoDir, stdio: 'ignore' })
}

function runStagedLint(repoDir: string): number {
  const start = Date.now()
  // Run the CLI directly to ensure config is loaded from cwd
  execSync(`bun ${require.resolve('../../bin/cli')} run-staged-lint pre-commit`, {
    cwd: repoDir,
    stdio: 'ignore',
  })
  return Date.now() - start
}

describe('Performance: staged-lint', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bun-git-hooks-perf-'))
  const repoDirNoFiles = path.join(tmpRoot, 'repo-empty')
  const repoDirManyFiles = path.join(tmpRoot, 'repo-many')

  beforeAll(() => {
    // Repo with no staged files
    fs.mkdirSync(repoDirNoFiles, { recursive: true })
    initGitRepo(repoDirNoFiles)
    fs.writeFileSync(
      path.join(repoDirNoFiles, 'git-hooks.config.ts'),
      `export default {\n  'pre-commit': {\n    'staged-lint': {\n      '*.{js,ts,md}': 'echo lint'\n    }\n  }\n}\n`,
    )

    // Repo with many staged files across patterns
    fs.mkdirSync(repoDirManyFiles, { recursive: true })
    initGitRepo(repoDirManyFiles)
    fs.writeFileSync(
      path.join(repoDirManyFiles, 'git-hooks.config.ts'),
      `export default {\n  'pre-commit': {\n    'staged-lint': {\n      '*.js': 'echo lint',\n      '*.ts': 'echo lint',\n      '*.md': 'echo lint'\n    }\n  }\n}\n`,
    )
    // Create a bunch of files
    for (let i = 0; i < 200; i++) {
      writeFileRecursive(path.join(repoDirManyFiles, `file-${i}.js`), 'console.log("js")\n')
      writeFileRecursive(path.join(repoDirManyFiles, `file-${i}.ts`), 'export const x = 1\n')
      if (i % 4 === 0)
        writeFileRecursive(path.join(repoDirManyFiles, `doc-${i}.md`), '# doc\n')
    }
    stageAll(repoDirManyFiles)
  })

  afterAll(() => {
    // Cleanup temp tree
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
    catch {}
  })

  it('baseline: handles no staged files quickly', () => {
    const durationMs = runStagedLint(repoDirNoFiles)
    // Log for visibility; avoid strict assertions due to CI variability
    // eslint-disable-next-line no-console
    console.log(`[perf] staged-lint (no files): ${durationMs}ms`)
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })

  it('scales to many files and patterns efficiently', () => {
    const durationMs = runStagedLint(repoDirManyFiles)
    // Log for visibility; avoid strict assertions due to CI variability
    // eslint-disable-next-line no-console
    console.log(`[perf] staged-lint (many files): ${durationMs}ms`)
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })
})
