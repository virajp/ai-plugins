---
name: stackgen-stack-template
description: Return one stackgen stack as a vwf template payload — reading the
  materialized entry from the repo's .claude/ tree, or, on a first pin,
  running the dispatch (pack copy, or generation for an uncovered technology)
  behind a consent gate. Invoked by /vwf:architecture, /vwf:setup, /vwf:plan
  and /vwf:execute — not a general-purpose skill.
argument-hint: "<slug>"
disable-model-invocation: false
---

# stackgen-stack-template

Return the template payload for the slug the caller names, per the vwf
stack-adapter contract. This skill is the **dispatch rule**: materialized
entries are read back; a first pin materializes — packs by copy, uncovered
technologies by generation. Materialization is **explicit and consent-gated —
never a silent re-run**.

> **`disable-model-invocation` must stay `false`** — see
> `stackgen-stack-menu`.

## Resolution order

1. **Materialized already?** Read `.claude/stackgen/templates/<slug>.md` at
   the repo root (in a worktree, the tree is part of the checkout like any
   committed file). If it exists: return the payload below, filled from its
   frontmatter with the body as `conventions:`. **Stop — never regenerate,
   never diff.** Drift against packs is `/stackgen:stackgen-sync`'s job, on
   the user's clock.
2. **A shipped pack?** If `${CLAUDE_PLUGIN_ROOT}/stacks/*/<slug>/pack.yaml`
   exists, this is a first pin: read
   [the materializer](references/materializer.md) and follow it — dry-run
   plan, consent, copy, lockfile, one commit — then return the payload from
   the freshly materialized entry.
3. **`generated/<technology-slug>`?** A first pin of an uncovered technology:
   read [the generator](references/generator.md) and follow it — research,
   catalog instantiation, the `stackgen-skill-reviewer` gate, then the same
   materializer consent and landing. Return the payload from the materialized
   entry.
4. **Anything else is an error, not a guess.** Name the packs that do exist
   and the `generated/<technology-slug>` form. Never answer an unknown slug
   from general knowledge — a template this plugin has not materialized is a
   template the repo does not have.

## The payload

Return **only** this, filled from `.claude/stackgen/templates/<slug>.md`:

```yaml
slug: <the requested slug>
axis: project | backing | deploy | repo
kind: language-bundle | database | cloud-provider # assets/kinds.md
platforms: [ <platform> ] # project axis only
languages: [ <token> ]
language_facts: # per language — what /vwf:doctor verifies
  <token>: { lsp: <how provided | n/a>, mise_tool: <name | n/a>, manifest: <file | n/a> }
optional_languages: []
frameworks: []
dependencies: []
capabilities: [] # backing axis
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
- **Structure follows the kind.** Every pack and every generation run
  declares a kind (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`), and the kind
  decides what artifacts land and their shape — the run never invents a
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
