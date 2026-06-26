#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="${TMPDIR:-/tmp}/configdiff-demo-$$"

cleanup() {
  rm -rf "$tmp_dir"
}
trap cleanup EXIT

cd "$repo_root"
npm run build

mkdir -p "$tmp_dir"

set +e
node dist/cli.js fixtures/env-base.env fixtures/env-missing.prod.env \
  --format markdown > "$tmp_dir/drift.md"
markdown_status=$?

node dist/cli.js fixtures/config-dev.json fixtures/config-prod.json \
  --format json > "$tmp_dir/drift.json"
json_status=$?

node dist/cli.js fixtures/env-base.env fixtures/env-missing.prod.env \
  --json-patch > "$tmp_dir/drift.patch.json"
patch_status=$?
set -e

test "$markdown_status" -eq 1
test "$json_status" -eq 1
test "$patch_status" -eq 1
test -s "$tmp_dir/drift.md"
test -s "$tmp_dir/drift.json"
test -s "$tmp_dir/drift.patch.json"
grep -q "fixtures/env-missing.prod.env" "$tmp_dir/drift.md"
grep -q "severity" "$tmp_dir/drift.json"
grep -q "op" "$tmp_dir/drift.patch.json"

printf 'configdiff demo artifacts written under %s\n' "$tmp_dir"
