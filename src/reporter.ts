import type { DiffEntry, CompareResult } from './types.js'

const COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  dim: '\x1b[2m',
}

/** Whether stdout supports ANSI colors. */
export function supportsColor(): boolean {
  if (process.env.NO_COLOR) return false
  const TERM = process.env.TERM || ''
  if (process.env.FORCE_COLOR !== undefined) return process.env.FORCE_COLOR !== '0'
  return process.stdout.isTTY && !TERM.includes('dumb')
}

function color(str: string, c: string): string {
  if (!supportsColor()) return str
  return `${c}${str}${COLORS.reset}`
}

function severityColor(sev: string): string {
  switch (sev) {
    case 'critical': return COLORS.red
    case 'warning': return COLORS.yellow
    case 'info': return COLORS.blue
    default: return ''
  }
}

function severityLabel(sev: string): string {
  return color(sev.toUpperCase(), severityColor(sev))
}

/**
 * Format a single CompareResult as plain text (with optional colors).
 */
export function formatResultText(result: CompareResult): string {
  const lines: string[] = []

  lines.push(
    color('━'.repeat(60), COLORS.dim)
  )
  lines.push(
    `${color('◉', COLORS.bold)} ${color(result.compareFile, COLORS.bold)} vs ${result.baseFile}`
  )
  lines.push(
    color('─'.repeat(60), COLORS.dim)
  )

  if (result.entries.length === 0) {
    lines.push(color('✓', COLORS.green) + '  No differences found.')
  } else {
    // Summary counts
    const critical = result.entries.filter(e => e.severity === 'critical')
    const warnings = result.entries.filter(e => e.severity === 'warning')
    const infos = result.entries.filter(e => e.severity === 'info')

    if (critical.length) lines.push(`  ${color(`${critical.length} critical`, COLORS.red)}`)
    if (warnings.length) lines.push(`  ${color(`${warnings.length} warning(s)`, COLORS.yellow)}`)
    if (infos.length) lines.push(`  ${color(`${infos.length} info`, COLORS.blue)}`)
    lines.push('')

    for (const entry of result.entries) {
      const sev = severityLabel(entry.severity)
      switch (entry.type) {
        case 'missing':
          lines.push(`  ${sev}  MISSING  ${entry.key}`)
          lines.push(`         was: ${entry.baseValue ?? '<n/a>'}`)
          break
        case 'extra':
          lines.push(`  ${sev}  EXTRA    ${entry.key}`)
          lines.push(`         value: ${entry.compareValue ?? '<n/a>'}`)
          break
        case 'conflict':
          lines.push(`  ${sev}  CONFLICT ${entry.key}`)
          lines.push(`         base:    ${entry.baseValue ?? '<n/a>'}`)
          lines.push(`         compare: ${entry.compareValue ?? '<n/a>'}`)
          break
      }
    }
  }

  lines.push('')
  return lines.join('\n')
}

/**
 * Format the full report (all results) as text.
 */
export function formatText(results: CompareResult[]): string {
  const parts = results.map(r => formatResultText(r))
  const joined = parts.join('\n')

  // Overall summary
  const allEntries = results.flatMap(r => r.entries)
  const lines: string[] = []

  if (allEntries.length === 0) {
    lines.push(color('✓ All configs are in sync. No drift detected.', COLORS.green))
  } else {
    const critical = allEntries.filter(e => e.severity === 'critical').length
    const warnings = allEntries.filter(e => e.severity === 'warning').length
    lines.push(
      `${color('─'.repeat(60), COLORS.dim)}`
    )
    lines.push(
      `${color('⚠', severityColor(critical ? 'critical' : 'warning'))} ` +
      `Drift found: ${allEntries.length} difference(s) across ${results.length} file pair(s).`
    )
    if (critical) lines.push(`  ${critical} critical (production)` )
    if (warnings) lines.push(`  ${warnings} warning(s)` )
  }

  return joined + '\n' + lines.join('\n') + '\n'
}

/**
 * JSON patch output: array of RFC6902-style operations.
 */
export function formatJsonPatch(results: CompareResult[]): unknown {
  const ops: Array<{ op: string; path: string; value?: string; fromValue?: string }> = []

  for (const result of results) {
    for (const entry of result.entries) {
      const op: { op: string; path: string; value?: string; fromValue?: string; file?: string } = {
        op: entry.type === 'extra' ? 'add' : entry.type === 'missing' ? 'remove' : 'replace',
        path: `/${entry.key.replace(/\./g, '/')}`,
      }
      if (entry.type === 'conflict') {
        op.fromValue = entry.baseValue ?? ''
        op.value = entry.compareValue ?? ''
      } else if (entry.type === 'extra') {
        op.value = entry.compareValue ?? ''
      } else if (entry.type === 'missing') {
        op.fromValue = entry.baseValue ?? ''
      }
      op.file = result.compareFile
      ops.push(op)
    }
  }

  return ops
}

/**
 * Format as JSON (serializable output).
 */
export function formatJson(results: CompareResult[]): string {
  const output = results.map(r => ({
    compareFile: r.compareFile,
    baseFile: r.baseFile,
    env: r.envName,
    differences: r.entries.map(e => ({
      type: e.type,
      key: e.key,
      severity: e.severity,
      ...(e.baseValue !== undefined && { baseValue: e.baseValue }),
      ...(e.compareValue !== undefined && { compareValue: e.compareValue }),
    })),
    counts: {
      critical: r.entries.filter(e => e.severity === 'critical').length,
      warning: r.entries.filter(e => e.severity === 'warning').length,
      info: r.entries.filter(e => e.severity === 'info').length,
    },
  }))

  return JSON.stringify(output, null, 2)
}

/**
 * Format as markdown table.
 */
export function formatMarkdown(results: CompareResult[]): string {
  const lines: string[] = []
  lines.push('# ConfigDiff Report\n')

  for (const result of results) {
    lines.push(`## ${result.compareFile} vs ${result.baseFile}\n`)

    if (result.entries.length === 0) {
      lines.push('✓ No differences found.\n')
      continue
    }

    lines.push('| # | Type | Severity | Key | Base | Compare |')
    lines.push('|---|------|----------|-----|------|---------|')

    result.entries.forEach((e, i) => {
      const base = e.baseValue ?? '—'
      const compare = e.compareValue ?? '—'
      lines.push(`| ${i + 1} | ${e.type} | ${e.severity} | ${e.key} | ${escapeMd(base)} | ${escapeMd(compare)} |`)
    })

    lines.push('')
  }

  return lines.join('\n')
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}
