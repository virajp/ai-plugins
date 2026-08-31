---
name: eslint
version: 0.1.0
category: development
description: ESLint as the repo's correctness gate — flat config only, zero
  formatting rules, overrides scoped by `files` glob rather than disabled
  globally, and one lint command wired through the task library. Auto-applies
  when editing an eslint config or .config/linter.yaml.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/eslint.config.js"
  - "**/eslint.config.mjs"
  - "**/eslint.config.cjs"
  - "**/eslint.config.ts"
  - "**/.eslintrc*"
  - "**/.config/linter.yaml"
---

# ESLint — the correctness gate

ESLint answers **"is this code wrong?"**. It carries **no formatting rules** —
dprint owns whitespace and layout, and a formatting rule here guarantees the two
tools eventually disagree on the same line with no way to satisfy both.

The default in this toolkit is `@askviraj/linter`: a self-contained ESLint CLI
that bundles ESLint and every plugin (TS, JSON/JSONC, CSS, HTML, Markdown, YAML,
TOML, Astro) behind an opinionated flat config. It is **zero-config** — a repo
using it needs no `eslint.config.*` and no plugin installs. A repo that already
has its own ESLint setup keeps it; do not migrate one uninvited.

## Flat config only

`eslint.config.js` (or `.mjs`/`.ts`), never `.eslintrc*`. The legacy format is
end-of-life, its cascade resolution is invisible, and the two formats do not
compose — a repo carrying both is running whichever one that ESLint version
happens to prefer.

An `.eslintrc*` file found in a repo is a migration to raise, not a file to
edit.

## Scope an override; never disable globally

Reach for config only when a default genuinely misfires — never to make a real
finding disappear.

- **`@askviraj/linter`** — add `.config/linter.yaml` (`--init` scaffolds it).
  Prefer, in order: extra `ignores`, a per-preset `overrides` block, or a
  `configs` entry targeting specific `files`. A `files`-scoped override states
  *where* the rule is wrong; a global one states that nobody wanted to look.
- **Plain ESLint** — a trailing config object with `files` narrowed to the
  affected glob. Flat config is last-wins, so ordering is the mechanism.

An inline `eslint-disable` is acceptable for a genuinely one-off case **with a
reason on the same line**. A bare `eslint-disable` at the top of a file is not:
it silently covers every rule for every future edit to that file.

## Running it

```sh
mise run code:lint          # the gate
mise run code:lint --fix    # apply the mechanical fixes

pnpm dlx @askviraj/linter
pnpm dlx @askviraj/linter --fix
pnpm dlx @askviraj/linter --cache   # only changed files
```

`--fix` clears the mechanical findings; whatever remains is real. Fix the code
rather than loosening the rule.

## Where this stops

Which rules a language should enable, and the language's own idioms, belong to
the language's own skill (the `typescript` skill for TS/JS). This skill covers
the gate's shape, its config format, and how overrides are scoped.
