import type { VALID_GIT_HOOKS } from './git-hooks'

export type StagedLintTask = string | string[]

export interface StagedLintConfig {
  [pattern: string]: StagedLintTask
}

export type GitHooksConfig = {
  [K in typeof VALID_GIT_HOOKS[number]]?: string | {
    'stagedLint'?: StagedLintConfig
    'staged-lint'?: StagedLintConfig
  }
} & {
  'preserveUnused'?: boolean | typeof VALID_GIT_HOOKS[number][]
  'verbose'?: boolean
  'staged-lint'?: StagedLintConfig
}

export interface SetHooksFromConfigOptions {
  configFile?: GitHooksConfig
}
