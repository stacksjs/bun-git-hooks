import { mkdir } from 'node:fs/promises'
import { dts } from 'bun-plugin-dtsx'

// // Ensure dist/bin directory exists
// await mkdir('./dist/bin', { recursive: true })

await Bun.build({
  entrypoints: ['src/index.ts'],
  target: 'browser',
  outdir: './dist',
  plugins: [dts()],
})

await Bun.build({
  entrypoints: ['bin/cli.ts'],
  target: 'bun',
  outdir: './dist',
  plugins: [dts()],
})
