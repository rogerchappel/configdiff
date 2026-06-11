import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { parseConfig, parseConfigContent, detectFormat } from '../parser.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../fixtures')

describe('detectFormat', () => {
  test('detects .env extension', () => {
    assert.equal(detectFormat('.env'), 'env')
    assert.equal(detectFormat('app.env'), 'env')
  })

  test('detects .json extension', () => {
    assert.equal(detectFormat('config.json'), 'json')
  })

  test('detects .yaml/.yml extension', () => {
    assert.equal(detectFormat('config.yaml'), 'yaml')
    assert.equal(detectFormat('config.yml'), 'yaml')
  })

  test('detects .ini/.cfg/.conf extension', () => {
    assert.equal(detectFormat('config.ini'), 'ini')
    assert.equal(detectFormat('config.cfg'), 'ini')
    assert.equal(detectFormat('config.conf'), 'ini')
  })

  test('heuristic: falls back to env for unknown extensions with env in name', () => {
    assert.equal(detectFormat('.env.production'), 'env')
    assert.equal(detectFormat('env.local'), 'env')
  })

  test('defaults to env for unknown extension', () => {
    assert.equal(detectFormat('config.toml'), 'env')
  })
})

describe('parseConfig (.env)', () => {
  test('parses simple KEY=VALUE pairs', () => {
    const entries = parseConfigContent('DB_HOST=localhost\nDB_PORT=5432', 'env')
    assert.equal(entries.length, 2)
    assert.ok(entries.find(e => e.key === 'DB_HOST' && e.value === 'localhost'))
    assert.ok(entries.find(e => e.key === 'DB_PORT' && e.value === '5432'))
  })

  test('ignores comments and empty lines', () => {
    const entries = parseConfigContent('# comment\n\nDB_HOST=localhost\n# another', 'env')
    assert.equal(entries.length, 1)
    assert.equal(entries[0].key, 'DB_HOST')
  })

  test('strips double quotes', () => {
    const entries = parseConfigContent('KEY="hello world"', 'env')
    assert.equal(entries[0].value, 'hello world')
  })

  test('strips single quotes', () => {
    const entries = parseConfigContent("KEY='hello world'", 'env')
    assert.equal(entries[0].value, 'hello world')
  })

  test('handles export prefix', () => {
    const entries = parseConfigContent('export APP_NAME=TestApp', 'env')
    assert.equal(entries[0].key, 'APP_NAME')
    assert.equal(entries[0].value, 'TestApp')
  })

  test('handles mixed quotes and export', () => {
    const entries = parseConfig('fixtures/env-quoted.env')
    const dbHost = entries.find(e => e.key === 'DB_HOST')
    assert.ok(dbHost)
    assert.equal(dbHost!.value, 'localhost')
  })

  test('skips lines without =', () => {
    const entries = parseConfigContent('NO_EQUALS\nHAS_EQUALS=value', 'env')
    assert.equal(entries.length, 1)
    assert.equal(entries[0].key, 'HAS_EQUALS')
  })

  test('parses empty value after =', () => {
    const entries = parseConfigContent('EMPTY_VAL=', 'env')
    assert.equal(entries.length, 1)
    assert.equal(entries[0].key, 'EMPTY_VAL')
    assert.equal(entries[0].value, '')
  })

  test('parses fixture file', () => {
    const entries = parseConfig(path.join(FIXTURES, 'env-matching.dev.env'))
    assert.ok(entries.length > 0)
    assert.ok(entries.find(e => e.key === 'APP_NAME'))
    assert.ok(entries.find(e => e.key === 'DB_HOST'))
  })
})

describe('parseConfig (JSON)', () => {
  test('parses flat JSON', () => {
    const entries = parseConfigContent('{"name":"app","port":3000}', 'json')
    assert.equal(entries.length, 2)
    assert.ok(entries.find(e => e.key === 'name' && e.value === 'app'))
    assert.ok(entries.find(e => e.key === 'port' && e.value === '3000'))
  })

  test('flattens nested objects', () => {
    const entries = parseConfigContent('{"db":{"host":"localhost","port":"5432"}}', 'json')
    assert.equal(entries.length, 2)
    assert.ok(entries.find(e => e.key === 'db.host'))
    assert.ok(entries.find(e => e.key === 'db.port'))
  })

  test('parses fixture file', () => {
    const entries = parseConfig(path.join(FIXTURES, 'config-dev.json'))
    assert.ok(entries.length > 0)
    assert.ok(entries.find(e => e.key === 'database.host'))
  })

  test('throws on invalid JSON', () => {
    assert.throws(() => parseConfigContent('{invalid}', 'json'), /Invalid JSON/)
  })

  test('throws on JSON array (must be object)', () => {
    assert.throws(() => parseConfigContent('[1,2,3]', 'json'), /must be an object/)
  })
})

describe('parseConfig (YAML)', () => {
  test('parses flat YAML', () => {
    const entries = parseConfigContent('name: app\nport: 3000', 'yaml')
    assert.equal(entries.length, 2)
    assert.ok(entries.find(e => e.key === 'name' && e.value === 'app'))
  })

  test('flattens nested YAML', () => {
    const content = 'db:\n  host: localhost\n  port: 5432'
    const entries = parseConfigContent(content, 'yaml')
    assert.ok(entries.find(e => e.key === 'db.host'))
    assert.ok(entries.find(e => e.key === 'db.port'))
  })

  test('parses fixture file', () => {
    const entries = parseConfig(path.join(FIXTURES, 'config-dev.yaml'))
    assert.ok(entries.length > 0)
    assert.ok(entries.find(e => e.key === 'database.host'))
  })

  test('throws on invalid YAML', () => {
    assert.throws(() => parseConfigContent('[broken', 'yaml'), /Invalid YAML/)
  })
})

describe('parseConfig (INI)', () => {
  test('parses sections and keys', () => {
    const content = '[app]\nname=MyApp\nport=3000\n[db]\nhost=localhost'
    const entries = parseConfigContent(content, 'ini')
    assert.ok(entries.find(e => e.key === 'app.name' && e.value === 'MyApp'))
    assert.ok(entries.find(e => e.key === 'db.host' && e.value === 'localhost'))
  })

  test('parses global keys before section', () => {
    const content = 'globalkey=value\n[section]\nkey=val'
    const entries = parseConfigContent(content, 'ini')
    assert.ok(entries.find(e => e.key === 'global.globalkey'))
    assert.ok(entries.find(e => e.key === 'section.key'))
  })

  test('ignores comments (# and ;)', () => {
    const content = '# comment\n; also comment\n[section]\nkey=value'
    const entries = parseConfigContent(content, 'ini')
    assert.equal(entries.length, 1)
  })

  test('parses fixture file', () => {
    const entries = parseConfig(path.join(FIXTURES, 'config-dev.ini'))
    assert.ok(entries.length > 0)
    assert.ok(entries.find(e => e.key === 'database.host'))
  })
})
