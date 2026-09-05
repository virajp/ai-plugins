---
name: stackgen-sync
description: Diff the repo's materialized entries — the .claude/ tree and
  the repo config files a component landed — against the
  current component packs (and offer regeneration per generated component),
  presenting the delta for consent — the explicit re-sync that makes drift
  visible without ever overwriting silently. Also diffs the generated local
  plugin on this machine, where the lockfile records one. Run after
  upgrading stackgen,
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
   a path it does not list is the repo's own and is invisible to this
   skill. Partition entries by **component** (every landing carries its
   component ref) and by source: pack-sourced vs `generated`. Read the
   `settings_keys`, `mcp_servers` and `local_plugin` blocks too — those
   name state outside `.claude/`, and each diffs on its own terms below.

   **Entries are not all under `.claude/`.** A component may have landed
   repo config files from its `config/` tree — the toolchain manager's
   layers and task library, a gate's own config file, the hygiene files at
   the repo root, a provider's `.config/mise/conf.d/` fragment, a
   `.config/pre-commit.d/` hook fragment — and those are ordinary lockfile
   entries carrying a `path`, a `component`, a `hash` and a `mode`.
   Inventory them with the rest; they differ only in where they sit and in
   the consent line they take.

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

   A component's `config/` files diff on **exactly these terms** — same
   three states, same hashes, same per-component grain — with two things
   to carry through. **Mode is part of the file**: a
   `.config/mise/tasks/**` entry recorded `755` and now sitting 644 is a
   drift worth reporting, because mise reports a non-executable task file
   as an *unknown task* rather than as a permission error, and
   `mise run init` is the restore. And where two components write into
   one tree, re-derive in composition order — `toolchain-manager`, then
   `toolchain-gate`, then `repo-hygiene`, then `package-manager` /
   `language`, then `app-framework`, then `capability-provider`, later
   wins — and diff each file against the component
   the lockfile says supplied it. A
   file whose supplying component **changed** is a real delta, reported
   as such: it means precedence moved, not that the pack did.

   **`.config/pre-commit-config.yaml` is diffed outside its markers
   only.** The fragments a pack ships land as
   `.config/pre-commit.d/<pack>.yaml` files and are diffed there, like any
   other entry; the merged config is `/vwf:init`'s output, and the regions
   between its `# >>>` and `# <<<` markers are re-merged by init rather
   than reconciled here. So compare the file **around** those regions and
   report drift there; never rewrite inside them, and never treat a
   fragment that has moved as a reason to edit the merged file — say the
   fragment moved and that a re-run of init is what folds it in. Two
   things writing between the same markers is the one way this file could
   lose an edit.

3. **Offer regeneration per generated component.** A `generated` component
   has no pack to diff against; offer to re-run the generator for that
   component alone (the pipeline in `/stackgen:stackgen-stack-template`'s
   references — fresh research against its recorded citations, reviewer
   gate included) and diff its output against the repo's copy. Skip any
   component the user declines — regeneration costs research and review; it
   is an offer, not a default, and taking one component never forces
   another.

4. **Diff the local plugin, if the lockfile has one.** No `local_plugin`
   block → skip this step entirely; this repo has never written to the
   machine and a sync must not start. Otherwise read
   `~/.claude/plugins/local/stackgen-lsp/.claude-plugin/plugin.json` and
   compare, **key by key and only for the keys this repo claims** under
   `local_plugin.lsp_servers` / `local_plugin.mcp_servers`
   (`${CLAUDE_PLUGIN_ROOT}/skills/stackgen-stack-template/references/local-plugin.md`
   is the procedure — the merge classification, the version bump and the
   removal path):

   - a claimed key whose declaration the current pack has changed —
     **offer** the update;
   - a claimed key the manifest no longer holds — report it; the user
     removed it by hand and re-adding it uninvited is exactly the silent
     write this skill exists to prevent;
   - a claimed key whose component is no longer in the composition —
     offer **removal by subtraction**, which drops that key alone and
     touches no other repo's;
   - a key the manifest holds that this repo does not claim — invisible
     here, always. It is another repo's, or the user's.

   Everything in this step is **outside the repo and outside the commit**;
   only the `local_plugin` block moves with the lockfile.

5. **Present the delta for consent.** One consolidated dry-run plan,
   grouped **per component**: every file that would change, with its
   three-state classification. **Repo edits are never overwritten by
   default** — a *repo edited* file is taken only if the user picks it
   explicitly, and the default selection covers only *pack moved* files.
   Three things get their **own** consent lines rather than riding the
   file plan, and each is separately declinable:

   - any change to entries under `settings_keys` — a
     `.claude/settings.json` edit, and **settings.json is never modified
     without explicit consent**;
   - any change to entries under the top-level `mcp_servers` — a
     `.mcp.json` edit, on the same terms;
   - any change to a `config/`-tier entry — a write **outside
     `.claude/`**, into files the repo's collaborators own and read, so it
     is its own **tier-2** line listing every path, on the same
     merges-never-owns terms: only the paths this lockfile records are
     updated or removed, and a declined line leaves the `.claude/` side
     landed and says the tasks stay as they are;
   - anything from step 4 — the **tier-3** line, which says plainly that
     it writes to this machine outside the repo, and where a
     registration or de-registration is involved **prints the `claude`
     commands and asks; it never runs them unprompted**.

   Nothing selected → done, nothing written.

6. **Apply and commit.** Write only what was selected, update the changed
   components' lockfile hashes and the `local_plugin` block, and commit as
   one commit via the repo's git workflow. The local plugin's own files
   are on the machine, not in the commit.

## Rules

- **Visible, never silent** — every write traces to a line the user saw in
  the delta.
- **The component is the grain.** A framework's major bump regenerates that
  framework component alone; the language baseline beside it is untouched
  unless its own pack moved.
- **The lockfile is the boundary**, and it is the boundary **outside**
  `.claude/` too: a `.config/` file stackgen did not materialize is the
  repo's own and is never diffed, updated or removed, however exactly its
  path matches something a pack ships. Nothing in the repo is ever
  deleted without a line the user picked — a retired pack's copies stay
  until the user removes them.
- **Mode travels with a `config/` file.** Write back the recorded mode
  when a task file is taken; a `.config/mise/tasks/**` file restored 644
  is a task that has disappeared as far as mise is concerned.
- **The local plugin is the one thing subtracted rather than left.** It is
  the machine's shared file, not a repo copy, so a stale key there is
  another repo's problem rather than a note the user can ignore. Removal
  drops only the keys this repo's lockfile claims; the directory and the
  registration go only when subtracting leaves no servers at all, and only
  after the user confirms the two printed commands.
