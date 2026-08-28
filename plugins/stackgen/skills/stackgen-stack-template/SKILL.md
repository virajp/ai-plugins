---
name: stackgen-stack-template
description: Return one stackgen stack as a vwf template payload — reading the
  materialized entry from the repo's .claude/ tree, or, on a first pin,
  resolving the bundle's composition and dispatching per component (shipped
  pack components copied, uncovered components generated) behind a consent
  gate. Invoked by /vwf:architecture, /vwf:setup, /vwf:plan and /vwf:execute —
  not a general-purpose skill.
argument-hint: "<slug>"
disable-model-invocation: false
---

# stackgen-stack-template

Return the template payload for the slug the caller names, per the vwf
stack-adapter contract. This skill is the **dispatch rule**, and dispatch
runs **per component**: materialized entries are read back; a first pin
resolves the bundle's composition and materializes each component — shipped
packs by copy, uncovered components by generation. Materialization is
**explicit and consent-gated — never a silent re-run**.

> **`disable-model-invocation` must stay `false`** — see
> `stackgen-stack-menu`.

## Resolution order

1. **Materialized already?** Read `.claude/stackgen/templates/<slug>.md` at
   the repo root (in a worktree, the tree is part of the checkout like any
   committed file). If it exists: return the payload below, filled from its
   frontmatter with the body as `conventions:`. **Stop — never regenerate,
   never diff.** Drift against packs is `/stackgen:stackgen-sync`'s job, on
   the user's clock — and it acts per component.
2. **A first pin? Resolve the composition.** The slug names the bundle root
   — a shipped pack (`${CLAUDE_PLUGIN_ROOT}/stacks/<type>/<slug>/pack.yaml`
   exists), or `generated/<technology-slug>` when the root itself is
   uncovered. Resolve the rest of the composition per the root's kind and
   the component types that compose it
   (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`,
   `${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): read the repo's manifests
   and the config's `stack` block (`languages` / `frameworks` /
   `dependencies`) and name every component as a `<type>/<slug>` ref.
3. **Dispatch each component.** A component with a shipped pack
   (`stacks/<type>/<slug>/pack.yaml`) is a copy — read
   [the materializer](references/materializer.md). An uncovered component
   is a generation — read [the generator](references/generator.md):
   research, catalog instantiation, the `stackgen-skill-reviewer` gate, per
   component. The whole composition then lands **once** through the
   materializer — one dry-run plan, one consent, one commit — with the
   template entry recording the bundle as `components:` refs and the
   lockfile recording every landing per component, so a later re-sync can
   act on one component alone. Return the payload from the freshly
   materialized entry.
4. **Anything else is an error, not a guess.** Name the packs that do exist
   and the `generated/<technology-slug>` form. Never answer an unknown slug
   from general knowledge — a template this plugin has not materialized is a
   template the repo does not have.

## The payload

Return **only** this, filled from `.claude/stackgen/templates/<slug>.md`:

```yaml
slug: <the requested slug>
axis: project | backing | deploy | repo
kind: language-bundle | database | cloud-provider | repo-gate # assets/kinds.md
components: # the bundle's composition — the per-component dispatch record
  - <type>/<slug>@<pack version> # pack-sourced
  - <type>/<slug>@generated # generated
platforms: [ <platform> ] # project axis only
languages: [ <token> ]
language_facts: # per language — what /vwf:doctor verifies
  <token>: { lsp: <how provided | n/a>, mise_tool: <name | n/a>, manifest: <file | n/a> }
optional_languages: []
frameworks: [] # derived — the composition's framework component slugs
dependencies: []
capabilities: [] # backing axis — the components' capability tokens
artifact: <token> # deploy axis
package_manager: <token> # repo axis
harness:
  <capability>: { task: <name>, mechanism: <one line> } # or n/a
conventions: |
  <the entry's body, verbatim — do not summarize it away>
```

`language_facts` is the **materialized escape**: a language no curated plugin
claims is still *known* to vwf when its pin is a stackgen template carrying
these emitted facts — doctor verifies against them instead of against a
language plugin. Emitting them honestly (`n/a` included) is what keeps that
check real.

## Rules

- **Reads are cheap and pure.** Steps 2–3 run at most once per slug per repo;
  every later fetch is step 1 — a file read. `plan` and `execute` fetch
  conventions mid-run and must never trigger research, network, or a write.
- **Dispatch is per component; landing is per bundle.** Pack-or-generate is
  decided component by component — a covered language never regenerates
  because its framework is uncovered — but the user consents to one landing
  set and gets one commit, never a drip of gates.
- **Structure follows the kind; the slice follows the type.** Every
  composition declares a kind (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`) and
  each component ships the structural slice its type owns within it
  (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`) — the run never invents a
  structure.
- **The target repo is the current one by default.** In a multi-repo
  product the caller may name a member repo; each repo gets its own
  independent copies and its own lockfile — never one repo's copies pasted
  around.
- **The caller may pass context; this skill never reaches for another
  plugin's files.** vwf passes the principles-catalog paths into the
  invocation (the design-adapter payload style). If a generation run needs
  the catalog and none was passed, halt and say so — `${CLAUDE_PLUGIN_ROOT}`
  names this plugin's root, nothing else's.
- **All writes go through the consent gate and the git workflow** — see the
  materializer. A fetch (step 1) writes nothing, ever.
