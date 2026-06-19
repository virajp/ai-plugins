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
Verify you are not in a submodule before concluding "already in a worktree":

```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

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

```bash
mise x -- mise run merge:develop   # or merge:main — ask if ambiguous
git push
```

Then clean up the worktree:

- **Native tool:** use its own teardown (e.g. `ExitWorktree` or equivalent) if
  available.
- **Git fallback:** `git worktree remove <path>`

### Merge, push & keep worktree

```bash
mise x -- mise run merge:develop   # or merge:main — ask if ambiguous
git push
```

Leave the worktree open. Inform the user which branch and path it is on.

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
