---
name: eslint
version: 0.1.0
category: development
description: The house lint/format gate — @askviraj/linter (ESLint, bundled)
  as
  the lint gate and dprint as the formatter. Both must pass before commit. Covers
  flat config as the only supported ESLint format, how to run each, how to scope
  rule overrides and inline disables, and common failure remedies. Auto-applies
  when editing dprint.json, an eslint config (including a legacy .eslintrc), or
  .config/linter.yaml.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/dprint.json"
  - "**/dprint.jsonc"
  - "**/eslint.config.*"
  - "**/.eslintrc*"
  - "**/.config/linter.yaml"
---

# Lint & Format Gate

Two independent gates, split by concern — **both must pass before a commit**:

- **Lint** — `@askviraj/linter`, a self-contained ESLint CLI that bundles ESLint
  and every plugin (TS, JSON/JSONC, CSS, HTML, Markdown, YAML, TOML, Astro). It
  owns **correctness**.
- **Format** — `dprint` (config in `dprint.json`), plus `sort-package-json` for
  `package.json` key order. It owns **whitespace and layout**.

Keep them apart: dprint reformats, the linter finds real problems. There are no
formatting rules in the linter and no correctness rules in dprint — don't make
one do the other's job.

A repo that already has its own ESLint setup keeps it; do not migrate one
uninvited.

## Flat config only

`eslint.config.js` (or `.mjs`/`.ts`), never `.eslintrc*`. The legacy format is
end-of-life, its cascade resolution is invisible, and the two formats do not
compose — a repo carrying both is running whichever one that ESLint version
happens to prefer.

An `.eslintrc*` file found in a repo is a migration to raise, not a file to
edit.

## Running it

In a mise repo, run through the task library — the tasks add the wrappers and
target the whole tree:

```sh
mise run code:format          # dprint check (verify) + sort-package-json --check
mise run code:format --fix    # dprint fmt (apply) + sort-package-json
mise run code:lint            # pnpm dlx @askviraj/linter
mise run code:lint --fix      # apply the linter's auto-fixes
mise run code:all             # aggregate: format → lint → sec
```

Direct invocation (what those tasks wrap):

```sh
# Lint — defaults to the current directory
pnpm dlx @askviraj/linter
pnpm dlx @askviraj/linter --fix          # auto-fix what's mechanical
pnpm dlx @askviraj/linter src/ tests/    # limit to targets
pnpm dlx @askviraj/linter --cache        # only changed files

# Format
dprint check --config dprint.json        # verify (CI / pre-commit)
dprint fmt   --config dprint.json        # apply
```

The linter is **zero-config** — it ships an opinionated flat config, so no
`eslint.config.*` or plugin installs are needed in the repo.

## Customizing

Only reach for config when a default genuinely misfires — never to make a real
finding disappear.

- **Linter:** add `.config/linter.yaml` (`pnpm dlx @askviraj/linter --init`
  scaffolds it). Scope changes narrowly: extra `ignores`, per-preset `overrides`
  (preset names: `javascript`, `typescript`, `astro`, `json`, `jsonc`,
  `markdown`, `markdown-typescript`, `yaml`, `toml`, `html`, `css`), or a
  `configs` entry that targets specific `files`. Prefer a `files`-scoped
  override to a global one.
- **Plain ESLint** — a trailing config object with `files` narrowed to the
  affected glob. Flat config is last-wins, so ordering is the mechanism.
- **Formatter:** edit `dprint.json` (`includes`/`excludes`, per-language
  `lineWidth`, the `exec` block for external formatters like `taplo`).

A `files`-scoped override states *where* the rule is wrong; a global one states
that nobody wanted to look.

An inline `eslint-disable` is acceptable for a genuinely one-off case **with a
reason on the same line**. A bare `eslint-disable` at the top of a file is not:
it silently covers every rule for every future edit to that file.

## Failure remedies

- **Format check fails** → run `dprint fmt` (or `mise run code:format --fix`).
  It's mechanical; never hand-fix whitespace to satisfy it.
- **`package.json` order fails** → `mise run code:format --fix` runs
  `sort-package-json`.
- **Lint fails** → `--fix` clears the mechanical ones; the rest are real. Fix
  the code, don't loosen the rule. If a rule is genuinely wrong for a file,
  scope an override in `.config/linter.yaml` to that `files` glob — never
  disable it globally to get green.
- **The two disagree on a line** → they shouldn't; if a lint rule fights
  dprint's formatting, that's a rule to scope off in `.config/linter.yaml`,
  since dprint is the formatting authority.

## Where this stops

Which rules a language should enable, and the language's own idioms, belong to
the language's own skill (the `typescript` skill for TS/JS). This skill covers
the gate's shape, its config format, and how overrides are scoped.
