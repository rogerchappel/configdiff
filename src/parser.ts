import fs from 'node:fs'
import path from 'node:path'
import type { ConfigEntry, ParseOptions } from './types.js'
import { parseEnv } from './formats/env.js'
import { parseJson } from './formats/json.js'
import { parseYaml } from './formats/yaml.js'
import { parseIni } from './formats/ini.js'
import { parseToml } from './formats/toml.js'

/**
 * Detect the config format from a file extension.
 * Falls back to 'env' for unknown extensions.
 */
export function detectFormat(filePath: string): 'env' | 'json' | 'yaml' | 'ini' | 'toml' {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.json':
      return 'json'
    case '.yaml':
    case '.yml':
      return 'yaml'
    case '.ini':
    case '.cfg':
    case '.conf':
      return 'ini'
    case '.toml':
      return 'toml'
    case '.env':
      return 'env'
    default:
      // Heuristic: if filename contains 'env' treat as .env
      if (filePath.includes('.env') || filePath.includes('env.')) {
        return 'env'
      }
      return 'env'
  }
}

/**
 * Parse a config file into a flat list of ConfigEntry objects.
 * All values are normalised to strings.
 */
export function parseConfig(filePath: string, options?: ParseOptions): ConfigEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const format = options?.format ?? detectFormat(filePath)

  switch (format) {
    case 'env':
      return parseEnv(content)
    case 'json':
      return parseJson(content)
    case 'yaml':
      return parseYaml(content)
    case 'ini':
      return parseIni(content)
    case 'toml':
      return parseToml(content)
    default:
      throw new Error(`Unsupported format: ${format}. Supported: .env, .json, .yaml, .yml, .ini, .cfg, .toml`)
  }
}

/**
 * Parse config content from a string (useful for tests and piping).
 */
export function parseConfigContent(content: string, format: 'env' | 'json' | 'yaml' | 'ini' | 'toml'): ConfigEntry[] {
  switch (format) {
    case 'env':
      return parseEnv(content)
    case 'json':
      return parseJson(content)
    case 'yaml':
      return parseYaml(content)
    case 'ini':
      return parseIni(content)
    case 'toml':
      return parseToml(content)
  }
}
