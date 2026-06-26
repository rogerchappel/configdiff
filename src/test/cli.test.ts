import { describe, test, before } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, execFile } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '../cli.js')
const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures')

function run(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync('node', [CLI, ...args], {
      encoding: 'utf-8',
      env: { ...process.env, NO_COLOR: '1' },
    })
    return { stdout, stderr: '', exitCode: 0 }
  } catch (err: any) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status ?? 1,
    }
  }
}

describe('CLI --help', () => {
  test('shows help and exits 0', () => {
    const result = run(['--help'])
    assert.equal(result.exitCode, 0)
    assert.ok(result.stdout.includes('USAGE') || result.stdout.includes('usage'))
    assert.ok(result.stdout.includes('--format'))
    assert.ok(result.stdout.includes('--ignore-keys'))
    assert.ok(result.stdout.includes('--json-patch'))
  })
})

describe('package release contents', () => {
  test('allowlist keeps README examples and docs available in npm tarballs', () => {
    const pkg = JSON.parse(
      execFileSync('node', ['-e', "process.stdout.write(JSON.stringify(require('./package.json')))"], {
        cwd: path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'),
        encoding: 'utf-8',
      }),
    )
    const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')

    assert.ok(pkg.files.includes('fixtures'))
    assert.ok(pkg.files.includes('docs'))
    assert.ok(pkg.files.includes('examples'))
    assert.ok(execFileSync('test', ['-f', path.join(root, 'fixtures/env-base.env')], { encoding: 'utf-8' }) === '')
    assert.ok(execFileSync('test', ['-f', path.join(root, 'docs/release-checklist.md')], { encoding: 'utf-8' }) === '')
    assert.ok(execFileSync('test', ['-f', path.join(root, 'examples/cli-tooling/README.md')], { encoding: 'utf-8' }) === '')
  })
})

describe('CLI --version', () => {
  test('shows version and exits 0', () => {
    const result = run(['--version'])
    assert.equal(result.exitCode, 0)
    assert.ok(result.stdout.includes('configdiff'))
  })
})

describe('CLI exit codes', () => {
  test('exit 0 when no drift (identical files)', () => {
    const result = run([
      path.join(FIXTURES, 'env-matching.dev.env'),
      path.join(FIXTURES, 'env-matching.prod-copy.env'),
    ])
    assert.equal(result.exitCode, 0)
    assert.ok(result.stdout.includes('in sync') || result.stdout.includes('No drift'))
  })

  test('exit 1 when drift found', () => {
    const result = run([
      path.join(FIXTURES, 'env-base.env'),
      path.join(FIXTURES, 'env-missing.dev.env'),
    ])
    assert.equal(result.exitCode, 1)
  })

  test('exit 2 when file not found', () => {
    const result = run(['nonexistent.env', 'also-nonexistent.env'])
    assert.equal(result.exitCode, 2)
    assert.ok(result.stderr.toLowerCase().includes('not found') || result.stderr.toLowerCase().includes('error'))
  })

  test('exit 2 when invalid input (bad JSON)', () => {
    const result = run([
      path.join(FIXTURES, 'invalid.json'),
      path.join(FIXTURES, 'env-base.env'),
    ])
    assert.equal(result.exitCode, 2)
  })

  test('exit 2 when no arguments', () => {
    const result = run([])
    assert.equal(result.exitCode, 2)
  })
})

describe('CLI output formats', () => {
  test('--format json produces valid JSON', () => {
    const result = run([
      '--format', 'json',
      path.join(FIXTURES, 'env-base.env'),
      path.join(FIXTURES, 'env-missing.dev.env'),
    ])
    assert.equal(result.exitCode, 1)
    const parsed = JSON.parse(result.stdout)
    assert.ok(Array.isArray(parsed))
  })

  test('--format markdown produces markdown', () => {
    const result = run([
      '--format', 'markdown',
      path.join(FIXTURES, 'env-base.env'),
      path.join(FIXTURES, 'env-missing.prod.env'),
    ])
    assert.equal(result.exitCode, 1)
    assert.ok(result.stdout.includes('# ConfigDiff Report'))
    assert.ok(result.stdout.includes('|'))
  })

  test('--format text produces text', () => {
    const result = run([
      '--format', 'text',
      path.join(FIXTURES, 'env-base.env'),
      path.join(FIXTURES, 'env-missing.dev.env'),
    ])
    assert.equal(result.exitCode, 1)
    assert.ok(result.stdout.length > 0)
  })
})

describe('CLI --ignore-keys', () => {
  test('ignores specified keys', () => {
    // With ignore, the missing keys DB_PORT, etc are filtered out
    const withIgnore = run([
      '--format', 'json',
      '--ignore-keys', 'DB_PORT,DB_NAME,CACHE_TTL,API_KEY,FEATURE_FLAGS',
      path.join(FIXTURES, 'env-base.env'),
      path.join(FIXTURES, 'env-missing.dev.env'),
    ])
    const parsed = JSON.parse(withIgnore.stdout)
    // Should have far fewer diffs
    const total = parsed[0].differences?.length ?? 0
    assert.ok(total < 6, `Expected fewer diffs with ignores, got ${total}`)
  })
})

describe('CLI --json-patch', () => {
  test('produces JSON patch operations', () => {
    const result = run([
      '--json-patch',
      path.join(FIXTURES, 'env-base.env'),
      path.join(FIXTURES, 'env-missing.dev.env'),
    ])
    assert.equal(result.exitCode, 1)
    const parsed = JSON.parse(result.stdout)
    assert.ok(Array.isArray(parsed))
    assert.ok(parsed.length > 0)
    assert.ok(parsed.some((op: any) => op.op === 'remove' || op.op === 'add'))
  })
})

describe('CLI --base --compare (multi-compare)', () => {
  test('compares multiple files against base', () => {
    const result = run([
      '--format', 'json',
      '--base', path.join(FIXTURES, 'env-base.env'),
      '--compare', `${path.join(FIXTURES, 'env-missing.dev.env')},${path.join(FIXTURES, 'env-missing.prod.env')}`,
    ])
    assert.equal(result.exitCode, 1)
    const parsed = JSON.parse(result.stdout)
    assert.ok(Array.isArray(parsed))
    assert.equal(parsed.length, 2)
    assert.ok(parsed.some(r => r.compareFile.includes('dev')))
    assert.ok(parsed.some(r => r.compareFile.includes('prod')))
  })
})

describe('CLI cross-format comparison', () => {
  test('compares JSON vs JSON', () => {
    const result = run([
      '--format', 'json',
      path.join(FIXTURES, 'config-dev.json'),
      path.join(FIXTURES, 'config-prod.json'),
    ])
    assert.equal(result.exitCode, 1)
    const parsed = JSON.parse(result.stdout)
    assert.ok(Array.isArray(parsed))
    assert.ok(parsed[0].differences.length > 0)
  })

  test('compares YAML vs YAML', () => {
    const result = run([
      '--format', 'json',
      path.join(FIXTURES, 'config-dev.yaml'),
      path.join(FIXTURES, 'config-prod.yaml'),
    ])
    assert.equal(result.exitCode, 1)
    const parsed = JSON.parse(result.stdout)
    assert.ok(parsed[0].differences.length > 0)
  })
})
