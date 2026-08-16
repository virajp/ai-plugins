---
name: vwf-handoff
description: Capture the current session as a handoff document and file it to
  mempalace
  (wing=<project>, room=handoff, drawer=<name>) so work can resume in a fresh
  session. With no argument — or `next` — it writes the reserved `next`
  handoff, to mempalace and to the main checkout's
  docs/memory/handoff/next.md, which /vwf-recall resumes
  automatically. Use when the context window grows beyond ~60%.
---

# handoff — Capture Work for a Fresh Session

Write a **handoff document** that lets a new session continue this work without
the current context, and file it to **mempalace** so `/vwf-recall` can retrieve
it later.

**When to use:** when the context window grows **beyond ~60%**, or before
intentionally ending a session mid-task. A handoff written early — while the
session still reasons clearly — is worth far more than one squeezed out at 95%.

## Inputs

| Input       | Source                                                       |
| ----------- | ------------------------------------------------------------ |
| `<name>`    | `$ARGUMENTS` — the drawer name. Empty → the reserved `next`. |
| `<project>` | the **wing**, resolved from the repo (see step 3)            |
| Template    | `%%AI_PLUGINS_ROOT%%/assets/templates/handoff.md`          |

`$ARGUMENTS` is a short kebab-case name (e.g. `auth-refactor`). **If it is
empty, the name is `next`** — never ask for one, never invent one.

## The `next` handoff

`next` is a **reserved name**: the single "resume where I left off" handoff for
this repo, and the default when no name is given. It differs from a named
handoff in exactly three ways:

- **Written to both surfaces, always.** mempalace *and*
  `docs/memory/handoff/next.md` at the **main checkout** — not
  disk-only-on-failure like a named handoff's fallback. Either surface alone is
  enough to resume.
- **A singleton, overwritten in place.** Each run replaces the file and
  supersedes the drawer. There is never more than one live `next`.
- **It must carry a continuation.** `next` exists to be resumed, so its **Next
  prompt** section is required. If the session has no clear next action, say so
  plainly rather than padding it — see step 5.

Named handoffs (`vwf-handoff auth-refactor`) keep their existing behavior
throughout: mempalace, with the disk copy only as a fallback.

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
rule as `vwf-git-workflow`). **Do not push** — commit only, honoring the
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
`%%AI_PLUGINS_ROOT%%/assets/memory.md`.

### 4. Write the handoff document

Fill the template at `%%AI_PLUGINS_ROOT%%/assets/templates/handoff.md` from
the **current session**. Capture state, not narration — a reader with zero
context must be able to resume. Be concrete: real file paths, real commands, the
actual decisions and their *why*. Set the first line to `# Handoff: <name>`
exactly (it is the retrieval key).

Fill the **Workspace** section from git: the worktree path
(`git rev-parse --show-toplevel`, or the main checkout if not isolated) and the
branch (`git branch --show-current`). `/vwf-recall` reads these to re-enter the
work — a stale or missing path is how it detects the worktree is gone.

If decisions/findings already live in mempalace or `docs/`, **reference** them
rather than copying — keep the handoff tight.

### 5. Add the next prompt (if there is one)

If a clear single next action exists, fill the **Next prompt** section with a
**self-contained** instruction the user can paste into a fresh session — it must
not rely on this session's context. If there is no obvious next step, delete
that section entirely (don't pad it).

**For `next`, this section is the point of the handoff.** If the session has no
continuable work — the thread finished, or the next move is the user's to choose
— do **not** invent one. Write the handoff without the section and **tell the
user there is nothing further to continue until they give a direction**;
`/vwf-recall next` will report the same and wait. A `next` that auto-runs a
made-up prompt is worse than one that admits it is done.

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
`# Handoff: <name>` header are how `/vwf-recall` finds this drawer by `<name>`.
If a handoff for this `<name>` already exists and the tool reports a duplicate,
file the new one anyway (it supersedes) — recall picks the most recent.

**If mempalace tools are unavailable** (the server is down — do **not** silently
skip, the document is the whole point): write the handoff to
`docs/memory/handoff/<name>.md` instead — under the **main checkout** root,
resolved as in step 6a — tell the user it went to disk because mempalace was
unreachable, and that `/vwf-recall` will read the disk copy.

### 6a. Write the disk copy (`next` only)

For the reserved `next`, the disk copy is not a fallback — write it **in
addition** to the drawer, and always to the **main checkout**, never a linked
worktree:

1. Resolve the main checkout root — the parent directory of
   `git rev-parse --git-common-dir` — from wherever the session stands. The
   file is gitignored (a handoff is personal, per
   `%%AI_PLUGINS_ROOT%%/assets/memory.md`), so a copy written inside a worktree
   would die with it and be invisible to a recall run anywhere else; the main
   checkout is the one root every session resolves.
2. Write the same document verbatim to `docs/memory/handoff/next.md` under that
   root, overwriting any previous one in place (never a second file, never a
   dated variant). **Do not commit it** — the `.gitignore` entry
   `/vwf-setup` maintains keeps it out of every diff.

If mempalace was unreachable, step 6's fallback and this step converge on the
same file — write it once and report the drawer as skipped.

### 7. Report

Confirm where it was filed (wing / room / `<name>`, plus
`docs/memory/handoff/next.md` for `next`, or the disk path when mempalace was
down), and state in one line that a fresh session can resume with
`/vwf-recall <name>` — `/vwf-recall next` for the reserved one, noting it will
run the next prompt without asking. Say whether a next prompt was included; for
`next` without one, say plainly that there is nothing further to continue until
the user gives a direction.
