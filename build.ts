import { dts } from 'bun-plugin-dtsx'

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
