---
description: Retrieve a handoff document from mempalace (wing=<project>,
  room=handoff, drawer=<name>) to resume work in a fresh session, and optionally
  run its next prompt. Use to continue after a session that exceeded ~60% context.
argument-hint: "<name>"
model: sonnet
effort: medium
---

# recall — Resume Work from a Handoff

Retrieve a handoff written by `/vwf:handoff` and reconstruct enough context to
continue the work in **this fresh session**.

**When to use:** at the start of a new session when the previous one grew
**beyond ~60% context** and you want to continue with a clean window.

## Inputs

| Input       | Source                                            |
| ----------- | ------------------------------------------------- |
| `<name>`    | `$ARGUMENTS` — the handoff drawer name.           |
| `<project>` | the **wing**, resolved from the repo (see step 1) |

---

## Pipeline

### 1. Resolve the project (wing)

Resolve `<project>` from the repo identity **exactly as `/vwf:handoff` does**
(so they agree): prefer the `origin` remote repo name
(`git remote get-url origin`, stripped of host/owner/`.git`), else the repo root
basename (`git rev-parse --show-toplevel`); reconcile against existing wings
with `mempalace_status` / `mempalace_list_wings` and reuse the exact existing
name.

**Verify the wing matches this repo** before searching: the resolved wing must
correspond to the repo you are in. If it doesn't (e.g. the reconciled wing
belongs to a different project), **fail loudly** — say so and stop, rather than
recalling a handoff from the wrong project.

### 2. Find the handoff

If `$ARGUMENTS` named no `<name>`, list what's available:
`mempalace_list_drawers(wing=<project>, room="handoff")` → show the names (from
each `# Handoff: <name>` header) and ask which to recall.

With a `<name>`, retrieve it:

1. `mempalace_list_drawers(wing=<project>, room="handoff", limit=100)` and match
   the drawer whose content opens with `# Handoff: <name>`. If several match,
   take the **most recent** by the handoff doc's own **`Date`** field (the
   metadata bullet the template sets) — not drawer insertion order.
2. Fetch the full content with `mempalace_get_drawer(drawer_id)`.
   (`mempalace_search(query="<name>", wing=<project>, room="handoff")`,
   optionally with `source_file="handoff/<name>.md"`, is an equivalent path.)

**If mempalace is unavailable or has no match**, read `docs/handoffs/<name>.md`
from disk (the `/vwf:handoff` fallback). If neither yields anything, say so and
stop — don't guess the prior state.

### Format check

Before rebuilding context off the blueprint, run the preflight in
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md` (as the other consuming commands
do); if the repo's blueprint format is behind what vwf ships, nudge `/vwf:setup`
(proceed unless a needed artifact is missing).

### 3. Rebuild context

Read the handoff, then **read the files and docs it points to** (relevant files,
`docs/blueprint/…`, referenced mempalace rooms) so the work is grounded in the
current code, not just the handoff's snapshot. Summarize back to the user in a
few lines: the goal, current state, and the open next steps.

**Re-enter the workspace.** Read the handoff's **Workspace** section (worktree
path + branch). If the path still exists, continue there. If it is **gone**,
don't silently proceed as if the work vanished — resolve by the branch:

- **Branch merged** into the destination → the work landed; resume from the
  **main checkout**.
- **Branch still exists, un-merged** → recreate the worktree for it via
  `/vwf:git-workflow`, then continue there.
- **Neither** (branch absent, nothing merged) → say so and stop; the work can't
  be located.

### 4. Offer the next prompt

If the handoff has a **Next prompt** section, show it and **ask the user whether
to run it now**:

- **Yes** → proceed to execute that prompt (route through the matching `/vwf:`
  command — `blueprint` / `plan` / `execute` / `autopilot` — when it names one).
  Resuming a cap-paused `/vwf:autopilot` run is the primary use of this command.
- **No** → stop after the summary; the user drives from here.

If there is no next prompt, end with the summary and the open items, and wait
for direction.
