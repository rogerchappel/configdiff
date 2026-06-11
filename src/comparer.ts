import type { ConfigEntry, DiffEntry, CompareResult, Severity } from './types.js'

const PROD_PATTERNS = ['prod', 'production', 'live']
const STAGING_PATTERNS = ['staging', 'stage', 'preprod', 'pre-prod']
const DEV_PATTERNS = ['dev', 'development', 'local', 'test']

/**
 * Assign severity to a diff entry based on the environment name.
 */
function assignSeverity(type: DiffEntry['type'], envName: string): Severity {
  const lower = envName.toLowerCase()

  if (PROD_PATTERNS.some(p => lower.includes(p))) {
    // Missing in production is critical
    return 'critical'
  }
  if (STAGING_PATTERNS.some(p => lower.includes(p))) {
    return 'warning'
  }
  if (DEV_PATTERNS.some(p => lower.includes(p))) {
    return 'info'
  }
  // Unknown env: severity based on type
  switch (type) {
    case 'missing':
      return 'warning'
    case 'conflict':
      return 'warning'
    case 'extra':
    default:
      return 'info'
  }
}

/**
 * Detect environment name from a file path.
 */
export function detectEnvName(filePath: string): string | undefined {
  const basename = filePath.split('/').pop() || filePath
  const patterns = [...PROD_PATTERNS, ...STAGING_PATTERNS, ...DEV_PATTERNS]
    .sort((left, right) => right.length - left.length)

  for (const pattern of patterns) {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`(^|[._-])${escaped}([._-]|$)`).test(basename)) {
      return pattern
    }
  }
  return undefined
}

/**
 * Compare two sets of config entries.
 * Returns differences: missing in compare, extra in compare, conflicting values.
 */
export function compareEntries(
  base: ConfigEntry[],
  compare: ConfigEntry[],
  options?: {
    ignoreKeys?: string[]
    envName?: string
    fileLabel?: string
  }
): DiffEntry[] {
  const ignoreSet = new Set(options?.ignoreKeys?.map(k => k.toLowerCase()) || [])
  const baseMap = new Map<string, string>()
  const compareMap = new Map<string, string>()

  for (const entry of base) {
    if (!ignoreSet.has(entry.key.toLowerCase())) {
      baseMap.set(entry.key, entry.value)
    }
  }
  for (const entry of compare) {
    if (!ignoreSet.has(entry.key.toLowerCase())) {
      compareMap.set(entry.key, entry.value)
    }
  }

  const differences: DiffEntry[] = []
  const baseKeys = Array.from(baseMap.keys())
  const compareKeys = Array.from(compareMap.keys())
  const allKeys = new Set([...baseKeys, ...compareKeys])

  const env = options?.envName ?? ''

  for (const key of allKeys) {
    const hasBase = baseMap.has(key)
    const hasCompare = compareMap.has(key)

    if (hasBase && hasCompare) {
      if (baseMap.get(key) !== compareMap.get(key)) {
        differences.push({
          type: 'conflict',
          key,
          severity: assignSeverity('conflict', env),
          baseValue: baseMap.get(key),
          compareValue: compareMap.get(key),
          env,
          file: options?.fileLabel,
        })
      }
    } else if (hasBase && !hasCompare) {
      differences.push({
        type: 'missing',
        key,
        severity: assignSeverity('missing', env),
        baseValue: baseMap.get(key),
        env,
        file: options?.fileLabel,
      })
    } else if (!hasBase && hasCompare) {
      differences.push({
        type: 'extra',
        key,
        severity: assignSeverity('extra', env),
        compareValue: compareMap.get(key),
        env,
        file: options?.fileLabel,
      })
    }
  }

  return differences
}

/**
 * Compare two config files.
 */
export function compareTwo(
  baseFile: string,
  base: ConfigEntry[],
  compareFile: string,
  compare: ConfigEntry[],
  options?: {
    ignoreKeys?: string[]
    envName?: string
  }
): CompareResult {
  const env = options?.envName ?? detectEnvName(compareFile) ?? ''

  const entries = compareEntries(base, compare, {
    ignoreKeys: options?.ignoreKeys,
    envName: env,
    fileLabel: compareFile,
  })

  return {
    entries,
    envName: env,
    baseFile,
    compareFile,
  }
}

/**
 * Compare N files against a base file.
 * Returns one CompareResult per comparison pair.
 */
export function compareBase(
  baseFile: string,
  base: ConfigEntry[],
  compareFiles: string[],
  compareConfigs: ConfigEntry[][],
  options?: {
    ignoreKeys?: string[]
    envNames?: string[]
  }
): CompareResult[] {
  return compareFiles.map((file, i) => {
    const env = options?.envNames?.[i] ?? detectEnvName(file) ?? file
    const entries = compareEntries(base, compareConfigs[i], {
      ignoreKeys: options?.ignoreKeys,
      envName: env,
      fileLabel: file,
    })
    return { entries, envName: env, baseFile, compareFile: file }
  })
}
