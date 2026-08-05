---
name: recall
description: Retrieve a handoff document from mempalace (wing=<project>,
  room=handoff,
  drawer=<name>) to resume work in a fresh session, and optionally run its
  next prompt. With no argument — or `next` — it resumes the reserved `next`
  handoff and runs its continuation without asking. Use to continue after a
  session that exceeded ~60% context.
disable-model-invocation: true
---

# recall — Resume Work from a Handoff

Retrieve a handoff written by `/handoff` and reconstruct enough context to
continue the work in **this fresh session**.

**When to use:** at the start of a new session when the previous one grew
**beyond ~60% context** and you want to continue with a clean window.

## Inputs

| Input       | Source                                                  |
| ----------- | ------------------------------------------------------- |
| `<name>`    | `$ARGUMENTS` — the handoff drawer name. Empty → `next`. |
| `<project>` | the **wing**, resolved from the repo (see step 1)       |

## The `next` handoff

`next` is the reserved "resume where I left off" handoff `/handoff` writes
by default. Recalling it differs from a named recall in two ways:

- **It lives on both surfaces** — the mempalace drawer and the committed
  `docs/memory/handoff/next.md`. Read whichever resolves; if both do and they
  disagree, the **more recent `Date`** wins.
- **Its continuation runs without a gate** — step 4 executes the Next prompt
  instead of asking. That is the whole point of `next`: one command resumes the
  work. It is **left in place** afterwards; the following `/handoff` (or
  `/handoff next`) overwrites it.

---

## Pipeline

### 1. Resolve the project (wing)

Resolve `<project>` from the repo identity **exactly as `/handoff` does**
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

If `$ARGUMENTS` named no `<name>`, resolve to **`next`** and look for it as
below. Only if no `next` exists on either surface, list what's available:
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

**If mempalace is unavailable or has no match**, read
`docs/memory/handoff/<name>.md` from disk (the `/handoff` fallback). If
neither yields anything, say so and stop — don't guess the prior state.

For **`next`**, the disk copy is a first-class surface, not a fallback: read
`docs/memory/handoff/next.md` even when the drawer resolved, and take the copy
with the more recent `Date` if they differ.

### Format check

Before rebuilding context off the blueprint, run the preflight in
`%%AI_PLUGINS_ROOT%%/assets/format-check.md` (as the other consuming commands
do); if the repo's blueprint format is behind what vwf ships, nudge `/setup`
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
  `/git-workflow`, then continue there.
- **Neither** (branch absent, nothing merged) → say so and stop; the work can't
  be located.

### 4. Run or offer the next prompt

**For a named handoff**, if it has a **Next prompt** section, show it and **ask
the user whether to run it now**:

- **Yes** → proceed to execute that prompt (route through the matching `/vwf:`
  command — `blueprint` / `plan` / `execute` — when it names one). Resuming a
  cap-paused `/execute` run is the primary use of this command.
- **No** → stop after the summary; the user drives from here.

**For `next`, do not ask** — show the summary, then execute the Next prompt
straight away (routing through the matching `/vwf:` command the same way). The
handoff **stays in place**: leave the drawer and `docs/memory/handoff/next.md`
alone, so a re-run resumes the same point until the next `/handoff`
overwrites it.

If there is no next prompt, end with the summary and the open items, and wait
for direction. For `next` this means the previous session recorded no
continuable work — say that plainly ("nothing further to continue — give me a
direction") rather than picking an open item and running with it.
