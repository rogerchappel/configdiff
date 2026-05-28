import type { ConfigEntry } from '../types.js'
import { flattenObject } from '../utils/flatten.js'

/**
 * Parse an INI config file into flat ConfigEntry list.
 *
 * Supports:
 *   [section]
 *   key=value
 *   # comment
 *   ; comment
 *
 * Resulting keys are prefixed with the section: "section.key"
 * Keys before any section header use the prefix "global".
 */
export function parseIni(content: string): ConfigEntry[] {
  const lines = content.split('\n')
  const raw: Record<string, unknown> = {}
  let currentSection: string | null = null

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith(';')) continue

    // Section header
    const sectionMatch = line.match(/^\[(.+)\]$/)
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim()
      if (!raw[currentSection]) {
        raw[currentSection] = {}
      }
      continue
    }

    // Key=value
    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue

    const key = line.slice(0, eqIndex).trim()
    if (!key) continue

    const value = line.slice(eqIndex + 1).trim()

    const targetSection = currentSection ?? 'global'
    if (!raw[targetSection]) {
      raw[targetSection] = {}
    }
    ;(raw[targetSection] as Record<string, string>)[key] = value
  }

  return flattenObject(raw)
}
