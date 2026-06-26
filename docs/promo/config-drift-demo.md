# configdiff drift demo brief

## Demo promise

Show how configdiff turns checked-in environment fixtures into reviewable drift
reports for humans and automations.

## Recording flow

1. Run `bash demo/run-config-drift-demo.sh`.
2. Open `drift.md` from the printed temporary directory and show the
   human-readable missing and changed keys.
3. Open `drift.json` to show structured severity data.
4. Open `drift.patch.json` to show JSON Patch-style operations for automation.

## Grounded talking points

- The CLI supports `.env`, JSON, YAML, and INI-style config files.
- Drift exits with code `1`, so the demo treats that status as expected.
- `--ignore-keys` can suppress keys that are allowed to differ.
- `--json-patch` emits machine-readable operations for workflows that need a
  structured remediation hint.

## Short post hooks

- "Config drift should be a review artifact, not a surprise in prod."
- "One CLI, four config formats, human and machine-readable drift reports."
- "Use configdiff when agents need a local, deterministic map of environment gaps."
