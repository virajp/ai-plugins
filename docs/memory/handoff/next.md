# Handoff: next

The stack-closure work and four releases are **done, merged, and published**.
Nothing is in flight. `main` is clean and in sync with `origin/main`.

Written 2026-08-10, superseding the re-architecture handoff (that work landed in
`v3.0.0`).

## Workspace

|               |                                                                |
| ------------- | -------------------------------------------------------------- |
| **Checkout**  | `~/Projects/github.com/virajp/ai-plugins` (main, no worktrees) |
| **`main`**    | in sync with `origin/main`                                     |
| **Published** | `@askviraj/ai-plugins@3.1.0`, `latest` on npm                  |
| **Tree**      | clean; rendered trees match a fresh render                     |

## What shipped

**`v3.0.0` — the re-architecture, plus closing vwf's stack model.** vwf names no
technology; its stack menu is now **closed** to what the installed plugins
define. An unknown language and a `custom` template pin are both **blocking**
`doctor` findings, so `setup`, `plan` and `execute` all halt rather than
building against a stack with no conventions, harness or UX gate.
`config_format` 13 → 14. `plan` gained the same gate (scoped to its dependency
chain, before the surveyor). `/vwf:feedback canvas` stopped reaching one design
tool's MCP server directly and now goes through a third adapter skill,
`design-tools-import-conversations`.

**`v3.0.1` — `--all` failed on Cursor and Oh-My-Pi.** Only Claude's marketplace
can fetch a url-sourced plugin (`andrej-karpathy-skills`); the skip that knew
this was gated on OpenCode alone. Also redesigned the run report: aligned table,
notes collected after the results, one line per skipped plugin, statusline rows
collapsed, closing verdict.

**`v3.0.2` — repeat runs, and `--upgrade` actually upgrading.**
`omp plugin
install` errors on a plugin it already has, so Oh-My-Pi failed on
every run after the first; it now passes `--force`, which is also the only way
to refresh, since omp copies into its own cache. The worse half was silent:
`pnpx` resolves to a **version-specific** store path, so both CLI-driven
adapters kept a marketplace pin naming whichever version first registered it —
Claude was reading 3.0.0's rendered trees while reporting "already up to date".
Both now re-point a pin when old and new are **both** inside a `node_modules`
install of this package.

**`v3.1.0` — a live step indicator.** Collecting the notes had left the run
silent for seconds at a time. It is a step indicator, not a spinner: every
adapter blocks on `spawnSync`, so a timer-driven spinner would freeze on one
frame. Off entirely when stderr is not a TTY.

## The lesson worth carrying

**Three of four releases fixed something found by running the real command.**
Every one of those bugs appeared only on the **second** run, and nothing in the
suites ran anything twice — `i:test` covers a first run against a throwaway
`HOME`, so the whole class was invisible.

Two things now guard it, and the second matters more than the first:

- Each adapter suite has a **`survives three consecutive installs`** test.
- The Oh-My-Pi fake now **refuses what the real `omp` refuses**. Its
  permissiveness was the actual root cause: it accepted any `plugin install`
  while the real tool errors on a duplicate, so the suite stayed green while
  every user's second run failed. Verified by reverting the `--force` fix and
  watching the new test go red.

**When adding an adapter or a fake, make the fake reject what the tool
rejects.** A fake that says yes to everything only tests that you called it.

## Open, in priority order

1. **`i:test` still only covers a first run.** The unit-level repeat tests use
   fakes; there is no end-to-end "install, then install again" against real
   binaries. CI has neither `claude` nor `omp`, so a real-binary test would skip
   there — it would need stub executables on `PATH`. Worth doing, not urgent now
   that the fakes are honest.
2. **OpenCode reports 274 changes on every run.** It copies unconditionally, so
   a no-op run still reads as a large update. Not a failure, but it makes a
   genuine change indistinguishable from noise.
3. **The OpenCode TUI statusline is still unverified in the real world.** Its
   one unproven assumption is which key inside `api.route.current` holds the
   session id — `tools/statusline/opencode-tui.tsx` searches rather than
   guessing. If the bar shows only project and branch, that search is why.
4. **`plan`'s stack read.** Now wired (it fetches template `conventions:` prose
   at its stack gate), but the surveyor deliberately does **not** receive that
   prose — it answers *what exists*, not *where a new thing belongs*. Revisit
   only if reuse candidates turn out to need it.

## Stale scratchpad

`docs/scratchpad/` holds `stack-closure.md` (fully executed), plus
`re-architecture.md`, `gaps.md` and its own `next.md` from the previous effort.
All are gitignored and none is current. Safe to delete; kept only as a record.

## Rules that bit during this work

- **Work in a worktree, never the main checkout.** Slipped once and had to move
  the edit across.
- **`EnterWorktree` branches from `origin/main`, not local `main`.** With
  unpushed commits a fresh worktree silently misses them — run
  `git merge --ff-only main` right after creating one.
- **A backtick in `git commit -m` is command substitution in fish.** Use
  `-F <file>`.
- **`i:release` needs explicit go-ahead** (hard rule in `CLAUDE.md`), and every
  tag gets a GitHub Release right after.
- **osv-scanner gates the publish.** It blocked `v3.0.0` on a low-severity
  `esbuild` advisory; the fix is an entry in `pnpm-workspace.yaml`'s
  `overrides`. Run `mise x -- osv-scanner --lockfile=pnpm-lock.yaml` before
  releasing.
