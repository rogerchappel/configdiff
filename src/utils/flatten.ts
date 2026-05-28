import type { ConfigEntry } from '../types.js'

/**
 * Flatten a nested object into dot-notation key paths.
 * e.g. { db: { host: 'localhost' } } => [{ key: 'db.host', value: 'localhost' }]
 */
export function flattenObject(obj: unknown, prefix: string = ''): ConfigEntry[] {
  const entries: ConfigEntry[] = []

  if (obj === null || obj === undefined) {
    entries.push({ key: prefix || '__root__', value: String(obj) })
    return entries
  }

  if (typeof obj !== 'object') {
    entries.push({ key: prefix || '__root__', value: String(obj) })
    return entries
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const childKey = prefix ? `${prefix}[${i}]` : `[${i}]`
      entries.push(...flattenObject(obj[i], childKey))
    }
    return entries
  }

  const records = obj as Record<string, unknown>
  const keys = Object.keys(records)

  if (keys.length === 0 && prefix) {
    entries.push({ key: prefix, value: '{}' })
    return entries
  }

  for (const key of keys) {
    const childKey = prefix ? `${prefix}.${key}` : key
    const child = records[key]
    entries.push(...flattenObject(child, childKey))
  }

  return entries
}
