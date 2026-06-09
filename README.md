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

## Development

Run the same checks locally before opening a PR:

- `npm run check` - npm run lint && npm test
- `npm run lint` - tsc --noEmit
- `npm run build` - tsup
- `npm test` - node --test dist/test/*.test.js
- `npm run smoke` - node dist/cli.js fixtures/env-matching.dev.env fixtures/env-matching.prod.env && echo 'smoke OK'
- `npm run package:smoke` - npm run build && npm pack --dry-run
- `npm run release:check` - npm run lint && npm test && npm run smoke && npm run build && npm pack --dry-run
