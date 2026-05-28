import type { ConfigEntry } from '../types.js'
import { flattenObject } from '../utils/flatten.js'
import { parse as parseYamlLib } from 'yaml'

/**
 * Parse a YAML config file into flat ConfigEntry list.
 * Nested maps are flattened with dot notation.
 */
export function parseYaml(content: string): ConfigEntry[] {
  let parsed: unknown
  try {
    parsed = parseYamlLib(content)
  } catch (err) {
    throw new Error(`Invalid YAML: ${(err as Error).message}`)
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('YAML config must be a mapping (object)')
  }

  return flattenObject(parsed)
}
