import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { version as packageVersion } from '../package.json'
import gitHooks from '../src/git-hooks'

// Util functions:

describe('bun-git-hooks', () => {
  /**
   * This section of tests is used to test how simple util functions perform
   * If you are adding a new util function, you should create unit test suite (describe) for it
   */
  describe('unit tests', () => {
    describe('getProjectRootDirectory', () => {
      it('returns correct dir in typical case:', () => {
        expect(
          gitHooks.getProjectRootDirectoryFromNodeModules(
            'var/my-project/node_modules/bun-git-hooks',
          ),
        ).toBe('var/my-project')
      })

      it('returns correct dir when used with windows delimiters:', () => {
        expect(
          gitHooks.getProjectRootDirectoryFromNodeModules(
            'user\\allProjects\\project\\node_modules\\bun-git-hooks',
          ),
        ).toBe('user/allProjects/project')
      })

      it('falls back to undefined when we are not in node_modules:', () => {
        expect(
          gitHooks.getProjectRootDirectoryFromNodeModules(
            'var/my-project/bun-git-hooks',
          ),
        ).toBeUndefined()
      })

      it('return correct dir when installed using bun:', () => {
        expect(
          gitHooks.getProjectRootDirectoryFromNodeModules(
            `var/my-project/node_modules/.bin/bun-git-hooks`,
          ),
        ).toBe('var/my-project')
        expect(
          gitHooks.getProjectRootDirectoryFromNodeModules(
            `var/my-project/node_modules/.bin/bun-git-hooks`,
          ),
        ).toBe('var/my-project')
      })
    })

    describe('getGitProjectRoot', () => {
      const gitProjectRoot = path.normalize(path.join(__dirname, '.git'))
      const currentPath = path.normalize(path.join(__dirname))
      const currentFilePath = path.normalize(path.join(__filename))

      it('works from .git directory itself', () => {
        expect(gitHooks.getGitProjectRoot(gitProjectRoot)).toBe(gitProjectRoot)
      })

      it('works from any directory', () => {
        expect(gitHooks.getGitProjectRoot(currentPath)).toBe(gitProjectRoot)
      })

      it('works from any file', () => {
        expect(gitHooks.getGitProjectRoot(currentFilePath)).toBe(gitProjectRoot)
      })
    })

    describe('checkBunGitHooksInDependencies', () => {
      const PROJECT_WITH_SIMPLE_GIT_HOOKS_IN_DEPS = path.normalize(
        path.join(process.cwd(), '_tests', 'project_with_simple_git_hooks_in_deps'),
      )
      const PROJECT_WITH_SIMPLE_GIT_HOOKS_IN_DEV_DEPS = path.normalize(
        path.join(
          process.cwd(),
          '_tests',
          'project_with_simple_git_hooks_in_dev_deps',
        ),
      )
      const PROJECT_WITHOUT_SIMPLE_GIT_HOOKS = path.normalize(
        path.join(process.cwd(), '_tests', 'project_without_simple_git_hooks'),
      )
      it('returns true if simple-git-hooks really in deps', () => {
        expect(
          gitHooks.checkBunGitHooksInDependencies(PROJECT_WITH_SIMPLE_GIT_HOOKS_IN_DEPS),
        ).toBe(true)
      })

      it('returns true if simple-git-hooks really in devDeps', () => {
        expect(
          gitHooks.checkBunGitHooksInDependencies(PROJECT_WITH_SIMPLE_GIT_HOOKS_IN_DEV_DEPS),
        ).toBe(true)
      })

      it('returns false if simple-git-hooks isn`t in deps', () => {
        expect(
          gitHooks.checkBunGitHooksInDependencies(PROJECT_WITHOUT_SIMPLE_GIT_HOOKS),
        ).toBe(false)
      })
    })
  })

  /**
   * This section of tests should test end 2 end use scenarios.
   * If you are adding a new feature, you should create an e2e test suite (describe) for it
   */
  describe('e2E tests', () => {
    const TEST_SCRIPT = `${gitHooks.PREPEND_SCRIPT}exit 1`
    const COMMON_GIT_HOOKS = { 'pre-commit': TEST_SCRIPT, 'pre-push': TEST_SCRIPT }

    // To test this package, we often need to create and manage files.
    // Best to use real file system and real files under _tests folder
    const testsFolder = path.normalize(path.join(process.cwd(), 'test/fixtures'))

    // Configuration in Package.json
    const PROJECT_WITH_CONF_IN_PACKAGE_JSON = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_package_json'),
    )

    // Configuration in .js file
    const PROJECT_WITH_CONF_IN_SEPARATE_JS = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_separate_js'),
    )
    const PROJECT_WITH_CONF_IN_SEPARATE_JS_ALT = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_alternative_separate_js'),
    )

    // Configuration in .cjs file
    const PROJECT_WITH_CONF_IN_SEPARATE_CJS = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_separate_cjs'),
    )
    const PROJECT_WITH_CONF_IN_SEPARATE_CJS_ALT = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_alternative_separate_cjs'),
    )

    // Configuration in .json file
    const PROJECT_WITH_CONF_IN_SEPARATE_JSON = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_separate_json'),
    )
    const PROJECT_WITH_CONF_IN_SEPARATE_JSON_ALT = path.normalize(
      path.join(testsFolder, 'project_with_configuration_in_alternative_separate_json'),
    )

    // Other correct configurations
    const PROJECT_WITH_UNUSED_CONF_IN_PACKAGE_JSON = path.normalize(
      path.join(testsFolder, 'project_with_unused_configuration_in_package_json'),
    )
    const PROJECT_WITH_CUSTOM_CONF = path.normalize(
      path.join(testsFolder, 'project_with_custom_configuration'),
    )

    // Incorrect configurations
    const PROJECT_WITH_BAD_CONF_IN_PACKAGE_JSON_ = path.normalize(
      path.join(testsFolder, 'project_with_incorrect_configuration_in_package_json'),
    )
    const PROJECT_WO_CONF = path.normalize(
      path.join(testsFolder, 'project_without_configuration'),
    )

    /**
     * Creates .git/hooks dir from root
     * @param {string} root
     */
    function createGitHooksFolder(root: string) {
      if (fs.existsSync(`${root}/.git`)) {
        return
      }
      fs.mkdirSync(`${root}/.git`)
      fs.mkdirSync(`${root}/.git/hooks`)
    }

    /**
     * Removes .git directory from root
     * @param {string} root
     */
    function removeGitHooksFolder(root: string) {
      if (fs.existsSync(`${root}/.git`)) {
        fs.rmdirSync(`${root}/.git`, { recursive: true })
      }
    }

    /**
     * Returns all installed git hooks
     * @return { {string: string} }
     */
    function getInstalledGitHooks(hooksDir: string) {
      const result: Record<string, string> = {}

      const hooks = fs.readdirSync(hooksDir)

      for (const hook of hooks) {
        result[hook] = fs
          .readFileSync(path.normalize(path.join(hooksDir, hook)))
          .toString()
      }

      return result
    }

    describe('configuration tests', () => {
      describe('valid configurations', () => {
        it('creates git hooks if configuration is correct from .simple-git-hooks.js', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_SEPARATE_JS_ALT)

          gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_SEPARATE_JS_ALT)
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(
                PROJECT_WITH_CONF_IN_SEPARATE_JS_ALT,
                '.git',
                'hooks',
              ),
            ),
          )
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })

        it('creates git hooks if configuration is correct from .simple-git-hooks.cjs', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_SEPARATE_CJS_ALT)

          gitHooks.setHooksFromConfig(
            PROJECT_WITH_CONF_IN_SEPARATE_CJS_ALT,
          )
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(
                PROJECT_WITH_CONF_IN_SEPARATE_CJS_ALT,
                '.git',
                'hooks',
              ),
            ),
          )
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })

        it('creates git hooks if configuration is correct from simple-git-hooks.cjs', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_SEPARATE_CJS)

          gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_SEPARATE_CJS)
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_SEPARATE_CJS, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })

        it('creates git hooks if configuration is correct from simple-git-hooks.js', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_SEPARATE_JS)

          gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_SEPARATE_JS)
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_SEPARATE_JS, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })

        it('creates git hooks if configuration is correct from .simple-git-hooks.json', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_SEPARATE_JSON_ALT)

          gitHooks.setHooksFromConfig(
            PROJECT_WITH_CONF_IN_SEPARATE_JSON_ALT,
          )
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(
                PROJECT_WITH_CONF_IN_SEPARATE_JSON_ALT,
                '.git',
                'hooks',
              ),
            ),
          )
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })

        it('creates git hooks if configuration is correct from simple-git-hooks.json', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_SEPARATE_JSON)

          gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_SEPARATE_JSON)
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_SEPARATE_JSON, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })

        it('creates git hooks if configuration is correct from package.json', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)

          gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_PACKAGE_JSON, {
            configFile: 'git-hooks.js',
          })
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual({ 'pre-commit': TEST_SCRIPT })
        })
      })

      describe('invalid configurations', () => {
        it('fails to create git hooks if configuration contains bad git hooks', () => {
          createGitHooksFolder(PROJECT_WITH_BAD_CONF_IN_PACKAGE_JSON_)

          expect(() =>
            gitHooks.setHooksFromConfig(PROJECT_WITH_BAD_CONF_IN_PACKAGE_JSON_),
          ).toThrow(
            '[ERROR] Config was not in correct format. Please check git hooks or options name',
          )
        })

        it('fails to create git hooks if not configured', () => {
          createGitHooksFolder(PROJECT_WO_CONF)

          expect(() => gitHooks.setHooksFromConfig(PROJECT_WO_CONF)).toThrow(
            '[ERROR] Config was not found! Please add `.simple-git-hooks.js` or `simple-git-hooks.js` or `.simple-git-hooks.json` or `simple-git-hooks.json` or `simple-git-hooks` entry in package.json.',
          )
        })
      })
    })

    describe('remove hooks tests', () => {
      it('removes git hooks', () => {
        createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)

        gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_PACKAGE_JSON)

        let installedHooks = getInstalledGitHooks(
          path.normalize(
            path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
          ),
        )
        expect(installedHooks).toEqual({ 'pre-commit': TEST_SCRIPT })

        gitHooks.removeHooks(PROJECT_WITH_CONF_IN_PACKAGE_JSON)

        installedHooks = getInstalledGitHooks(
          path.normalize(
            path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
          ),
        )
        expect(installedHooks).toEqual({})
      })

      it('creates git hooks and removes unused git hooks', () => {
        createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)

        const installedHooksDir = path.normalize(
          path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
        )

        fs.writeFileSync(
          path.resolve(installedHooksDir, 'pre-push'),
          '# do nothing',
        )

        let installedHooks = getInstalledGitHooks(installedHooksDir)
        expect(installedHooks).toEqual({ 'pre-push': '# do nothing' })

        gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_PACKAGE_JSON)

        installedHooks = getInstalledGitHooks(installedHooksDir)
        expect(installedHooks).toEqual({ 'pre-commit': TEST_SCRIPT })
      })

      it('creates git hooks and removes unused but preserves specific git hooks', () => {
        createGitHooksFolder(PROJECT_WITH_UNUSED_CONF_IN_PACKAGE_JSON)

        const installedHooksDir = path.normalize(
          path.join(
            PROJECT_WITH_UNUSED_CONF_IN_PACKAGE_JSON,
            '.git',
            'hooks',
          ),
        )

        fs.writeFileSync(
          path.resolve(installedHooksDir, 'commit-msg'),
          '# do nothing',
        )
        fs.writeFileSync(
          path.resolve(installedHooksDir, 'pre-push'),
          '# do nothing',
        )

        let installedHooks = getInstalledGitHooks(installedHooksDir)
        expect(installedHooks).toEqual({
          'commit-msg': '# do nothing',
          'pre-push': '# do nothing',
        })

        gitHooks.setHooksFromConfig(PROJECT_WITH_UNUSED_CONF_IN_PACKAGE_JSON)

        installedHooks = getInstalledGitHooks(installedHooksDir)
        expect(installedHooks).toEqual({
          'commit-msg': '# do nothing',
          'pre-commit': TEST_SCRIPT,
        })
      })
    })

    describe('CLI tests', () => {
      const testCases = [
        ['bunx', 'bun-git-hooks', './git-hooks.config.ts'],
        ['bun', require.resolve(`../bin/cli`), './git-hooks.config.ts'],
        [
          'node',
          require.resolve(`../bin/cli`),
          require.resolve(`${PROJECT_WITH_CUSTOM_CONF}/git-hooks.config.ts`),
        ],
      ]

      testCases.forEach((args) => {
        it(`creates git hooks and removes unused but preserves specific git hooks for command: ${args.join(
          ' ',
        )}`, () => {
          createGitHooksFolder(PROJECT_WITH_CUSTOM_CONF)

          gitHooks.setHooksFromConfig(PROJECT_WITH_CUSTOM_CONF)
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CUSTOM_CONF, '.git', 'hooks'),
            ),
          )
          expect(JSON.stringify(installedHooks)).toBe(JSON.stringify(COMMON_GIT_HOOKS))
          expect(installedHooks).toEqual(COMMON_GIT_HOOKS)
        })
      })

      describe('sKIP_INSTALL_SIMPLE_GIT_HOOKS', () => {
        afterEach(() => {
          removeGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })

        it('does not create git hooks when SKIP_INSTALL_SIMPLE_GIT_HOOKS is set to 1', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
          execSync(`node ${require.resolve('./cli')}`, {
            cwd: PROJECT_WITH_CONF_IN_PACKAGE_JSON,
            env: {
              ...process.env,
              SKIP_INSTALL_SIMPLE_GIT_HOOKS: '1',
            },
          })
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual({})
        })

        it('creates git hooks when SKIP_INSTALL_SIMPLE_GIT_HOOKS is set to 0', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
          execSync(`node ${require.resolve('./cli')}`, {
            cwd: PROJECT_WITH_CONF_IN_PACKAGE_JSON,
            env: {
              ...process.env,
              SKIP_INSTALL_SIMPLE_GIT_HOOKS: '0',
            },
          })
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual({ 'pre-commit': TEST_SCRIPT })
        })

        it('creates git hooks when SKIP_INSTALL_SIMPLE_GIT_HOOKS is not set', () => {
          createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
          execSync(`node ${require.resolve('./cli')}`, {
            cwd: PROJECT_WITH_CONF_IN_PACKAGE_JSON,
          })
          const installedHooks = getInstalledGitHooks(
            path.normalize(
              path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, '.git', 'hooks'),
            ),
          )
          expect(installedHooks).toEqual({ 'pre-commit': TEST_SCRIPT })
        })
      })
    })

    describe('eNV vars features tests', () => {
      const GIT_USER_NAME = 'github-actions'
      const GIT_USER_EMAIL = 'github-actions@github.com'

      const initializeGitRepository = (path: string) => {
        execSync(
          `git init \
            && git config user.name ${GIT_USER_NAME} \
            && git config user.email ${GIT_USER_EMAIL}`,
          { cwd: path },
        )
      }

      const tryToPerformTestCommit = (path: string, env = process.env) => {
        try {
          execSync(
            'git add . && git commit --allow-empty -m "Test commit" && git commit --allow-empty -am "Change commit msg"',
            { cwd: path, env },
          )
          return true
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (e) {
          return false
        }
      }

      const expectCommitToSucceed = (path: string) => {
        expect(tryToPerformTestCommit(path)).toBe(true)
      }

      const expectCommitToFail = (path: string) => {
        expect(tryToPerformTestCommit(path)).toBe(false)
      }

      beforeEach(() => {
        initializeGitRepository(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        createGitHooksFolder(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        gitHooks.setHooksFromConfig(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
      })

      describe('sKIP_SIMPLE_GIT_HOOKS', () => {
        afterEach(() => {
          delete process.env.SKIP_SIMPLE_GIT_HOOKS
        })

        it('commits successfully when SKIP_SIMPLE_GIT_HOOKS is set to "1"', () => {
          process.env.SKIP_SIMPLE_GIT_HOOKS = '1'
          expectCommitToSucceed(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })

        it('fails to commit when SKIP_SIMPLE_GIT_HOOKS is not set', () => {
          expectCommitToFail(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })

        it('fails to commit when SKIP_SIMPLE_GIT_HOOKS is set to "0"', () => {
          process.env.SKIP_SIMPLE_GIT_HOOKS = '0'
          expectCommitToFail(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })

        it('fails to commit when SKIP_SIMPLE_GIT_HOOKS is set to a random string', () => {
          process.env.SKIP_SIMPLE_GIT_HOOKS = 'simple-git-hooks'
          expectCommitToFail(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })
      })

      describe('BUN_GIT_HOOKS_RC', () => {
        afterEach(() => {
          delete process.env.BUN_GIT_HOOKS_RC
        })

        it('fails to commit when BUN_GIT_HOOKS_RC is not set', () => {
          expectCommitToFail(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })

        it('commits successfully when BUN_GIT_HOOKS_RC points to initrc_that_prevents_hook_fail.sh', () => {
          process.env.BUN_GIT_HOOKS_RC = path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, 'initrc_that_prevents_hook_fail.sh')
          expectCommitToSucceed(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })

        it('fails to commit when BUN_GIT_HOOKS_RC points to initrc_that_does_nothing.sh', () => {
          process.env.BUN_GIT_HOOKS_RC = path.join(PROJECT_WITH_CONF_IN_PACKAGE_JSON, 'initrc_that_does_nothing.sh')
          expectCommitToFail(PROJECT_WITH_CONF_IN_PACKAGE_JSON)
        })
      })
    })

    afterEach(() => {
      [
        PROJECT_WITH_CONF_IN_SEPARATE_JS_ALT,
        PROJECT_WITH_CONF_IN_SEPARATE_CJS_ALT,
        PROJECT_WITH_CONF_IN_SEPARATE_CJS,
        PROJECT_WITH_CONF_IN_SEPARATE_JS,
        PROJECT_WITH_CONF_IN_SEPARATE_JSON_ALT,
        PROJECT_WITH_CONF_IN_SEPARATE_JSON,
        PROJECT_WITH_CONF_IN_PACKAGE_JSON,
        PROJECT_WITH_BAD_CONF_IN_PACKAGE_JSON_,
        PROJECT_WO_CONF,
        PROJECT_WITH_CONF_IN_PACKAGE_JSON,
        PROJECT_WITH_UNUSED_CONF_IN_PACKAGE_JSON,
        PROJECT_WITH_CUSTOM_CONF,
      ].forEach((testCase) => {
        removeGitHooksFolder(testCase)
      })
    })
  })
})
