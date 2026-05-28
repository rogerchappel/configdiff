import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts', 'src/index.ts', 'src/test/*.test.ts', 'src/formats/*.ts', 'src/utils/*.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: false,
  outDir: 'dist',
})
