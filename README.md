# configdiff

Find config drift across environments — compare `.env`, JSON, YAML, and INI files for missing keys, conflicting values, and severity-ranked diffs.

`configdiff` is a local-first CLI tool. It reads your config files, compares them environment by environment, and reports what's missing, what conflicts, and how severe each drift looks.

## Quickstart

```bash
npm install
npm run build
npm run smoke
```

## CLI

```bash
configdiff <env-a> [env-b] [--format json|table] [--severity low|medium|high]
```

Or without installing globally:

```bash
node dist/cli.js fixtures/env-matching.dev.env fixtures/env-matching.prod.env
```

## Supported formats

- `.env` (dotenv)
- `.json`
- `.yaml` / `.yml`
- `.ini`

## Verify

Run local verification before opening a PR or publishing:

```bash
npm test
npm run release:check
```

`release:check` runs lint, tests, smoke verification, and build to ensure everything ships cleanly.

## License

MIT © Roger Chappel
