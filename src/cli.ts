#!/usr/bin/env node

import { parseConfig } from './parser.js'
import { compareTwo, compareBase } from './comparer.js'
import { formatText, formatJson, formatMarkdown, formatJsonPatch } from './reporter.js'
import type { ReportFormat } from './types.js'
import { readFileSync, existsSync } from 'node:fs'

const VERSION = '0.1.0'

function showHelp() {
  console.log(`
configdiff v${VERSION} — detect configuration drift across environments

USAGE:
  configdiff <file1> <file2>              Compare two config files
  configdiff --base <file> --compare <f1,f2,...>  Compare multiple against a base

FORMATS (auto-detected from extension):
  .env, .json, .yaml/.yml, .ini/.cfg/.conf

FLAGS:
  --format <text|json|markdown>   Output format (default: text)
  --ignore-keys <k1,k2,...>       Keys to skip in comparison
  --base <file>                   Base file for multi-compare
  --compare <f1,f2,...>           Comma-separated compare targets
  --json-patch                    Output JSON patch (RFC6902-style) operations
  --no-color                      Disable colored output
  --version, -v                   Show version
  --help, -h                      Show this help

EXIT CODES:
  0  No drift found — configs are in sync
  1  Drift detected — review the output above
  2  Invalid input — file not found, parse error, or bad arguments

EXAMPLES:
  # Compare two .env files
  configdiff .env.dev .env.prod

  # Compare multiple environments against base
  configdiff --base config/default.json --compare config/dev.json,staging/prod.json

  # JSON output, ignoring known keys
  configdiff app.yaml staging.yaml --format json --ignore-keys DB_HOST,API_KEY

  # Markdown report
  configdiff base.ini dev.ini --format markdown

  # JSON patch output for programmatic use
  configdiff .env .env.prod --json-patch

SUPPORTED FORMATS:
  .env    KEY=VALUE lines, export prefix, quoted values, # comments
  .json   Standard JSON objects (nested, flattened with dot paths)
  .yaml   YAML mappings (uses yaml package, nested flattening)
  .ini    INI sections with key=value pairs (prefixed as section.key)

MORE INFO:
  https://github.com/rogerchappel/configdiff
`)
}

interface CliOptions {
  format: ReportFormat
  ignoreKeys: string[]
  baseFile?: string
  compareFiles?: string[]
  jsonPatch: boolean
  noColor: boolean
  positional: string[]
}

function parseArgs(args: string[]): CliOptions {
  const opts: CliOptions = {
    format: 'text',
    ignoreKeys: [],
    jsonPatch: false,
    noColor: false,
    positional: [],
  }

  let i = 0
  while (i < args.length) {
    const arg = args[i]
    switch (arg) {
      case '--format':
        i++
        opts.format = (args[i] || 'text') as ReportFormat
        break
      case '--ignore-keys':
        i++
        opts.ignoreKeys = (args[i] || '').split(',').filter(Boolean)
        break
      case '--base':
        i++
        opts.baseFile = args[i]
        break
      case '--compare':
        i++
        opts.compareFiles = (args[i] || '').split(',').filter(Boolean)
        break
      case '--json-patch':
        opts.jsonPatch = true
        break
      case '--no-color':
        opts.noColor = true
        process.env.NO_COLOR = '1'
        break
      case '--help':
      case '-h':
        showHelp()
        process.exit(0)
        break
      case '--version':
      case '-v':
        console.log(`configdiff v${VERSION}`)
        process.exit(0)
        break
      default:
        if (arg.startsWith('-')) {
          console.error(`Error: Unknown flag: ${arg}`)
          console.error('Run configdiff --help for usage information.')
          process.exit(2)
        }
        opts.positional.push(arg)
        break
    }
    i++
  }

  return opts
}

function main() {
  const args = process.argv.slice(2)
  const opts = parseArgs(args)

  // Determine comparison mode
  let baseFile: string | undefined
  let compareFiles: string[] | undefined

  if (opts.baseFile && opts.compareFiles) {
    baseFile = opts.baseFile
    compareFiles = opts.compareFiles
  } else if (opts.positional.length >= 2) {
    baseFile = opts.positional[0]
    compareFiles = opts.positional.slice(1)
  } else {
    console.error('Error: Please provide files to compare.')
    console.error('\n  configdiff file1.env file2.env')
    console.error('  configdiff --base base.env --compare dev.env,prod.env')
    console.error('\nRun configdiff --help for more information.')
    process.exit(2)
  }

  const bf = baseFile!
  const cfs = compareFiles!

  // Validate files exist
  for (const file of [bf, ...cfs]) {
    if (!existsSync(file)) {
      console.error(`Error: File not found: ${file}`)
      process.exit(2)
    }
  }

  // Parse configs
  let baseEntries: ReturnType<typeof parseConfig>
  try {
    baseEntries = parseConfig(bf)
  } catch (err) {
    console.error(`Error: Failed to parse ${bf}: ${(err as Error).message}`)
    process.exit(2)
  }

  const compareConfigs: Array<ReturnType<typeof parseConfig>> = []
  for (const file of cfs) {
    try {
      compareConfigs.push(parseConfig(file))
    } catch (err) {
      console.error(`Error: Failed to parse ${file}: ${(err as Error).message}`)
      process.exit(2)
    }
  }

  // Compare
  const results = compareBase(
    bf,
    baseEntries,
    cfs,
    compareConfigs,
    {
      ignoreKeys: opts.ignoreKeys.length ? opts.ignoreKeys : undefined,
    }
  )

  // JSON patch mode
  if (opts.jsonPatch) {
    console.log(JSON.stringify(formatJsonPatch(results), null, 2))
    // Exit 1 if any patches exist
    const hasPatches = results.some(r => r.entries.length > 0)
    process.exit(hasPatches ? 1 : 0)
  }

  // Standard output modes
  let output: string
  switch (opts.format) {
    case 'json':
      output = formatJson(results)
      break
    case 'markdown':
      output = formatMarkdown(results)
      break
    case 'text':
    default:
      output = formatText(results)
      break
  }

  console.log(output)

  // Exit code
  const hasDrift = results.some(r => r.entries.length > 0)
  process.exit(hasDrift ? 1 : 0)
}

main()
