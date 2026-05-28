/**
 * configdiff — detect configuration drift across environments.
 *
 * Library entry point. Exports parsers, comparer, reporters, and types.
 */
export { parseConfig } from './parser.js'
export { compareTwo, compareBase } from './comparer.js'
export { formatText, formatJson, formatMarkdown } from './reporter.js'
export type {
  ConfigEntry,
  DiffEntry,
  DiffEntryType,
  Severity,
  CompareResult,
  ReportFormat,
} from './types.js'
