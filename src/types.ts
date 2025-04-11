import type { VALID_GIT_HOOKS } from './git-hooks'

export type GitHooksConfig = {
  [K in typeof VALID_GIT_HOOKS[number]]?: string
} & {
  preserveUnused?: boolean | typeof VALID_GIT_HOOKS[number][]
  verbose?: boolean
}

export interface SetHooksFromConfigOptions {
  configFile?: GitHooksConfig
}
