# configdiff

Find configuration drift across environments. `configdiff` compares `.env`, JSON, YAML, and INI-style files, then reports missing keys, changed values, and severity-ranked differences for release and operations review.

## Install

```sh
npm install
npm run build
```

Run without installing globally:

```sh
npx configdiff .env.dev .env.prod
```

## CLI Usage

Compare two files:

```sh
configdiff fixtures/env-base.env fixtures/env-missing.prod.env
```

Compare multiple environments against a base file:

```sh
configdiff --base fixtures/env-base.env --compare fixtures/env-missing.dev.env,fixtures/env-missing.prod.env
```

Choose an output format:

```sh
configdiff fixtures/config-dev.yaml fixtures/config-prod.yaml --format markdown
configdiff fixtures/config-dev.json fixtures/config-prod.json --format json
```

Ignore keys that are expected to differ:

```sh
configdiff .env.dev .env.prod --ignore-keys DB_HOST,API_KEY
```

Generate JSON Patch-style operations for automation:

```sh
configdiff .env .env.prod --json-patch
```

Run the checked-in drift demo:

```sh
bash demo/run-config-drift-demo.sh
```

The demo builds the CLI, compares the fixture configs, writes Markdown, JSON,
and JSON Patch-style artifacts to a temporary directory, and verifies that drift
is reported with the expected non-zero exit code. A short recording outline is
available in [docs/promo/config-drift-demo.md](docs/promo/config-drift-demo.md).

## Supported Formats

- `.env`: `KEY=VALUE` lines, `export` prefixes, quoted values, and comments.
- `.json`: standard JSON objects with nested keys flattened to dot paths.
- `.yaml` and `.yml`: YAML mappings with nested keys flattened to dot paths.
- `.ini`, `.cfg`, and `.conf`: INI sections with keys prefixed by section name.

## Library API

```js
import { parseConfig, compareBase, formatMarkdown } from "configdiff";

const base = parseConfig("fixtures/env-base.env");
const prod = parseConfig("fixtures/env-missing.prod.env");
const results = compareBase("base", base, ["prod"], [prod]);

console.log(formatMarkdown(results));
```

## Exit Codes

- `0`: no drift found.
- `1`: drift detected and printed.
- `2`: invalid input, missing file, parse error, or bad arguments.

## Verify

```sh
npm run build
npm run check
npm run smoke
npm run package:smoke
npm run release:check
```

## Package Contents

The npm package includes the built CLI/library files plus `fixtures`, `docs`,
and `examples`. Those assets keep the README commands copy-pasteable after
install and make the release tarball easier to audit with `npm pack --dry-run`.

## Safety and Limitations

configdiff reads local configuration files and prints key/value differences, so review output before pasting it into tickets, pull requests, or chat systems. Use --ignore-keys for expected environment-specific secrets, and treat parse errors or unsupported file shapes as prompts for manual review rather than proof that two environments are aligned.

## License

MIT

## Development

Run the same checks locally before opening a PR:

- `npm run check` - `npm run lint && npm test`
- `npm run lint` - `tsc --noEmit`
- `npm run build` - `tsup`
- `npm test` - `node --test dist/test/*.test.js`
- `npm run smoke` - `node dist/cli.js fixtures/env-matching.dev.env fixtures/env-matching.prod-copy.env && echo 'smoke OK'`
- `npm run package:smoke` - `npm run build && npm pack --dry-run`
- `npm run release:check` - build, check, smoke, and package dry-run
