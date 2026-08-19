import { dts } from 'bun-plugin-dtsx'

// Build the main package
await Bun.build({
  minify: true,
  entrypoints: ['src/index.ts'],
  target: 'node',
  outdir: './dist',
  plugins: [dts()],
})

// Build the CLI
await Bun.build({
  minify: true,
  entrypoints: ['bin/cli.ts'],
  target: 'bun',
  outdir: './dist/bin',
  plugins: [dts()],
})
