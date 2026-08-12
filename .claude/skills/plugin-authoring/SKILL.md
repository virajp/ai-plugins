---
name: plugin-authoring
description: Authoring discipline for this repo's plugin templates — the
  authored-vs-rendered split, the Eta helpers, the invocation decision tree, and
  the flat-namespace rules. Auto-applies when editing anything under templates/.
  Read the reference matching what you are changing.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "templates/**"
---

# Plugin Authoring

`templates/` is the **only authored tree**. `claude/`, `cursor/`, `ohmypi/`,
`opencode/`, `plugins.json`, `.claude-plugin/marketplace.json` and
`.cursor-plugin/marketplace.json` are machine-written output — never edit them
by hand, and never diagnose a bug by reading one as if it were source. Read the
template and the renderer (`build/src/`) instead.

## The one rule

A change under `templates/` is not done until the render has been rebuilt and
staged:

```sh
mise run plugins:build   # renders templates/ into every <repo>/<target>/
mise run plugins:check   # validates the source and all four rendered targets
```

The rendered trees are **committed**, so a template edited without a rebuild
looks fine locally and fails `plugins:render-clean` in CI. Nothing else catches
it — there is no runtime that reads `templates/`.

## What is authored where

| Path                        | Is                                                              |
| --------------------------- | --------------------------------------------------------------- |
| `plugin.yaml`               | the neutral manifest — name, version, servers, deps, `requires` |
| `skills/<name>/SKILL.md`    | a skill; auto-discovered, never listed in the manifest          |
| `skills/<name>/references/` | on-demand prose the SKILL.md points at                          |
| `agents/<name>.md`          | a subagent; auto-discovered                                     |
| `hooks/hooks.yaml`          | hooks as *intent*, plus the scripts beside it                   |
| `opencode-plugin/*.ts`      | OpenCode-only behaviour, shipped as authored TypeScript         |
| `stacks/<axis>/…`           | stack templates, on a stack plugin                              |

Adding any of these is one edit: create the file, run `plugins:build`. There is
no second place to register it.

## The four traps

Each is silent — the render succeeds and the mistake surfaces somewhere else.

1. **Eta needs `autoEscape: false` and `autoTrim: false`.** `autoTrim` strips
   the newline next to a tag, which reflows folded YAML scalars: same text,
   different bytes.
2. **dprint deliberately excludes `templates/**/*.md`** and every rendered tree.
   Do not format them — match the surrounding fold width by hand.
3. **Frontmatter must be strict-YAML valid.** Claude's parser is lenient; a
   strict parser rejects, and a rejected skill is dropped with no error.
4. **Bare prose naming a prefixed skill is a `plugins:check` failure.** Under
   `prefixSkillNames` (vwf) the flat targets emit `vwf-plan`, so a delegation
   written as `plan` resolves to nothing there — silently. Use `it.cmd()`.

## References

Read the one matching the change; do not read all four.

| Reference                                 | Covers                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| [rendering.md](references/rendering.md)   | the pipeline, the Eta helpers, what `plugins:check` asserts, frontmatter   |
| [invocation.md](references/invocation.md) | `model` / `user` / `both`, the per-target spellings, the flat namespace    |
| [manifests.md](references/manifests.md)   | `plugin.yaml` fields, the generated marketplaces, the three manifest traps |
| [hooks.md](references/hooks.md)           | neutral events, per-target mechanisms, script portability                  |

## Documentation

Any change to plugin behaviour must reconcile `readme.md`, `CLAUDE.md` and
`docs/plugins/<plugin>.md` in the **same commit** — the repo's hard rule.
Delegate the sweep to the `docs-reconciler` agent rather than reading those
files inline; `CLAUDE.md` and `docs/plugins/vwf.md` are large enough that
loading them costs the rest of the session.
