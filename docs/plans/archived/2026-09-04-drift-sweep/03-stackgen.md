# U3 — stackgen: assets, skills, packs

- **Wave:** 1
- **Depends on:** —
- **Owns:** `plugins/stackgen/**` except `plugins/stackgen/stacks/inventory.md`
  (generated, U8) and `plugins/stackgen/.claude-plugin/plugin.json` (U8)
- **Model:** inherit
- **Read first:** every owned file named below, top to bottom, before editing.
  Read `plugins/stackgen/assets/taxonomy.md`, `assets/pack-format.md`,
  `assets/output-tree.md` and `assets/artifact-doctrine.md:40-60` first.
- **Lazy-load:** `plugins/vwf/assets/harness.md:10-22` (the capability
  vocabulary; read-only, U1 owns it), `plugins/stackgen/stacks/readme.md`,
  `plugins/stackgen/skills/stackgen-stack-template/references/generator.md:70-80`
  and `.../materializer.md:25-35` (the citations filename).

## Ruling

Quoted from index.md:

> 4 — Drop `private_plane` from both plugins.

> 5 — Flutter's harness key renames `screenshots` → `goldens`, same task
> `test:golden`.

> 6 — Firebase categories: taxonomy's cloud-service list gains `identity` and
> `messaging`; `firebase-auth` sets `identity`, `firebase-messaging` sets
> `messaging`.

> 7 — Composition order: `toolchain-manager`, then `package-manager` /
> `language`, then `toolchain-gate`, then `app-framework` — in both files that
> state it.

> 8 — `kinds.md:74` invocation ruling: Doc follows the packs: "routers
> paths-scoped", matching the app-framework ruling at `kinds.md:683`.

> 9 — Emulator-start task name: `stack:up` in flutter's `firebase-auth.md:49`.

> 10 — `pack-format.md:12-15` framing: States the present: eight
> `toolchain-gate` packs, no curated plugins. Same at
> `stackgen-stack-template/SKILL.md:91`.

> 11 — Counts in prose: structural ones corrected (eight TypeScript bundles).

## Edits

1. **`assets/pack-format.md`** — lines 12-15: replace the Wave A sentence and
   "Everything else remains the curated plugins' until its wave lands" with a
   present-tense statement: the `toolchain-gate` type ships eight packs (list
   them from the tree), every pack in the tree is authored here, and no curated
   plugin stands behind any of them — the same fact `stacks/readme.md:209`
   states. Line 82: delete the `private_plane:` row.
2. **`assets/taxonomy.md`** — lines 86-87: the cloud-service list becomes
   `compute / sql / document / queue / object-storage / cdn / access / identity
   / messaging`.
3. **`stacks/cloud-service/firebase-auth/pack.yaml`** — add `category: identity`
   directly after `type: cloud-service` (line 6), matching the key order the
   other categorized packs use (see `stacks/cloud-service/cloud-run/pack.yaml`).
4. **`stacks/cloud-service/firebase-messaging/pack.yaml`** — add
   `category: messaging` the same way.
5. **`stacks/app-framework/flutter/pack.yaml`** — line 61: the harness key
   `screenshots:` becomes `goldens:`; task and mechanism unchanged.
6. **`stacks/app-framework/flutter/skills/flutter/references/integrations/firebase-auth.md`**
   — line 49: `mise run setup:deps:start` becomes `mise run stack:up`, and the
   parenthetical says it is the pack's `local_stack` task.
7. **`assets/output-tree.md`** — line 133: the composition order becomes
   "`toolchain-manager`, then `package-manager` / `language`, then
   `toolchain-gate`, then `app-framework`", keeping the "a later component's
   file wins" sentence. Line 44: `citations/<slug>.yaml` becomes
   `citations/<component-slug>.yaml`, matching `generator.md:76` and
   `materializer.md:30`.
8. **`skills/stackgen-sync/SKILL.md`** — line 59: the same four-tier order.
9. **`skills/stackgen-stack-menu/SKILL.md`** — lines 57-59: the payload block's
   `slug: <pack directory name>`, `axis: <pack.yaml axis>`,
   `kind: <pack.yaml kind>` become `slug: <bundle filename without .md>`,
   `axis: <bundle frontmatter axis>`, `kind: <bundle frontmatter kind>`,
   consistent with step 1 at lines 24-40.
10. **`skills/stackgen-stack-template/SKILL.md`** — line 91: "a language no
    curated plugin claims" becomes "a language no shipped bundle covers".
11. **`assets/kinds.md`** — line 74: the language-bundle Invocation line becomes
    "routers paths-scoped; doctrine paths-scoped (…)", matching the two shipped
    routers and the app-framework ruling at line 683.
12. **`stacks/readme.md`** — line 161: "the twelve TypeScript ones" becomes "the
    eight TypeScript ones"; re-read the sentence so the enumeration around it
    still sums to the bundle count the inventory states (32).

## Verification

- `mise run plugins:check` passes.
- `mise run plugins:inventory --check` still passes (no pack or bundle is added
  or renamed; `category` is not an inventory field — confirm by reading
  `scripts/src/inventory.ts` if in doubt; if it is, return the fact as a `GAP:`
  and U8 regenerates).
- `grep -rn 'private_plane' plugins/stackgen` returns nothing.
- `grep -n 'screenshots' plugins/stackgen/stacks/app-framework/flutter/pack.yaml`
  returns nothing; `grep -n 'goldens' …` returns the harness key.
- `grep -rn 'setup:deps:start' plugins/stackgen` returns nothing.
- `grep -rn 'curated plugin' plugins/stackgen` returns only
  `stacks/readme.md:209`'s "No curated plugin stands behind any pack any more"
  or equivalent negations.
- `grep -rn 'twelve' plugins/stackgen/stacks/readme.md` returns nothing.

## Guardrails

- Do not touch `plugins/stackgen/stacks/inventory.md` or
  `plugins/stackgen/.claude-plugin/plugin.json` (U8 — the description fix rides
  the bump). Do not touch `plugins/vwf/**` (U1, U2).
- `plugins/**/*.md` is not dprint-formatted: match the surrounding fold width.
- Pack payload files under `stacks/**/config/` are byte-copied into user repos;
  none is named here — do not edit one.
- Strict-YAML: `pack.yaml` edits are validated by the checker; keep two-space
  indentation and the existing key order.
- Byte-copy, never retype, any line you are not changing.

## Commit

`fix(stackgen): categorize the firebase packs, goldens for flutter,
toolchain-gate in the composition order, drop private_plane and the curated-
plugin framing`
— written by the orchestrator after the wave gate, not by the unit.
