---
description: Manage git workflows — worktree isolation, commits, merges, and
  pushes. Use for all substantive changes; never work directly in the main
  worktree.
argument-hint: "(no args)"
allowed-tools: Bash(git:*) Bash(mise:*) Read
model: sonnet
effort: medium
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

## Safety Rules

**Never:**

- `--force`, `--no-verify`, `reset --hard`, force-push to `main`/`develop`
- Update git config
- Any destructive operation without explicit user request

If hooks fail during a commit: fix the issue, then create a **new commit** —
never `--amend` after a hook failure, never retry with `--no-verify`.

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

Try the mechanisms in this order — stop at the first that applies.

### 2a. Native Worktree Tools (preferred)

Do you have a tool named `EnterWorktree`, `WorktreeCreate`, a `/worktree`
command, or a `--worktree` flag? If so, use it and **proceed to Step 2c**
(submodules).

Native tools handle directory placement, branch creation, and cleanup
automatically — prefer them over raw git commands.

### 2b. Git Worktree Fallback

Only use this if no native worktree tool is available.

#### Directory selection

Follow this priority:

1. Check instructions for a declared worktree directory preference.
2. Check for an existing project-local worktree directory:
   ```bash
   ls -d .worktrees 2>/dev/null   # preferred
   ls -d worktrees 2>/dev/null    # alternative
   ```
   Use it if found (`.worktrees/` wins if both exist).
3. Default to `.worktrees/` at the project root.

#### Safety verification

Verify the directory is git-ignored before creating the worktree:

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

If NOT ignored: add it to `.gitignore`, commit that change, then proceed.

#### Create the worktree

Always branch from the **current branch**, not the default branch:

```bash
CURRENT_BRANCH=$(git branch --show-current)
path=".worktrees/$BRANCH_NAME"

git worktree add -b "$BRANCH_NAME" "$path" "$CURRENT_BRANCH"
cd "$path"
```

**Sandbox fallback:** If `git worktree add` fails with a permission error,
report it and proceed in the current directory instead.

Then **proceed to Step 2c** (submodules).

### 2c. Initialize Submodules (always, after any mechanism)

A newly created worktree does **not** inherit the submodules from the main
checkout — a fresh worktree leaves the submodule directories empty. If the repo
uses submodules, populate them in the new worktree before doing any work — they
are required to build and run the project.

Resolve the new worktree's path from git, then init its submodules — skip
silently if the repo has none:

```bash
# Path of the worktree just created for this branch
WORKTREE_PATH=$(git worktree list --porcelain \
  | awk -v b="refs/heads/$BRANCH_NAME" '/^worktree /{p=substr($0,10)} /^branch /{if ($2==b) print p}')

# Only if the repo declares submodules
if [ -f "$WORKTREE_PATH/.gitmodules" ]; then
  git -C "$WORKTREE_PATH" submodule update --init --recursive
fi
```

Use `git -C "$WORKTREE_PATH"` rather than `cd` so it works regardless of where
the native tool placed the worktree. For the **git fallback** where you already
`cd`'d into the worktree, `git submodule update --init --recursive` from there
is equivalent.

If a submodule fails to fetch (e.g. no network or auth), report it and ask the
user how to proceed — do not leave a partially-initialized worktree silently.

### 2d. Initialize the Worktree (mise task)

A fresh worktree has no installed dependencies. After submodules are populated,
bootstrap it so it can build and run — prefer a dedicated `worktree:init` task,
falling back to the bootstrap entrypoint `setup:all`:

```bash
have_task() { mise tasks 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "$1"; }

if have_task worktree:init; then
  mise run worktree:init
elif have_task setup:all; then
  mise run setup:all
fi
```

Run it from the worktree root. **Skip silently** if neither task exists. If the
task fails, report it and ask the user how to proceed rather than working in a
half-initialized worktree.

---

## Step 3 — Commit Workflow

Work from the **repository root**.

1. `mise x -- mise run code:precommit` — auto-fix lint/format, re-stage
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

Common types: `feat`, `fix`, `refactor`, `wip`, `spec`, `test`, `ops`, `docs`,
`merge`

---

## Step 4 — Post-Commit Action

After a successful commit, ask the user to choose what to do next via
`AskUserQuestion` with these three options:

- **Commit only** — stop here; leave the worktree as-is for continued work.
- **Merge, push & clean up** — merge to the default branch in the main worktree,
  push changes, then archive/delete the additional worktree.
- **Merge, push & keep worktree** — merge to the default branch in the main
  worktree, push changes, but leave the additional worktree open for continued
  work.

Execute the chosen action:

### Commit only

Nothing further. Inform the user the commit is done and the worktree remains
available.

### Merge, push & clean up

End the worktree with **full coverage** — nothing left uncommitted, submodule
pointers current — then remove it. Order matters:

1. **Land each changed submodule.** For every submodule with work on this
   branch, run its own merge task from the submodule directory (this commits and
   pushes the submodule's branch). Repeat per changed submodule:

   ```bash
   mise x --cd <submodule> -- mise run merge:develop   # or merge:main
   ```

2. **Update the outer repo's submodule pointers.** Back in the outer worktree,
   stage the moved gitlinks and commit them so the superproject records the new
   submodule commits:

   ```bash
   git add <submodule-paths>            # the gitlinks that moved
   git commit -m "ops: update submodule pointers"
   ```

3. **Land the outer repo.** Merge this branch to the destination — its own
   `merge:` task if the outer repo defines one, else merge the branch in the
   main worktree — then `git push`.

4. **Remove the worktree.**
   - **Native tool:** use its teardown (e.g. `ExitWorktree` or equivalent).
   - **Git fallback:** `git worktree remove <path>`.

For a repo with **no submodules**, skip steps 1–2: land the branch (its `merge:`
task if defined, else merge it in the main worktree), `git push`, then remove
the worktree.

### Merge, push & keep worktree

Run the same land sequence — any submodule work, then the outer repo +
`git
push` — but **do not remove** the worktree. Inform the user which branch
and path it is on.

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
