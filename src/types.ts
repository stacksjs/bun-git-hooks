import type { VALID_GIT_HOOKS } from './git-hooks'

export type StagedLintTask = string | string[]

export interface StagedLintConfig {
  [pattern: string]: StagedLintTask
}

// Define camelCase hook names
type CamelCaseHooks = 
  | 'preCommit'
  | 'prepareCommitMsg' 
  | 'commitMsg'
  | 'postCommit'
  | 'prePush'
  | 'postMerge'
  | 'postCheckout'
  | 'preRebase'
  | 'postRewrite'

export type GitHooksConfig = {
  // Support both kebab-case (from VALID_GIT_HOOKS) and camelCase
  [K in typeof VALID_GIT_HOOKS[number] | CamelCaseHooks]?: string | {
    stagedLint?: StagedLintConfig
    'staged-lint'?: StagedLintConfig // Legacy support
  }
} & {
  preserveUnused?: boolean | (typeof VALID_GIT_HOOKS[number] | CamelCaseHooks)[]
  verbose?: boolean
  stagedLint?: StagedLintConfig
  'staged-lint'?: StagedLintConfig // Legacy support
  autoRestage?: boolean
}

export interface SetHooksFromConfigOptions {
  configFile?: GitHooksConfig
  verbose?: boolean
}
