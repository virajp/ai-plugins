---
name: stackgen-sync
description: Diff the repo's materialized .claude/ entries against the
  current component packs (and offer regeneration per generated component),
  presenting the delta for consent — the explicit re-sync that makes drift
  visible without ever overwriting silently. Run after upgrading stackgen,
  or any time you want to see how far the repo's copies have drifted.
disable-model-invocation: true
---

# stackgen-sync

The explicit re-sync. Everything stackgen materializes is **repo-owned** —
copies the project may edit, that a pack upgrade must never overwrite
silently. This skill is the one place drift becomes visible and the user
decides what to take, and it works **per component**: one component's drift
or upgrade never churns the rest of its bundle. It is user-only by design:
nothing invokes it programmatically, so a sync only ever happens on the
user's clock.

## Steps

1. **Inventory, from the lockfile.** Read `.claude/stackgen/lock.yaml`
   (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md`). No lockfile → report
   "nothing materialized" and stop. The lockfile is the whole inventory:
   a path in `.claude/` it does not list is the repo's own and is invisible
   to this skill. Partition entries by **component** (every landing carries
   its component ref) and by source: pack-sourced vs `generated`.

2. **Diff pack-sourced components.** For each component, re-derive its
   landing set from the current pack
   (`${CLAUDE_PLUGIN_ROOT}/stacks/<type>/<slug>/`, per
   `${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`) and classify each file by
   hash against the lockfile and the tree — three states, reported per
   file: **unchanged**, **pack moved** (the pack's version/content changed,
   the copy still matches its landing hash), **repo edited** (the copy no
   longer matches its landing hash — whether or not the pack also moved).
   A pack that no longer exists in this stackgen version is reported, never
   deleted.

3. **Offer regeneration per generated component.** A `generated` component
   has no pack to diff against; offer to re-run the generator for that
   component alone (the pipeline in `/stackgen:stackgen-stack-template`'s
   references — fresh research against its recorded citations, reviewer
   gate included) and diff its output against the repo's copy. Skip any
   component the user declines — regeneration costs research and review; it
   is an offer, not a default, and taking one component never forces
   another.

4. **Present the delta for consent.** One consolidated dry-run plan,
   grouped **per component**: every file that would change, with its
   three-state classification. **Repo edits are never overwritten by
   default** — a *repo edited* file is taken only if the user picks it
   explicitly, and the default selection covers only *pack moved* files.
   Any change to entries under the lockfile's `settings_keys` is a
   `.claude/settings.json` edit and gets its own consent line —
   **settings.json is never modified without explicit consent**. Nothing
   selected → done, nothing written.

5. **Apply and commit.** Write only what was selected, update the changed
   components' lockfile hashes, and commit as one commit via the repo's
   git workflow.

## Rules

- **Visible, never silent** — every write traces to a line the user saw in
  the delta.
- **The component is the grain.** A framework's major bump regenerates that
  framework component alone; the language baseline beside it is untouched
  unless its own pack moved.
- **The lockfile is the boundary**: entries stackgen did not materialize
  are never touched, and nothing is ever deleted — a retired pack's copies
  stay until the user removes them.
