import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/*.ts', 'src/formats/*.ts', 'src/utils/*.ts', 'src/test/*.test.ts'],
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
