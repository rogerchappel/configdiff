import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { formatText, formatJson, formatMarkdown, formatJsonPatch } from '../reporter.js'
import type { CompareResult, DiffEntry } from '../types.js'

const cleanResult: CompareResult = {
  baseFile: 'base.env',
  compareFile: 'dev.env',
  entries: [],
  envName: 'dev',
}

const driftResult: CompareResult = {
  baseFile: 'base.env',
  compareFile: 'prod.env',
  envName: 'production',
  entries: [
    {
      type: 'missing',
      key: 'API_KEY',
      severity: 'critical',
      baseValue: 'secret123',
      env: 'production',
    } as DiffEntry,
    {
      type: 'conflict',
      key: 'DB_HOST',
      severity: 'critical',
      baseValue: 'localhost',
      compareValue: 'prod-db.internal',
      env: 'production',
    } as DiffEntry,
    {
      type: 'extra',
      key: 'MONITORING_URL',
      severity: 'critical',
      compareValue: 'https://monitor.prod',
      env: 'production',
    } as DiffEntry,
  ],
}

describe('formatText', () => {
  test('outputs clean message for no drift', () => {
    const output = formatText([cleanResult])
    assert.ok(output.includes('in sync') || output.includes('No drift'))
  })

  test('outputs drift details', () => {
    const output = formatText([driftResult])
    assert.ok(output.includes('API_KEY'))
    assert.ok(output.includes('DB_HOST'))
    assert.ok(output.includes('MONITORING_URL'))
    assert.ok(output.includes('MISSING') || output.includes('missing'))
    assert.ok(output.includes('CONFLICT') || output.includes('conflict'))
  })

  test('multiple results combined', () => {
    const output = formatText([cleanResult, driftResult])
    assert.ok(output.includes('prod.env'))
    assert.ok(output.includes('dev.env'))
  })
})

describe('formatJson', () => {
  test('produces valid JSON', () => {
    const output = formatJson([driftResult])
    const parsed = JSON.parse(output)
    assert.ok(Array.isArray(parsed))
    assert.equal(parsed.length, 1)
    assert.equal(parsed[0].compareFile, 'prod.env')
    assert.equal(parsed[0].differences.length, 3)
  })

  test('includes severity counts', () => {
    const output = formatJson([driftResult])
    const parsed = JSON.parse(output)
    assert.ok(parsed[0].counts)
    assert.equal(parsed[0].counts.critical, 3)
  })

  test('empty result has zero counts', () => {
    const output = formatJson([cleanResult])
    const parsed = JSON.parse(output)
    assert.equal(parsed[0].differences.length, 0)
  })
})

describe('formatMarkdown', () => {
  test('includes markdown heading', () => {
    const output = formatMarkdown([driftResult])
    assert.ok(output.includes('# ConfigDiff Report'))
    assert.ok(output.includes('## prod.env vs base.env'))
  })

  test('includes data in table', () => {
    const output = formatMarkdown([driftResult])
    assert.ok(output.includes('API_KEY'))
    assert.ok(output.includes('localhost'))
    assert.ok(output.includes('prod-db.internal'))
    assert.ok(output.includes('|'))
  })

  test('notes no differences', () => {
    const output = formatMarkdown([cleanResult])
    assert.ok(output.includes('No differences found') || output.includes('✓'))
  })

  test('escapes pipe chars', () => {
    const result: CompareResult = {
      baseFile: 'base.env',
      compareFile: 'dev.env',
      entries: [{
        type: 'conflict' as const,
        key: 'URL',
        severity: 'info' as const,
        baseValue: 'http://a|b',
        compareValue: 'c|d',
      }],
    }
    const output = formatMarkdown([result])
    assert.ok(output.includes('\\|'))
  })
})

describe('formatJsonPatch', () => {
  test('produces add/op for extra keys', () => {
    const output = formatJsonPatch([driftResult])
    assert.ok(Array.isArray(output))
    const addOp = (output as any[]).find(o => o.op === 'add')
    assert.ok(addOp)
    assert.equal(addOp.value, 'https://monitor.prod')
  })

  test('produces remove/op for missing keys', () => {
    const output = formatJsonPatch([driftResult])
    const removeOp = (output as any[]).find(o => o.op === 'remove')
    assert.ok(removeOp)
    assert.equal(removeOp.fromValue, 'secret123')
  })

  test('produces replace/op for conflicts', () => {
    const output = formatJsonPatch([driftResult])
    const replaceOp = (output as any[]).find(o => o.op === 'replace')
    assert.ok(replaceOp)
    assert.equal(replaceOp.fromValue, 'localhost')
    assert.equal(replaceOp.value, 'prod-db.internal')
  })

  test('empty for no drift', () => {
    const output = formatJsonPatch([cleanResult])
    assert.equal((output as any[]).length, 0)
  })
})
