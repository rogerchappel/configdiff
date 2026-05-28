import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  outDir: 'dist',
})
