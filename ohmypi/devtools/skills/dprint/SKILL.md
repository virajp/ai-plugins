---
name: dprint
description: dprint as the repo's single formatter — one root config, plugins
  pinned by version, `excludes` for generated trees, and the `exec` escape hatch
  for languages dprint has no plugin for. Formatting authority; correctness
  belongs to the linter. Auto-applies when editing dprint.json.
globs:
  - "**/dprint.json"
  - "**/dprint.jsonc"
alwaysApply: false
---

# dprint — the repo formatter

**One formatter, one config, at the repo root.** dprint owns whitespace and
layout across every language in the repo; the linter owns correctness. Keeping
them apart is the rule — a formatting rule in the linter and a correctness rule
in dprint each cost more than they save, and the two then fight over the same
line.

In a monorepo the root config is the config. Symlink it into members that need
one rather than forking it; a per-member config is how two files in one repo end
up formatted differently.

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
formatter re-wraps prose to a line width measured on the template text, but the
expression `/skill:x` is far wider than what it renders to — so the
output ends up mis-wrapped even though the source looks right. This is not
hypothetical; it is why this repo's own `dprint.json` excludes
`templates/**/*.md`.

The same reasoning applies to any file whose committed form is derived rather
than authored.

## Running it

```sh
mise run code:format          # dprint check + package.json ordering
mise run code:format --fix    # dprint fmt

dprint check --config dprint.json --allow-no-files
dprint fmt   --config dprint.json
```

`check` is what CI and pre-commit run; `fmt` is what a human runs. Never
hand-fix whitespace to satisfy `check` — it is mechanical by construction, and a
hand-fix that differs from what `fmt` would produce fails again on the next run.

## Where this stops

Language-specific lint rules and the TypeScript lint gate are the language
plugin's (`typescript:lint-format`). This skill covers the formatter and its
config alone.
