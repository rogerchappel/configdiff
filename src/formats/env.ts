import type { ConfigEntry } from '../types.js'

/**
 * Parse a .env file into flat ConfigEntry list.
 *
 * Supports:
 *   KEY=VALUE
 *   KEY="quoted value"
 *   KEY='single quoted'
 *   # comment lines
 *   export KEY=VALUE
 *   empty lines (ignored)
 */
export function parseEnv(content: string): ConfigEntry[] {
  const lines = content.split('\n')
  const entries: ConfigEntry[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue

    // Strip 'export ' prefix
    let work = line
    if (work.startsWith('export ')) {
      work = work.slice(7)
    }

    const eqIndex = work.indexOf('=')
    if (eqIndex === -1) continue

    const key = work.slice(0, eqIndex).trim()
    if (!key) continue

    let value = work.slice(eqIndex + 1).trim()

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    entries.push({ key, value })
  }

  return entries
}
