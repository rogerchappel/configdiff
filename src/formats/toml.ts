import type { ConfigEntry } from '../types.js'
import { flattenObject } from '../utils/flatten.js'
import { parse as parseTomlLib } from 'smol-toml'

/**
 * Parse a TOML config file into flat ConfigEntry list.
 * Nested tables are flattened with dot notation.
 */
export function parseToml(content: string): ConfigEntry[] {
  let parsed: unknown
  try {
    parsed = parseTomlLib(content)
  } catch (err) {
    throw new Error(`Invalid TOML: ${(err as Error).message}`)
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('TOML config must be a table (object)')
  }

  return flattenObject(parsed)
}
