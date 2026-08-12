# Session — plan authored, mempalace wiring debugged (2026-08-12 → 13)

Written to the markdown mirror **because mempalace writes are currently landing
in the wrong palace** (see below). Not in the palace; only here.

## What was produced

`docs/scratchpad/plan/2026-08-12-docs-karpathy-mempalace.md` (757 lines) — a
plan for a fresh session covering four asks: make the `release` skill
model-invocable; move plugin docs to `docs/plugins/`; author `docs/cli/`; absorb
`andrej-karpathy-skills` into `vwf`; and make `/vwf:setup` enforce one
`mempalace.yaml` per product. Sixteen decisions (D1–D16) are settled in the
plan's decision table. Steps delegate to subagents; Step 0 is the entry point.

## The mempalace wiring bug, root-caused

**The literal tilde.** `MEMPALACE_PALACE_PATH` was set to the quoted string
`'~/.local/share/mempalace'`. `~` is expanded by the shell only for unquoted
text typed in a command — **never** for text arriving from a variable. Pitchfork
substituted it verbatim, mempalace saw a path not starting with `/`, treated it
as **relative**, and resolved it against the daemon's cwd `~/.config/pitchfork`
(a symlink to `macos-setup/dotfiles/pitchfork`). Result:
`~/.config/pitchfork/~/.local/share/mempalace/`.

**Why restarting the daemon never fixed it.** The pitchfork **supervisor** (pid
60682, started 23:19) predates the fix and still holds the stale value. Every
daemon it spawns inherits the *supervisor's* env, not the shell's — so a fresh
child (36268, 01:02) had the same wrong value. Verified with `ps eww`.

**Fix:** restart the supervisor, and/or make the run command independent of the
variable — `--palace $HOME/.local/share/mempalace`, mirroring the sibling qdrant
daemon which already uses `$HOME` and works.

**Palace identity is the path string.** Each palace dir holds
`qdrant_backend.json` with `palace_id` (absolute path), a derived `palace_hash`,
and the Qdrant `remote_prefix`. Two processes share a palace only if the path
**and** the URL strings match exactly. Four distinct palaces were created this
session by four different path strings.

**Setting `MEMPALACE_QDRANT_URL` without `MEMPALACE_BACKEND` silently selects
Chroma.** That is how 11 437 drawers went into a 71 MB `chroma.sqlite3` instead
of Qdrant.

**Reads fail loudly, writes fail silently.** `mempalace_status` errors, but
`mempalace_diary_write` returned `success: true` while creating a new ChromaDB
in the junk directory. A write that reports success is not evidence the memory
layer works.

## Current state

- Qdrant: **13 313 drawers**, `mempalace_c0655d864595323b_*` — the good data
- Marker at `~/.local/share/mempalace`: `palace_id` matches, url
  `http://127.0.0.1:6333`
- Daemon: still pointed at the junk path — **memory layer not usable**
- Debris: `~/.config/pitchfork/~/` (inside the dotfiles repo via symlink) —
  check it was not committed

## Also found

`vwf@virajp-plugins` showed `✘ failed to load` because the install record pinned
**15.1.0** while the marketplace advertised **15.1.1**. Reinstalling fixed it.
The source manifest carries **no `version` field** — the version lives only in
the marketplace entry, so a record and a marketplace can drift with no local
signal. Worth a `plugins:check` assertion.
