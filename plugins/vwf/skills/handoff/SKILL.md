---
name: handoff
description: Capture the current session as a handoff document and file it to
  mempalace
  (wing=<project>, room=handoff, drawer=<name>) so work can resume in a fresh
  session. Use when the context window grows beyond ~60%.
argument-hint: "<name>"
model: sonnet
effort: xhigh
disable-model-invocation: true
---

# handoff — Capture Work for a Fresh Session

Write a **handoff document** that lets a new session continue this work without
the current context, and file it to **mempalace** so `/vwf:recall` can retrieve
it later.

**When to use:** when the context window grows **beyond ~60%**, or before
intentionally ending a session mid-task. A handoff written early — while the
session still reasons clearly — is worth far more than one squeezed out at 95%.

## Inputs

| Input       | Source                                                         |
| ----------- | -------------------------------------------------------------- |
| `<name>`    | `$ARGUMENTS` — the drawer name for this handoff. **Required.** |
| `<project>` | the **wing**, resolved from the repo (see step 3)              |
| Template    | `${CLAUDE_PLUGIN_ROOT}/assets/templates/handoff.md`            |

If `$ARGUMENTS` is empty, ask the user for a short `<name>` (kebab-case, e.g.
`auth-refactor`) and wait. Do not invent one.

---

## Pipeline

### 1. Confirm scope

Restate, in one line, what work this handoff covers, so the captured state
matches the user's intent. If the session spans several unrelated threads, ask
which one to hand off (one handoff = one coherent thread).

### 2. Tidy & checkpoint the working state

Leave the repo clean and resumable before capturing, so the handoff describes
**committed** state, not a dirty tree. This runs on the **outer (superproject)**
repo and its submodules — never a submodule in isolation (the same outer-repo
rule as `/vwf:git-workflow`). **Do not push** — commit only, honoring the
never-push rule.

1. **Commit pending work, everywhere.** In the current worktree and in each
   submodule with uncommitted or untracked changes, stage and commit it as a
   checkpoint — `wip: handoff checkpoint — <name>` — without prompting. Respect
   pre-commit hooks (on failure, fix and make a **new** commit; never
   `--no-verify`).

   **Dirty-state escape.** If the tree still cannot be committed cleanly (an
   unfixable hook keeps failing), do **not** loop — write the handoff
   **anyway**, recording the **dirty state** and the blocking hook output in the
   doc so the next session knows what is uncommitted and why.
2. **Update submodule pointers (outer repo).** If a submodule's recorded commit
   moved, stage the gitlinks and commit them in the outer repo
   (`ops: update submodule pointers`).
3. **Clean up worktrees — safely.** Remove only linked worktrees that are
   **fully merged and clean**. **Never remove a worktree with unmerged work** —
   keep it and list it under the handoff's Open items. Report what was removed
   and kept.

### 3. Resolve the project (wing)

Determine the project name from the **repo identity**, deterministically:

1. Prefer the `origin` remote repo name — `git remote get-url origin`, stripped
   of host/owner and `.git` (e.g. `git@github.com:acme/orders.git` → `orders`).
2. Else the repo root basename — `git rev-parse --show-toplevel`.

Then **reconcile with mempalace** so you reuse the project's existing wing
rather than creating a near-duplicate: call `mempalace_status` (or
`mempalace_list_wings`) and, if a wing clearly corresponds to this project, use
its **exact** existing name. Otherwise the derived name is the wing (the first
handoff creates it). This is the same wing concept as
`${CLAUDE_PLUGIN_ROOT}/assets/memory.md`.

### 4. Write the handoff document

Fill the template at `${CLAUDE_PLUGIN_ROOT}/assets/templates/handoff.md` from
the **current session**. Capture state, not narration — a reader with zero
context must be able to resume. Be concrete: real file paths, real commands, the
actual decisions and their *why*. Set the first line to `# Handoff: <name>`
exactly (it is the retrieval key).

Fill the **Workspace** section from git: the worktree path
(`git rev-parse --show-toplevel`, or the main checkout if not isolated) and the
branch (`git branch --show-current`). `/vwf:recall` reads these to re-enter the
work — a stale or missing path is how it detects the worktree is gone.

If decisions/findings already live in mempalace or `docs/`, **reference** them
rather than copying — keep the handoff tight.

### 5. Add the next prompt (if there is one)

If a clear single next action exists, fill the **Next prompt** section with a
**self-contained** instruction the user can paste into a fresh session — it must
not rely on this session's context. If there is no obvious next step, delete
that section entirely (don't pad it).

### 6. File it to mempalace

Store the completed document verbatim:

```text
mempalace_add_drawer(
  wing        = <project>,
  room        = "handoff",
  content     = <the filled handoff document>,
  source_file = "handoff/<name>.md",
  added_by    = "vwf:handoff",
)
```

`room` is always the literal `handoff`; `source_file` and the
`# Handoff: <name>` header are how `/vwf:recall` finds this drawer by `<name>`.
If a handoff for this `<name>` already exists and the tool reports a duplicate,
file the new one anyway (it supersedes) — recall picks the most recent.

**If mempalace tools are unavailable** (the server is down — do **not** silently
skip, the document is the whole point): write the handoff to
`docs/handoffs/<name>.md` instead, tell the user it went to disk because
mempalace was unreachable, and that `/vwf:recall` will read the disk copy.

### 7. Report

Confirm where it was filed (wing / room / `<name>`, or the disk path), and state
in one line that a fresh session can resume with `/vwf:recall <name>`. Mention
whether a next prompt was included.
