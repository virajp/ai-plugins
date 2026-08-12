# Decisions — karpathy vendoring, one mempalace config, two upgrade fixes

**Date** 2026-08-13 · **Branch** `worktree-docs-karpathy-mempalace` · **Plan**
`docs/scratchpad/plan/2026-08-12-docs-karpathy-mempalace.md`

Mirrors the mempalace entry (wing `ai-plugins`); both stores written together,
per `templates/vwf/assets/memory.md`.

## Why karpathy was vendored

The same reason mempalace was, and it is worth stating once so it is not
re-litigated: **a url-sourced plugin has no rendered bundle.** Cursor's manifest
is generated from local plugins only, Oh-My-Pi parses the URL and then silently
drops the entry, and OpenCode's copy adapter has nothing to copy. Only Claude's
marketplace could resolve it. Three of four targets installed `vwf` and got none
of the behavioural guidelines it assumes are active, each failing quietly.

**The marketplace now has no url-sourced plugin at all.** The `localOnly` /
`onSkip` path stays as live code and is covered by a synthetic fixture; the
tests were rewritten rather than deleted, because deleting them would have left
that path untested while it still runs.

**Licence:** upstream ships no licence text — `gh api` reports `"license": null`
and the root listing has none, while MIT is declared in the skill frontmatter
and `plugin.json`. A `NOTICE.md` quotes both verbatim. **Do not "fix" this by
adding a LICENSE file**; shipping an MIT text the author never published is
worse than an honest note. Re-check the position on every resync.

## Why the mempalace config sits at the repo root, not `.config/`

The plan specified `.config/mempalace.yaml`. **It is not discoverable**, proven
three ways before any doctrine was written:

- probe with the config in `.config/` only →
  `No mempalace.yaml found … using auto-detected defaults`, everything routed to
  `general`; control at the root → correct rooms;
- `miner.py` `load_config` does `resolved_project_dir / "mempalace.yaml"`, and
  `room_detector_local.py` repeats the same root-only lookup independently;
- the CLI has no `--config` flag — only `--palace` and `--backend`.

A root symlink into `.config/` was tested and works, and was **not** chosen.

The failure mode is why this matters: a misplaced config is **silently inert**.
The mine still runs, reports defaults, and files everything into `general`.
Nothing errors, so the only symptom is recall coming back empty months later.

## Why mining the checkout, not a `git archive` export

The plan said export tracked files only. Rejected on two grounds:

- `mempalace mine` **already honours `.gitignore` by default** (`--no-gitignore`
  opts out), and `mempalace sync` prunes drawers whose sources became ignored,
  deleted or moved;
- every drawer records the `source_path` it came from, so mining an export would
  record `/tmp/...` paths that do not exist — breaking recall's file pointers
  **and** the prune pass, which matches on those same paths.

So: mine the checkout, never pass `--no-gitignore`, and keep the secret denylist
as the backstop for a credential committed anyway, which `.gitignore` by
definition cannot catch.

## The two upgrade fixes, and how they were found

Neither was reachable by a unit test. Both were found by the `target-verifier`
agent driving the **real** CLIs.

- **Claude** caches plugin content per version and answers "already installed"
  without re-resolving, so a newer payload sat on disk while the old version
  stayed live. Re-running the install is the documented upgrade path, so it
  delivered nothing to existing users.
- **Oh-My-Pi** caches the marketplace catalog. Content did refresh, but its
  records lied — and a plugin **added** in a later release could not be
  installed at all.

**The trap worth remembering:** `claude plugin update` takes the
`<name>@<marketplace>` selector like `install`, **not** the bare name like
`uninstall`. The first fix used the bare name, failed with
`Plugin "vwf" not found`, and — because the payload copy runs first and the
throw escaped before the receipt was written — turned a silent no-op into a hard
failure that stranded the install with nothing to uninstall from. **The unit
test passed anyway, because the fake accepts any argument.** Tests now assert
the full argv, and the update is soft so a failed bump never destroys the
receipt.

## Not done, deliberately

- **The live palace is not repaired.** Wing `95octane` holds 13,312 drawers in
  eight rooms, all path-derived, and **not one of the seven protocol rooms
  exists**. Agent-written memory has nowhere correct to land. Fix by running
  `/vwf:setup` against that repo now this has shipped; it re-files drawers, so
  it needs its own consent gate.
- **Six pre-existing installer bugs** were found and left alone as out of scope:
  the Cursor statusline orphan, an `opencode.jsonc` created by the installer
  being deleted wholesale on uninstall, a stale `.ownership.json` entry
  surviving a pruned file, graphify's skill files surviving uninstall unclaimed
  by any receipt, the Cursor receipt recording `scope: user` for project-scope
  installs, and the stale karpathy registration on Claude that errors and blocks
  `claude plugin prune` (it does **not** double-load).
- `macos-setup/dotfiles/mempalace/dockerfile.mempalace` is now dead code —
  pitchfork runs `mempalace-mcp` on the host and the compose file holds only
  Qdrant. Outside this repo.
