---
name: stackgen-sync
description: Diff the repo's materialized .agents/ entries against the current
  packs (and offer regeneration for generated entries), presenting the delta
  for consent — the explicit re-sync that makes drift visible without ever
  overwriting silently. Run after upgrading stackgen, or any time you want to
  see how far the repo's copies have drifted.
disable-model-invocation: true
---

# stackgen-sync

The explicit re-sync. The `.agents/` tree is **repo-owned** — copies the
project may edit, that a pack upgrade must never overwrite silently. This
skill is the one place drift becomes visible and the user decides what to
take. It is user-only by design: nothing invokes it programmatically, so a
sync only ever happens on the user's clock.

## Steps

1. **Inventory.** List `.agents/templates/*.md` at the repo root. No tree →
   report "nothing materialized" and stop. Partition by slug shape
   (`${CLAUDE_PLUGIN_ROOT}/assets/agents-tree.md`): pack-sourced vs
   `generated/…`.

2. **Diff pack-sourced entries.** For each, re-derive the landing set from
   the current pack (`${CLAUDE_PLUGIN_ROOT}/stacks/…`, per
   `${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`) and diff it against the
   repo's copies — the template entry, and each copied skill/agent. Three
   states per file, reported per file: **unchanged**, **pack moved** (the
   pack changed, the copy did not), **repo edited** (the copy diverged from
   what the pack shipped — whether or not the pack also moved). A pack that
   no longer exists in this stackgen version is reported, never deleted.

3. **Offer regeneration for generated entries.** A `generated/…` entry has
   no pack to diff against; offer to re-run the generator (the pipeline in
   `/stackgen:stackgen-stack-template`'s references, reviewer gate included)
   and diff its fresh output against the repo's copy. Skip any entry the
   user declines — regeneration costs research and review; it is an offer,
   not a default.

4. **Present the delta for consent.** One consolidated dry-run plan: every
   file that would change, with its three-state classification. **Repo
   edits are never overwritten by default** — a *repo edited* file is taken
   only if the user picks it explicitly, and the default selection covers
   only *pack moved* files. Nothing selected → done, nothing written.

5. **Apply and commit.** Write only what was selected, keep the symlinks
   consistent (a renamed skill re-wires its `.claude/` link), and commit as
   one commit via the repo's git workflow.

## Rules

- **Visible, never silent** — every write traces to a line the user saw in
  the delta.
- This skill never touches entries stackgen did not materialize, and never
  deletes: a retired pack's copies stay until the user removes them.
