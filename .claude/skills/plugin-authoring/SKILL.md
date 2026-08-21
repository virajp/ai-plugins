---
name: plugin-authoring
description: This repo's own plugin gates — the two mise tasks, what
  plugins:check asserts, the language-plugin contract, and the traps specific
  to this marketplace. Auto-applies when editing anything under plugins/. The
  host doctrine lives in the claude-code plugin; this covers only what is
  ours.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "plugins/**"
---

# Plugin Authoring — this repo

> **Claude Code's own plugin doctrine is not here.** Directory-convention
> discovery, the invocation frontmatter and its silent failure, the manifest
> fields, the `${CLAUDE_PLUGIN_ROOT}` trap and hooks all live in
> `plugins/claude-code/skills/plugin-authoring/` — a shipped plugin, so the
> doctrine travels to any repo writing Claude Code plugins. This skill covers
> only what is **this marketplace's**: our gates, our checker, our contract for
> a language plugin.
>
> That plugin is authored here, so its references are readable at
> `plugins/claude-code/skills/plugin-authoring/references/`. Read them for the
> host rules; read below for ours.

`plugins/<name>/` is the **only authored tree** — what you edit is exactly what
a user installs. There is no template layer, no render step, and no per-target
variant.

One file is generated: **`.claude-plugin/marketplace.json`** at the repo root, a
projection of the 15 per-plugin manifests. Never edit it by hand.

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
| [checks.md](references/checks.md)                     | what `plugins:check` asserts, rule by rule, and the technology-free guard    |
| [language-plugins.md](references/language-plugins.md) | the language-plugin contract — boundary, mandatory core, posture, collisions |

## Documentation

Any change to plugin behaviour must reconcile `readme.md`, `CLAUDE.md` and
`docs/plugins/<plugin>.md` in the **same commit** — the repo's hard rule.
Delegate the sweep to the `docs-reconciler` agent rather than reading those
files inline; `CLAUDE.md` and `docs/plugins/vwf.md` are large enough that
loading them costs the rest of the session.
