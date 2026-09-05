---
name: plugin-authoring
description: This repo's plugin doctrine — how a plugin is structured,
  packaged and registered, the three mise tasks, what plugins:check asserts,
  and the traps specific to this marketplace. Auto-applies when editing
  anything under plugins/.
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

Two files are generated: **`.claude-plugin/marketplace.json`** at the repo root,
a projection of the 2 per-plugin manifests, and
**`plugins/stackgen/stacks/inventory.md`**, a projection of the stacks tree.
Never edit either by hand.

## The one rule

A change under `plugins/` is not done until the gates pass:

```sh
mise run plugins:check              # validates the authored tree
mise run plugins:marketplace        # regenerate, if you touched a manifest
mise run plugins:inventory          # regenerate, if you touched stackgen's stacks/ or kinds.md
```

`--check` on the two generators is what CI and pre-commit run. It exists because
each output is generated **and** committed, so a source edited without a
regenerate is invisible to every other check — this is the one piece of
staleness the retired `plugins:render-clean` was really guarding, narrowed to
the two files that still have the problem.

## Three traps that are ours, not Claude's

1. **dprint deliberately excludes `plugins/**/*.md`.** Do not reach for the
   formatter — match the surrounding fold width by hand. (The exclusion outlived
   its original reason, which was Eta reflowing folded scalars. It stays because
   formatting ~2000 authored prose files is a decision, not a side effect.)
   `CLAUDE.md`, `readme.md` and `docs/` **are** formatted.
2. **`plugins/*/stacks/*/*/config/` is excluded too, and for a different
   reason.** That tier is **payload** — copied byte-for-byte into a target repo,
   where the *gate pack's own* dprint config formats it. That config
   deliberately omits the `bracketSpacing`/`braceSpacing` this repo sets, so a
   payload file formatted here comes out different from what the shipped config
   produces, and a freshly initialised repo fails its own first `--all-files`
   hook run on a file nobody touched. It has happened. The exclusion is on the
   **directory**, so a new payload file type cannot silently re-acquire the
   defect; when a payload file genuinely needs formatting, run the **shipped**
   config over it, never this repo's.
3. **A dependency stays inside this marketplace.** Add the name to
   `dependencies` in `plugin.json` with `"marketplace": "virajp-plugins"`; the
   marketplace entry is generated from it, and `plugins:check` asserts it
   resolves. Nothing here is url-sourced and nothing should be — the two outside
   dependencies vwf once had are **vendored skills** now, with provenance under
   `plugins/vwf/vendor/`.

## Hooks

Hooks are authored directly as a plugin's `hooks/hooks.json`, in Claude's own
format, with the scripts beside it. Three rules that bite, whichever plugin the
hook belongs to:

1. **Scripts must be portable to macOS BSD `sed`** — no `\s`, no `\b`.
2. **Plugin hooks are never written to `settings.json`.** They are
   auto-discovered from `hooks/hooks.json`, so verify them with `/hooks`.
3. **A script's verdict shape is decided by its event**, not by convention.
   `hookSpecificOutput.permissionDecision` is `PreToolUse`-only; `Stop` and
   `PreCompact` deny with the top-level `decision`/`reason`, and Claude rejects
   the whole verdict if a `hookSpecificOutput` arrives without a matching
   `hookEventName` — which reads exactly like a hook that decided to stay quiet.

`plugins:check`'s hook rule reads only a plugin's own `hooks/hooks.json`; a
script a stackgen pack ships as payload is covered elsewhere (the
`stackgen-plugin` skill). The host rules in full are stackgen's
`assets/artifact-doctrine.md` §4.

## References

| Reference                               | Covers                                                                    |
| --------------------------------------- | ------------------------------------------------------------------------- |
| [structure.md](references/structure.md) | the authored tree, `plugin.json`, versions, the marketplace and its traps |
| [checks.md](references/checks.md)       | what `plugins:check` asserts, rule by rule, and the technology-free guard |

Artifact validity — frontmatter, invocation, hooks — is **not** in this table.
It is stackgen's `assets/artifact-doctrine.md`, and it applies here too. Nor is
the language-plugin contract that used to sit beside these: it is retired with
the curated language plugins, and a language is a stackgen `language-bundle`
kind now, per `plugins/stackgen/assets/kinds.md`.

## Documentation

Any change to plugin behaviour must reconcile `readme.md`, `CLAUDE.md` and
`site/src/content/docs/plugins/<plugin>.md` in the **same commit** — the repo's
hard rule. Delegate the sweep to the `docs-reconciler` agent rather than reading
those files inline; `CLAUDE.md` and the vwf manual are large enough that loading
them costs the rest of the session.
