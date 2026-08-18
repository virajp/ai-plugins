---
name: plugin-authoring
description: Authoring discipline for this repo's plugins — the one authored
  tree, what is generated from it, the invocation frontmatter, and what
  plugins:check asserts. Auto-applies when editing anything under plugins/.
  Read the reference matching what you are changing.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/**"
---

# Plugin Authoring

`plugins/<name>/` is the **only authored tree**, and it is Claude Code's native
plugin format — what you edit is exactly what a user installs. There is no
template layer, no render step, and no per-target variant.

One file is still generated: **`.claude-plugin/marketplace.json`**, a projection
of the 13 per-plugin manifests. Never edit it by hand.

## The one rule

A change under `plugins/` is not done until both gates pass:

```sh
mise run plugins:check              # validates the authored tree
mise run plugins:marketplace        # regenerate, if you touched a manifest
```

`--check` on that second task is what CI and pre-commit run. It exists because
the marketplace manifest is generated **and** committed, so a manifest edited
without a regenerate is invisible to every other check — this is the one piece
of staleness the retired `plugins:render-clean` was really guarding, narrowed to
the one file that still has the problem.

## What is authored where

| Path                         | Is                                                       |
| ---------------------------- | -------------------------------------------------------- |
| `.claude-plugin/plugin.json` | the manifest — name, version, description, servers, deps |
| `skills/<name>/SKILL.md`     | a skill; auto-discovered, never listed in the manifest   |
| `skills/<name>/references/`  | on-demand prose the SKILL.md points at                   |
| `agents/<name>.md`           | a subagent; auto-discovered                              |
| `hooks/hooks.json`           | hooks, plus the scripts beside them                      |
| `assets/`                    | shared doctrine and data the skills read                 |
| `stacks/<axis>/…`            | stack templates, on a stack plugin                       |
| `vendor/`                    | provenance for vendored third-party skills               |

Adding any of these is one edit: create the file. Only a **manifest** change
needs the generator re-run.

## The four traps

Each is silent — nothing errors, and the mistake surfaces somewhere else.

1. **Frontmatter must be strict-YAML valid.** Claude's own parser is lenient; a
   strict parser rejects, and a rejected skill is dropped with **no error**.
   `plugins:check` is what catches it.
2. **dprint deliberately excludes `plugins/**/*.md`.** Do not reach for the
   formatter — match the surrounding fold width by hand. (The exclusion outlived
   its original reason, which was Eta reflowing folded scalars. It stays because
   formatting ~2000 authored prose files is a decision, not a side effect.)
3. **`${CLAUDE_PLUGIN_ROOT}` is *this* plugin's root, and nothing spells
   another's.** A reference to an asset a different plugin owns resolves to
   nothing at runtime. Name the contract instead, and rely on the caller having
   it. This shipped broken in every render tree for months before the checker
   caught it — see `plugins/typescript/stacks/deploy/npm-package.md`.
4. **A dependency is one edit, and only inside this marketplace.** Add the name
   to `dependencies` in `plugin.json` with `"marketplace": "virajp-plugins"`;
   the marketplace entry is generated from it. `plugins:check` asserts it
   resolves.

## References

Read the one matching the change; do not read all four.

| Reference                                             | Covers                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| [checks.md](references/checks.md)                     | what `plugins:check` asserts, rule by rule, and the technology-free guard    |
| [invocation.md](references/invocation.md)             | the two frontmatter keys, the three states, and which one a skill needs      |
| [language-plugins.md](references/language-plugins.md) | the language-plugin contract — boundary, mandatory core, posture, collisions |
| [manifests.md](references/manifests.md)               | `plugin.json` fields, the generated marketplace, the manifest traps          |
| [hooks.md](references/hooks.md)                       | the hook events, `hooks.json`, verdict shapes, script portability            |

## Documentation

Any change to plugin behaviour must reconcile `readme.md`, `CLAUDE.md` and
`docs/plugins/<plugin>.md` in the **same commit** — the repo's hard rule.
Delegate the sweep to the `docs-reconciler` agent rather than reading those
files inline; `CLAUDE.md` and `docs/plugins/vwf.md` are large enough that
loading them costs the rest of the session.
