---
name: git-workflow
description: Manage git workflows — worktree isolation, commits, merges, and
  pushes. Use
  for all substantive changes; never work directly in the main worktree.
---

# Git Workflow

## Core Rules

- Use a worktree for all substantive changes — never work directly in the main
  worktree
- Worktrees are always created for the **outermost superproject**, never a
  submodule (Step 1 resolves this)
- **Initialize** every new worktree with its mise init task (Step 2d), and
  **end** every worktree with full coverage — land the branch (plus any
  submodule work and pointer updates), then remove it (Step 4)
- Use `merge` (not PRs) to land changes: `mise x -- mise run merge:develop` or
  `mise x -- mise run merge:main`
- Never push without explicit user request — always ask after a successful
  commit
- Check `no-commit-to-branch` hook in `.config/pre-commit-config.yaml` before
  committing to any branch

## Caller Preferences

This command takes **no arguments** — callers parameterize its behavior through
**declared preferences in the invocation text** (e.g. `/execute`: "isolate
without asking; commit only — never merge/push"). Honor any such declared
preference: it drives the **Step 1** consent (skip the worktree prompt when
isolation is pre-declared) and the **Step 4** post-commit choice (take the
declared action, skip the prompt). Absent a declared preference, ask as each
step specifies.

## Safety Rules

**Never:**

- `--force`, `--no-verify`, `reset --hard`, force-push to `main`/`develop`
- Update git config
- Any destructive operation without explicit user request

If hooks fail during a commit: fix the issue, then create a **new commit** —
never `--amend` after a hook failure, never retry with `--no-verify`.

## References

The two branches most runs never take. Read one only when the step below routes
you into it — a run that lands in an existing worktree and stops at a commit
needs neither.

| Reference                                     | When to read                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [Worktree setup](references/worktree-setup.md) | **Step 2** — only when Step 1 concluded a worktree must be created (native tool, git fallback, submodules, mise init) |
| [Landing a branch](references/landing.md)      | **Step 4** — only when the chosen post-commit action is one of the two merge options (submodule order, push, teardown, stale sweep) |

---

## Step 1 — Detect Existing Isolation

**Before creating anything, check if you are already in an isolated workspace.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules.
Before concluding anything, resolve whether you are inside a submodule:

```bash
SUPERPROJECT=$(git rev-parse --show-superproject-working-tree 2>/dev/null)
```

**If `SUPERPROJECT` is non-empty, you are inside a submodule.** The worktree
must be created for the **parent repo**, never for the submodule. Move to the
superproject root and re-run the detection from there — every step below
(consent, worktree creation, submodule init) then operates on the parent repo:

```bash
cd "$SUPERPROJECT"
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
```

If the parent repo is itself nested in a further superproject, repeat until
`git rev-parse --show-superproject-working-tree` is empty — the worktree is
always created at the outermost parent.

**If `GIT_DIR != GIT_COMMON` (and not a submodule):** You are already in a
linked worktree — skip directly to Step 3. Do NOT create another worktree.

**If `GIT_DIR == GIT_COMMON`:** You are in the main checkout. Ask for consent:

> "Would you like me to set up an isolated worktree? It protects your current
> branch from changes."

Honor any existing declared preference without asking again. If declined, work
in place and skip to Step 3.

---

## Step 2 — Create Isolated Workspace

Read [Worktree setup](references/worktree-setup.md) and follow it: the four
mechanisms in order (native tool, git fallback, submodule init, mise init),
stopping at the first that applies. Every new worktree ends at **2c** and **2d**
— submodules populated and the init task run — whichever mechanism created it.

---

## Step 3 — Commit Workflow

Work from the **repository root**.

1. `code:precommit` — auto-fix lint/format, re-stage. Guard it with the same
   `have_task` check Step 2d uses; **skip silently** when the task is absent:
   ```bash
   have_task code:precommit && mise x -- mise run code:precommit
   ```
2. `git status` → `git add <files>` (never `git add -A`)
3. `git diff --cached` — review staged changes
4. Read `.config/git-conventional-commits.yaml` for authoritative types and
   scopes — do not invent scopes
5. `git commit -m "<type>(<scope>): <description>"`
6. If hooks fail: fix, then **new commit** (never `--amend`, never
   `--no-verify`)

### Commit Format

```text
<type>(<scope>): <description>
```

- Lowercase, imperative mood, under 72 characters, no trailing period
- Scope is optional — omit when the change spans multiple areas

Common types: `feat`, `fix`, `refactor`, `wip`, `blueprint`, `test`, `ops`,
`docs`, `merge`

---

## Step 4 — Post-Commit Action

**Caller-declared preference.** If the invoker declared a post-commit action
(e.g. `/execute`: "commit only — do not prompt, never merge or push"), honor
it without asking: take that action and skip the prompt below. This is the only
way the prompt is bypassed.

Otherwise, after a successful commit, ask the user to choose what to do next via
`AskUserQuestion` with these three options:

- **Commit only** — stop here; leave the worktree as-is for continued work.
- **Merge, push & clean up** — merge to the default branch in the main worktree,
  push changes, then archive/delete the additional worktree.
- **Merge, push & keep worktree** — merge to the default branch in the main
  worktree, push changes, but leave the additional worktree open for continued
  work.

**On a merge conflict (either land sequence).** If a merge — the outer repo's or
a submodule merge task — **conflicts**, do **not** resolve it autonomously.
Abort the merge cleanly (`git merge --abort`, or the task's equivalent), leave
the worktree **intact**, and report the conflicting files to the caller. Callers
treat this as a **hard halt**.

Execute the chosen action:

### Commit only

Nothing further. Inform the user the commit is done and the worktree remains
available.

### Merge, push & clean up / Merge, push & keep worktree

Read [Landing a branch](references/landing.md) and follow the sequence for the
chosen option — submodules first, then the outer repo's pointers and merge, then
push; **clean up** additionally removes this worktree and sweeps stale ones,
**keep worktree** leaves it in place.

---

## Useful Commands

| Situation                             | Command                             |
| ------------------------------------- | ----------------------------------- |
| Save unfinished work temporarily      | `git stash` / `git stash pop`       |
| Clean up WIP commits before merge     | `git rebase -i <base>`              |
| Find which commit introduced a bug    | `git bisect start` / `good` / `bad` |
| Inspect a file's change history       | `git log -p -- <file>`              |
| Undo last commit, keep changes staged | `git reset --soft HEAD~1`           |
| View branch divergence                | `git log --oneline --graph --all`   |
