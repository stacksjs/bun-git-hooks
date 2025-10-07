#!/usr/bin/env bun

import { mkdir, symlink } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { areHooksInstalled, checkBunGitHooksInDependencies, getProjectRootDirectoryFromNodeModules, setHooksFromConfig } from '../src/git-hooks'

/**
 * Creates the pre-commit from command in config by default
 */
async function postinstall() {
  let projectDirectory

  /* When script is run after install, the process.cwd() would be like <project_folder>/node_modules/simple-git-hooks
     Here we try to get the original project directory by going upwards by 2 levels
     If we were not able to get new directory we assume, we are already in the project root */
  const parsedProjectDirectory = getProjectRootDirectoryFromNodeModules(process.cwd())
  if (parsedProjectDirectory !== undefined) {
    projectDirectory = parsedProjectDirectory
  }
  else {
    projectDirectory = process.cwd()
  }

  // Link the binary
  const binDir = join(projectDirectory, 'node_modules', '.bin')
  await mkdir(binDir, { recursive: true })

  const sourcePath = join(process.cwd(), 'dist', 'bin', 'cli.js')
  const targetPath = join(binDir, 'bun-git-hooks')
  const targetPath2 = join(binDir, 'git-hooks')

  try {
    await symlink(sourcePath, targetPath, 'file')
    await symlink(sourcePath, targetPath2, 'file')
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
      console.error(`[ERROR] Failed to link binary: ${err}`)
    }
  }

  if (checkBunGitHooksInDependencies(projectDirectory)) {
    try {
      // Check if hooks are already installed to avoid unnecessary reinstalls
      if (areHooksInstalled(projectDirectory)) {
        console.log('[INFO] Git hooks are already installed, skipping setup')
        return
      }

      setHooksFromConfig(projectDirectory)
      console.log('[INFO] Git hooks installed successfully')
    }
    catch (err) {
      console.log(`[ERROR] Was not able to set git hooks. Reason: ${err}`)
    }
  }
}

postinstall()
