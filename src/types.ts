export type DiffEntryType = 'missing' | 'extra' | 'conflict'
export type Severity = 'critical' | 'warning' | 'info'
export type ReportFormat = 'text' | 'json' | 'markdown'

export interface ConfigEntry {
  /** Dot-notation key path, e.g. "database.host" */
  key: string
  /** Raw value (always stored as string for comparison) */
  value: string
}

export interface DiffEntry {
  type: DiffEntryType
  key: string
  severity: Severity
  /** Value in the base file (absent for 'extra' / 'missing') */
  baseValue?: string
  /** Value in the compared file */
  compareValue?: string
  /** Human-readable environment label, e.g. "production" */
  env?: string
  /** File label used in reports */
  file?: string
}

export interface CompareResult {
  entries: DiffEntry[]
  /** Set when --compare mode with explicit env names */
  envName?: string
  baseFile: string
  compareFile: string
}

export interface ParseOptions {
  format?: 'env' | 'json' | 'yaml' | 'ini' | 'toml'
}
