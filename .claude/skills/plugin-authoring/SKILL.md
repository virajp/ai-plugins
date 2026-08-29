---
name: plugin-authoring
description: This repo's plugin doctrine — how a plugin is structured,
  packaged and registered, the two mise tasks, what plugins:check asserts, the
  language-plugin contract, and the traps specific to this marketplace.
  Auto-applies when editing anything under plugins/.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/**"
---

# Plugin Authoring — this repo

> **Plugin creation is this repo's alone and is deliberately not distributed.**
> There is no shipped plugin-authoring plugin: the one that existed was
> dissolved on 2026-08-29 because the toolkit has no business teaching plugin
> creation to anyone else.
>
> The doctrine split in two on the way out, and the halves have different homes:
>
> - **How a plugin is structured, packaged and registered** — the manifest,
>   directory-convention discovery, versions, the marketplace and its two traps
>   — is **here**, in [structure.md](references/structure.md).
> - **What makes a skill, agent or hook valid** — the invocation states and
>   their silent failure, strict-YAML frontmatter, hook verdict shapes, MCP and
>   LSP wiring — is **distributed via stackgen**, at
>   `plugins/stackgen/assets/artifact-doctrine.md`, because stackgen generates
>   those artifacts and its reviewer gates them against it. Read it when writing
>   a skill or a hook **anywhere**, including here: the rules are the host's and
>   apply to a plugin's artifacts exactly as they apply to a generated one.

`plugins/<name>/` is the **only authored tree** — what you edit is exactly what
a user installs. There is no template layer, no render step, and no per-target
variant.

One file is generated: **`.claude-plugin/marketplace.json`** at the repo root, a
projection of the 13 per-plugin manifests. Never edit it by hand.

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

## Two traps that are ours, not Claude's

1. **dprint deliberately excludes `plugins/**/*.md`.** Do not reach for the
   formatter — match the surrounding fold width by hand. (The exclusion outlived
   its original reason, which was Eta reflowing folded scalars. It stays because
   formatting ~2000 authored prose files is a decision, not a side effect.)
   `CLAUDE.md`, `readme.md` and `docs/` **are** formatted.
2. **A dependency stays inside this marketplace.** Add the name to
   `dependencies` in `plugin.json` with `"marketplace": "virajp-plugins"`; the
   marketplace entry is generated from it, and `plugins:check` asserts it
   resolves. Nothing here is url-sourced and nothing should be — the two outside
   dependencies vwf once had are **vendored skills** now, with provenance under
   `plugins/vwf/vendor/`.

## References

| Reference                                             | Covers                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| [structure.md](references/structure.md)               | the authored tree, `plugin.json`, versions, the marketplace and its traps    |
| [checks.md](references/checks.md)                     | what `plugins:check` asserts, rule by rule, and the technology-free guard    |
| [language-plugins.md](references/language-plugins.md) | the language-plugin contract — boundary, mandatory core, posture, collisions |

Artifact validity — frontmatter, invocation, hooks — is **not** in this table.
It is stackgen's `assets/artifact-doctrine.md`, and it applies here too.

## Documentation

Any change to plugin behaviour must reconcile `readme.md`, `CLAUDE.md` and
`docs/plugins/<plugin>.md` in the **same commit** — the repo's hard rule.
Delegate the sweep to the `docs-reconciler` agent rather than reading those
files inline; `CLAUDE.md` and `docs/plugins/vwf.md` are large enough that
loading them costs the rest of the session.
