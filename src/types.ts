import type { Buffer } from 'node:buffer'
import type { VALID_GIT_HOOKS } from './git-hooks'

export type BufferLike = Buffer | Uint8Array | ArrayLike<number> | Iterable<number> | ArrayBuffer

export type GitHooksConfig = {
  [K in typeof VALID_GIT_HOOKS[number]]?: string
} & {
  preserveUnused?: boolean | typeof VALID_GIT_HOOKS[number][]
  verbose?: boolean
}

export interface SetHooksFromConfigOptions {
  configFile?: GitHooksConfig
}
