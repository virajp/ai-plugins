---
name: dprint
version: 1.0.0
category: development
description: dprint as the repo's single formatter — config at
  .config/dprint.json so every call carries `--config`, plugins pinned by
  version, `excludes` for generated trees, and the `exec` escape hatch for
  languages dprint has no plugin for. Formatting authority; correctness belongs
  to the linter. Auto-applies when editing a dprint or taplo config.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/dprint.json"
  - "**/dprint.jsonc"
  - "**/.config/dprint.json"
  - "**/.config/taplo.toml"
---

# dprint — the repo formatter

**One formatter, one config, one repository.** dprint owns whitespace and layout
across every language in the repo; the linter owns correctness. Keeping them
apart is the rule — a formatting rule in the linter and a correctness rule in
dprint each cost more than they save, and the two then fight over the same line.

The config is **`.config/dprint.json`**, with the rest of the repo's tooling.
dprint discovers `dprint.json`/`dprint.jsonc` by walking up from the file it is
formatting and does **not** look inside `.config/`, so every invocation carries
`--config`. A call without it formats with built-in defaults and reports
success — the worst failure available here, because it looks like a pass.

In a monorepo the top-level config is the config; members read it through the
same `--config` path. A **submodule** is the exception and takes its own copy,
because it is a separate repository whose checkout may not contain the parent's
`.config/` at all, and a relative symlink out of it resolves to nothing.

## The config, and what each key is for

```jsonc
{
  "includes": ["**/*.ts", "**/*.json", "**/*.md", "**/*.toml"],
  "excludes": ["**/node_modules/", "**/dist/", "**/*-lock.yaml"],
  "markdown": { "lineWidth": 80 },
  "exec": {
    "commands": [
      { "command": "taplo fmt --config .config/taplo.toml -", "exts": ["toml"] }
    ]
  },
  "plugins": ["https://plugins.dprint.dev/typescript-0.0.0.wasm"]
}
```

- **`plugins` are pinned by version in the URL.** Unpinned, the same commit
  formats differently on two machines and the diff is attributed to whoever
  committed second.
- **`excludes` must cover every generated tree** — build output, lockfiles,
  vendored code, and anything a renderer writes. Formatting generated output is
  a permanent, meaningless diff and it breaks any check asserting the output
  matches a fresh generation.
- **`exec` is the escape hatch** for a language dprint has no plugin for: it
  pipes the file through an external formatter. Use it rather than adding a
  second formatter to the pre-commit chain, so `dprint check` stays the one
  question CI asks.

## The exclusion nobody expects: templated markdown

If the repo generates files from templates, **exclude the template sources**. A
formatter re-wraps prose to a line width measured on the template text, but a
template expression is far wider than what it renders to — so the output ends up
mis-wrapped even though the source looks right.

The same reasoning applies to any file whose committed form is derived rather than
authored: exclude it, and let whatever generates it decide its shape.

Note the trap on the way back out. An exclusion added for a reason that later
expires does not announce itself — the entry keeps working and nobody re-reads the
comment. When you retire a template layer, revisit its exclusions deliberately and
either drop them or write down the new reason they stand on.

## Running it

```sh
mise run code:format          # dprint check
mise run code:format --fix    # dprint fmt

dprint check --config .config/dprint.json --allow-no-files
dprint fmt   --config .config/dprint.json
```

`check` is what CI runs; `fmt` is what the pre-commit hook and a human run.
Never hand-fix whitespace to satisfy `check` — it is mechanical by construction,
and a hand-fix that differs from what `fmt` would produce fails again on the
next run.

`dprint config update --config .config/dprint.json` is how plugin versions move,
and it is a deliberate act run from `setup:mise`, not something that happens on
its own. Pinned plugins are the whole reason two machines format identically.

## The editor does not follow `--config`

The VS Code extension contributes three settings — `dprint.path`,
`dprint.verbose` and `dprint.experimentalLsp` — and **none of them names a
config file**. With the config under `.config/`, format-on-save finds nothing
and silently does nothing; the gate still holds, because the hook and CI both
pass `--config`, but the editor stops helping.

There is no pointer to write, so this pack ships none. The CLI path is the one
the gate depends on and it is correct either way; format-on-save is an editor
preference the root allowlist does not carry a file for, and a repo that wants
it back is deciding that for itself.

## Where this stops

Language-specific lint rules and the TypeScript lint gate belong to the
language's own skill (the `typescript` skill for TS/JS). This skill covers
the formatter and its config alone.
