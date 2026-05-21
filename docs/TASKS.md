# ConfigDiff - Implementation Tasks

## Phase 0: PRD (done)
- [x] Write PRD.md

## Phase 1: Package Setup
- [ ] Set up package.json: name=configdiff, type=module
- [ ] Configure tsconfig.json
- [ ] Create src/cli.ts, src/parser.ts, src/comparer.ts, src/formats/env.ts, src/formats/yaml.ts, src/formats/json.ts, src/formats/ini.ts
- [ ] Set up vitest config

## Phase 2: Config Format Parsers
- [ ] .env parser: KEY=VALUE, comments, multiline values, quoted values
- [ ] JSON parser: standard JSON parsing
- [ ] YAML parser: use yaml library
- [ ] INI parser: sections, key=value pairs
- [ ] Detect format from file extension or --format flag
- [ ] Support nested path access for JSON/YAML/INI (flatten to dot paths)

## Phase 3: Comparer
- [ ] Compare two files: missing keys in either direction, conflicting values
- [ ] Compare N files against a base: --base file1 --compare file2,file3,file4
- [ ] Severity classification:
  - critical: key missing in production (prod env name detection)
  - warning: key missing in staging
  - info: key only in dev
- [ ] Support --ignore-keys for known differences
- [ ] Support JSON patch output (--json-patch)

## Phase 4: Reporter
- [ ] Text summary: overview of drift per file pair
- [ ] Detail mode: per-key diffs with values
- [ ] JSON output mode (--format json)
- [ ] Markdown table mode (--format markdown)
- [ ] Colorized output: red=missing, yellow=conflicting, green=OK
- [ ] Exit code 0 = no drift, exit code 1 = drift found

## Phase 5: CLI
- [ ] Main command: compare two files (configdiff file1 file2)
- [ ] Multi-compare mode: --base file --compare file1,file2,...
- [ ] Flags: --format, --ignore-keys, --base, --compare, --severity-level, --json-patch
- [ ] Help text and examples

## Phase 6: Tests & Fixtures
- [ ] Create fixtures/ with:
  - .env files: matching, missing keys, conflicting values
  - JSON configs: matching, nested differences
  - YAML configs: matching, missing keys
  - INI configs: matching, different sections
- [ ] Unit tests for each format parser
- [ ] Unit tests for comparer
- [ ] Integration test for CLI with fixtures
- [ ] Run vitest

## Phase 7: Docs & Polish
- [ ] Write README with personality
- [ ] Write CONTRIBUTING.md
- [ ] Add to GitHub: description, topics
- [ ] npm test, npm run build, npm run check
- [ ] Smoke test: run on fixtures
