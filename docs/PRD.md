# ConfigDiff PRD

Status: in-progress

## Summary

ConfigDiff is a local-first TypeScript CLI that compares configuration files across environments (dev, staging, production) to find missing keys, conflicting values, and drift — supporting `.env`, YAML, JSON, INI, and TOML formats.

## Motivation

Multi-environment configs drift silently. A key is added to `dev.env` but never promoted to `prod.env`. A value changes between staging and production without a ticket. These mismatches cause runtime errors that are tedious to debug.

ConfigDiff compares config files pairwise or across N environments, reporting: keys present in one file but missing in another, conflicting values (same key, different value), and a summary of drift severity.

## Target users

- DevOps engineers managing environment-specific configurations
- Developers debugging "works on my machine but not in prod" issues
- OSS projects with example configs that need to stay in sync
- Agentic workflows that modify configs and want to verify completeness

## Goals

- Compare two config files (`configdiff file1 file2`) or N files with a base (`configdiff --base base.env --compare dev.env,staging.env,prod.env`)
- Support multiple config formats: `.env`, YAML, JSON, INI, TOML
- Detect missing keys, extra keys, and conflicting values
- Output a diff report: text summary, JSON, and markdown table modes
- Support key path matching for nested configs (JSON/YAML/TOML)
- Highlight severity: missing in production = critical, missing in dev = info only
- Support `--ignore-keys` for known differences (e.g., `DB_HOST`, `API_KEY`)
- Support `--json-patch` output for programmatic diffing

## Non-goals

- Modifying config files automatically
- Validating config schema correctness (use cfglint for that)
- Syncing secrets across environments

## Source attribution

Inspired by diff-env-config tools, dot-env-diff, and general multi-environment configuration management practices. This is a local-first take that works offline and supports multiple config formats in one tool.
