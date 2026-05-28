import type { ConfigEntry } from './parser.js'
import { execSync, spawnSync } from 'node:child_process'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function build() {
  execSync('npx tsup --bundle false', { cwd: __dirname, stdio: 'inherit' })
}

export function runCli(args: string[]): {
  stdout: string
  stderr: string
  status: number | null
} {
  const result = spawnSync('node', [path.resolve(__dirname, 'dist/cli.js'), ...args], {
    encoding: 'utf-8',
    env: { ...process.env, NO_COLOR: '1' },
  })
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  }
}

export { parseConfig }
