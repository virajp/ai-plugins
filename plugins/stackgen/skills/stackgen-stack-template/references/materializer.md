# The Materializer

Read this only on a **first pin** — a slug with no `.agents/templates/` entry
yet. It is the one code path that writes to a repo, and every write it makes
is consent-gated and committed once.

## Inputs

- The resolved source: a pack directory
  (`${CLAUDE_PLUGIN_ROOT}/stacks/<axis>/<slug>/`), or the generator's output
  (an in-memory pack in the same shape — `pack.yaml` fields, conventions
  prose, skills, agents).
- The repo root (the current checkout).

## Steps

1. **Assemble the landing set.** Everything that would be written:

   - `.agents/templates/<slug>.md` — `pack.yaml`'s payload fields as
     frontmatter (including per-language `facts`), `conventions.md` as body.
   - `.agents/skills/<name>/…` and `.agents/agents/<name>.md` — each skill
     and agent the source ships, copied verbatim.
   - `.claude/skills/<name>` and `.claude/agents/<name>.md` — **relative
     symlinks** into `.agents/`, per
     `${CLAUDE_PLUGIN_ROOT}/assets/agents-tree.md`.

2. **Collision check.** An existing `.agents/` entry with the same name that
   this set did not write is never overwritten — list it as a conflict for
   the user to resolve. An existing **non-symlink** `.claude/skills/<name>`
   is the repo's own skill: a conflict, same rule.

3. **The dry-run consent gate.** Present the full landing set as a plan —
   every path, created or conflicting, and (for generation) the reviewer's
   clean verdict — and ask before writing anything. The user may deselect
   skills/agents; the template entry itself is not deselectable (it is what
   the pin means). Declined → nothing is written, the pin stays unresolved,
   and the caller is told so.

4. **Write and commit.** On approval: write the set, then commit it as **one
   commit** via the repo's git workflow (the vwf git-workflow skill when
   present; plain `git add <paths>` + a conventional commit otherwise —
   never `git add -A`). The commit is what makes the tree repo-owned:
   collaborators pull files, not a plugin obligation.

5. **Return.** Re-read the freshly written `.agents/templates/<slug>.md` and
   return the payload from it — the same read every later fetch performs.

## Rules

- **Copy, never reference in place.** The repo owns its copies; the pack
  evolving does not change a repo until `/stackgen:stackgen-sync` shows the
  diff and the user takes it.
- **Symlinks are the wiring; copies are the fallback.** Symlink discovery is
  verified against the real tool (see `assets/agents-tree.md`). Only if a
  symlink demonstrably fails discovery in the user's environment, fall back
  to sync-maintained copies under `.claude/` — and say so in the dry-run
  plan, because it changes what sync must maintain.
- **Never touch `.claude/settings.json`**, hooks, or anything outside the
  two trees named here. Wiring machinery (MCP servers, LSP servers, hooks)
  is plugin-manifest territory, not materializer territory.
