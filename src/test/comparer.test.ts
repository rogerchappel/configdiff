import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { compareEntries, compareTwo, compareBase, detectEnvName } from '../comparer.js'
import type { ConfigEntry } from '../types.js'

const base: ConfigEntry[] = [
  { key: 'APP_NAME', value: 'MyApp' },
  { key: 'DB_HOST', value: 'localhost' },
  { key: 'DB_PORT', value: '5432' },
  { key: 'LOG_LEVEL', value: 'debug' },
  { key: 'CACHE_TTL', value: '60' },
  { key: 'API_KEY', value: 'secret' },
]

describe('compareEntries', () => {
  test('detects no differences when identical', () => {
    const same: ConfigEntry[] = [{ key: 'KEY', value: 'val' }]
    const diffs = compareEntries(same, same)
    assert.equal(diffs.length, 0)
  })

  test('detects missing keys in compare', () => {
    const compare: ConfigEntry[] = [
      { key: 'APP_NAME', value: 'MyApp' },
      { key: 'DB_HOST', value: 'localhost' },
      // missing DB_PORT, LOG_LEVEL, CACHE_TTL, API_KEY
    ]
    const diffs = compareEntries(base, compare, { envName: 'production' })
    const missing = diffs.filter(d => d.type === 'missing')
    assert.ok(missing.length >= 3, `Expected 3+ missing keys, got ${missing.length}`)
    assert.ok(missing.some(d => d.key === 'DB_PORT'))
    assert.ok(missing.some(d => d.key === 'API_KEY'))
  })

  test('detects extra keys in compare', () => {
    const compare: ConfigEntry[] = [
      ...base,
      { key: 'NEW_KEY', value: 'extra' },
    ]
    const diffs = compareEntries(base, compare)
    const extras = diffs.filter(d => d.type === 'extra')
    assert.ok(extras.some(d => d.key === 'NEW_KEY'))
  })

  test('detects conflicting values', () => {
    const compare: ConfigEntry[] = [
      ...base,
      { key: 'DB_HOST', value: 'prod-db.internal' },
      { key: 'LOG_LEVEL', value: 'warn' },
    ]
    const diffs = compareEntries(base, compare)
    const conflicts = diffs.filter(d => d.type === 'conflict')
    assert.ok(conflicts.some(d => d.key === 'DB_HOST'))
    assert.ok(conflicts.some(d => d.key === 'LOG_LEVEL'))
  })

  test('respects ignoreKeys filter', () => {
    const compare: ConfigEntry[] = [
      { key: 'APP_NAME', value: 'MyApp' },
      // API_KEY missing but should be ignored
    ]
    const diffs = compareEntries(base, compare, {
      ignoreKeys: ['API_KEY'],
    })
    assert.ok(!diffs.some(d => d.key === 'API_KEY'))
  })

  test('ignoreKeys is case-insensitive', () => {
    const compare: ConfigEntry[] = [
      ...base,
      { key: 'LOG_LEVEL', value: 'warn' },
    ]
    const withFilter = compareEntries(base, compare, { ignoreKeys: ['log_LEVEL'] })
    assert.equal(withFilter.filter(d => d.key === 'LOG_LEVEL').length, 0)
    const withoutFilter = compareEntries(base, compare)
    assert.ok(withoutFilter.filter(d => d.key === 'LOG_LEVEL').length > 0)
  })

  test('works with empty base', () => {
    const diffs = compareEntries([], [{ key: 'EXTRA', value: 'yes' }])
    assert.equal(diffs.length, 1)
    assert.equal(diffs[0].type, 'extra')
  })

  test('works with empty compare', () => {
    const diffs = compareEntries([{ key: 'BASE_ONLY', value: 'val' }], [])
    assert.equal(diffs.length, 1)
    assert.equal(diffs[0].type, 'missing')
  })
})

describe('compareTwo', () => {
  test('returns CompareResult structure', () => {
    const result = compareTwo(
      'base.env',
      [{ key: 'A', value: '1' }, { key: 'B', value: '2' }],
      'prod.env',
      [{ key: 'A', value: '1' }],
    )
    assert.equal(result.baseFile, 'base.env')
    assert.equal(result.compareFile, 'prod.env')
    assert.ok(result.entries.some(d => d.type === 'missing'))
  })
})

describe('compareBase (multi-compare)', () => {
  test('compares multiple files against base', () => {
    const results = compareBase(
      'base.env',
      [{ key: 'A', value: '1' }, { key: 'B', value: '2' }, { key: 'C', value: '3' }],
      ['dev.env', 'prod.env'],
      [
        [{ key: 'A', value: '1' }, { key: 'B', value: '2' }], // dev missing C
        [{ key: 'A', value: '1' }], // prod missing B, C
      ],
    )
    assert.equal(results.length, 2)
    assert.equal(results[0].compareFile, 'dev.env')
    assert.equal(results[1].compareFile, 'prod.env')
    assert.ok(results[0].entries.some(d => d.key === 'C'))
    assert.ok(results[1].entries.length >= 2)
  })
})

describe('detectEnvName', () => {
  test('detects production', () => {
    assert.equal(detectEnvName('config.prod.env'), 'prod')
    assert.equal(detectEnvName('config.production.yaml'), 'production')
    assert.equal(detectEnvName('config.live.json'), 'live')
  })

  test('detects staging', () => {
    assert.equal(detectEnvName('config.staging.env'), 'staging')
    assert.equal(detectEnvName('config.stage.yaml'), 'stage')
  })

  test('detects development', () => {
    assert.equal(detectEnvName('config.dev.env'), 'dev')
    assert.equal(detectEnvName('config.local.json'), 'local')
  })

  test('returns undefined for unknown env', () => {
    assert.equal(detectEnvName('config.test1.txt'), undefined)
  })
})
