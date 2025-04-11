import { dts } from 'bun-plugin-dtsx'

// Build the main package
await Bun.build({
  entrypoints: ['src/index.ts'],
  target: 'browser',
  outdir: './dist',
  plugins: [dts()],
})

// Build the CLI
await Bun.build({
  entrypoints: ['bin/cli.ts'],
  target: 'bun',
  outdir: './dist',
  plugins: [dts()],
})
