---
name: stackgen-stack-menu
description: Return the stack options the stackgen plugin offers — its shipped
  packs plus the one open entry, generate-for-anything-uncovered — as a vwf
  menu payload. Invoked by /vwf:architecture and /vwf:setup when `stackgen` is
  listed in the config's `stacks:` — not a general-purpose skill.
disable-model-invocation: false
model: sonnet
effort: low
---

# stackgen-stack-menu

Return the options this plugin offers, per the vwf stack-adapter contract.
**Return the payload and nothing else** — no prose, no recommendation, no
comparison. Choosing is the user's job and presenting the choice is vwf's.

> **`disable-model-invocation` must stay `false`.** A user-only skill is
> removed from the model's context entirely and cannot be invoked
> programmatically — vwf does not get an error, it gets an empty menu.

## How to answer

1. List `${CLAUDE_PLUGIN_ROOT}/stacks/*/*/pack.yaml`. Each is one **pack**: its
   slug is its directory name, and `axis`, `platforms`, `name` and `summary`
   come from the file (`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`).
2. Return the payload below. The `generate` block is present on **every**
   answer — it is the open entry, and it is what makes an empty pack list read
   as a decision rather than a fault.

```yaml
plugin: stackgen
note: Packs listed here are curated and copied verbatim. Any technology no
  pack covers can be GENERATED — pin `generated/<technology-slug>` on the
  axis that needs it, and the first template fetch runs the generation
  pipeline (researched via Context7, instantiated against vwf's principles
  catalog, gated by review and your consent) into the repo-owned .agents/
  tree. Generation needs Context7 reachable and halts without it.
templates:
  - slug: <pack directory name>
    axis: <pack.yaml axis>
    platforms: [ <platform> ] # project axis only
    name: <display name>
    summary: <one line>
generate:
  pin: generated/<technology-slug>
  axes: [ project, backing, deploy, repo ]
  summary: Generate principles-grounded skills and conventions for any stack
    no pack covers. Explicit, reviewed, consent-gated — never a silent run.
```

**If `stacks/` holds no packs, return `templates: []`** with the same `note`
and `generate` block. That is this plugin's honest state until the merge
waves land packs.

## Rules

- **Packs are exhaustive; generation is the only open door.** Never invent a
  pack entry, and never present generation as if it were a curated pack — the
  trust level differs and the user is choosing between them.
- Do not read the repo, the registry, or `.config/vwf.yaml`. This skill
  answers the same way in every product; the dispatch happens in
  `/stackgen:stackgen-stack-template`, not here.
