import type { ConfigEntry } from '../types.js'
import { flattenObject } from '../utils/flatten.js'

/**
 * Parse a JSON config file into flat ConfigEntry list.
 * Nested objects are flattened with dot notation.
 */
export function parseJson(content: string): ConfigEntry[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (err) {
    throw new Error(`Invalid JSON: ${(err as Error).message}`)
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('JSON config must be an object')
  }

  return flattenObject(parsed)
}
