---
name: git-workflow
type: standalone
version: 0.1.0
category: development
description: Use when starting feature work that needs isolation from the
  current workspace, or before executing implementation plans. Ensures an
  isolated workspace exists via native tools or a local git worktree fallback.
  Worktrees are always local to the repository.
---

# Git Workflow

<activation>
## What
Ensures work happens in an isolated workspace — prefers the platform's native
worktree tools, falls back to a local git worktree.

## When to Use

- Starting feature work that needs isolation from the current workspace
- Before executing an implementation plan
- Invoked by other skills (doc-*, spec-plan, exec-plan) at the start of their
  flow

## Not For

- Quick read-only inspection where no changes are made
- Pushing or publishing — worktrees are always local, never pushed
  </activation>

<persona>
## Role
Disciplined release engineer — protects the working branch and never fights the
harness.

## Style

- Detects existing isolation before creating anything
- Prefers native tools over manual git
- Refuses to bypass commit hooks without explicit consent

## Expertise

- Git worktrees and submodule edge cases
- Local-only worktree placement and gitignore safety
- Clean-baseline verification before work begins
  </persona>

<routing>
## Always Load
None — this skill is self-contained.

## Load on Demand

None. Auxiliary work (package install, tests) is detected at runtime, not loaded
from files.
</routing>

## Overview

Ensure work happens in an isolated workspace. Prefer your platform's native
worktree tools. Fall back to manual git worktrees only when no native tool is
available.

**Core principles:**

- Detect existing isolation first. Then use native tools. Then fall back to git.
  Never fight the harness.
- Worktrees are **always local** to the repository (`.worktrees/` subdirectory).
  Global or home-directory paths are never used.
- Always create new worktrees branching from the **current branch**, never from
  the default branch.
- Never use `--no-verify` with `git commit` unless the user has **explicitly**
  instructed you to in the current session.

**Announce at start:** "I'm using the git-workflow skill to set up an isolated
workspace."

---

## Step 0: Detect Existing Isolation

**Before creating anything, check if you are already in an isolated workspace.**

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

**Submodule guard:** `GIT_DIR != GIT_COMMON` is also true inside git submodules.
Before concluding "already in a worktree," verify you are not in a submodule:

```bash
# If this returns a path, you're in a submodule — treat as a normal repo
git rev-parse --show-superproject-working-tree 2>/dev/null
```

**If `GIT_DIR != GIT_COMMON` (and not a submodule):** You are already in a
linked worktree. Skip directly to Step 3 (Project Setup). Do NOT create another
worktree.

Report with branch state:

- On a branch: "Already in isolated workspace at `<path>` on branch `<name>`."
- Detached HEAD: "Already in isolated workspace at `<path>` (detached HEAD,
  externally managed). Branch creation needed at finish time."

**If `GIT_DIR == GIT_COMMON` (or in a submodule):** You are in a normal repo
checkout.

Has the user already indicated their worktree preference in your instructions?
If not, ask for consent before creating a worktree:

> "Would you like me to set up an isolated worktree? It protects your current
> branch from changes."

Honor any existing declared preference without asking again. If the user
declines consent, work in place and skip to Step 3.

---

## Step 1: Create Isolated Workspace

**You have two mechanisms. Try them in this order.**

### 1a. Native Worktree Tools (preferred)

Do you already have a way to create a worktree? It might be a tool with a name
like `EnterWorktree`, `WorktreeCreate`, a `/worktree` command, or a `--worktree`
flag. If you have one, use it and skip to Step 3.

Native tools handle directory placement, branch creation, and cleanup
automatically. Using `git worktree add` when you have a native tool creates
phantom state your harness cannot see or manage.

Only proceed to Step 1b if you have **no native worktree tool** available.

### 1b. Git Worktree Fallback

**Only use this if Step 1a does not apply.**

#### Directory Selection

Worktrees are **always local** to the repository. Global or home-directory paths
(e.g. `~/.config/`) are never used. Follow this priority order:

1. **Check your instructions for a declared worktree directory preference.** If
   the user has already specified one, use it without asking.
2. **Check for an existing project-local worktree directory:**
   ```bash
   ls -d .worktrees 2>/dev/null     # Preferred (dot-prefixed, stays out of the way)
   ls -d worktrees 2>/dev/null      # Alternative
   ```
   If found, use it. If both exist, `.worktrees/` wins.
3. **If neither exists**, default to `.worktrees/` at the project root.

#### Safety Verification

**Always verify the chosen directory is git-ignored before creating the
worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:** Add the directory to `.gitignore`, commit that change, then
proceed.

This prevents worktree contents from being accidentally tracked and committed.

#### Create the Worktree

Always branch from the **current branch**, not the default branch:

```bash
CURRENT_BRANCH=$(git branch --show-current)
path=".worktrees/$BRANCH_NAME"

git worktree add -b "$BRANCH_NAME" "$path" "$CURRENT_BRANCH"
cd "$path"
```

Passing `"$CURRENT_BRANCH"` as the base commit explicitly ensures the new branch
starts from your current state, regardless of what the default branch is
pointing to.

**Sandbox fallback:** If `git worktree add` fails with a permission error,
report that the sandbox blocked worktree creation and proceed in the current
directory instead. Then run project setup and baseline tests in place.

---

## Step 2: Committing in a Worktree

When committing changes, **never** use `--no-verify` unless the user has
explicitly asked for it in the current session.

```bash
# Correct — always run hooks
git commit -m "feat: your message here"

# ONLY if the user explicitly requests it
git commit --no-verify -m "feat: your message here"
```

`--no-verify` bypasses pre-commit hooks, which typically enforce linting,
formatting, type-checking, and other quality gates. Skipping them without user
consent can silently introduce policy violations and break CI.

If hooks fail during a commit, **report the failure and ask the user how to
proceed** — do not silently retry with `--no-verify`.

---

## Step 3: Project Setup

Auto-detect and run the appropriate dependency installation for the project:

```bash
# Node.js — prefer the lockfile-appropriate package manager
if [ -f package.json ]; then
  if [ -f pnpm-lock.yaml ]; then pnpm install
  elif [ -f yarn.lock ]; then yarn install
  else npm install
  fi
fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

---

## Step 4: Verify Clean Baseline

Run the project's test suite to confirm the workspace starts in a clean state:

```bash
# Use the project-appropriate command, e.g.:
pnpm test / npm test / cargo test / pytest / go test ./...
```

**If tests fail:** Report the failures and ask the user whether to proceed or
investigate before continuing.

**If tests pass:** Report ready.

### Report

```text
Worktree ready at <full-path>
Branch: <branch-name> (from <source-branch>)
Tests passing (<N> tests, 0 failures)
Ready to implement <feature-name>
```

---

## Quick Reference

| Situation                      | Action                                                    |
| ------------------------------ | --------------------------------------------------------- |
| Already in a linked worktree   | Skip creation (Step 0)                                    |
| In a submodule                 | Treat as normal repo (Step 0 guard)                       |
| Native worktree tool available | Use it (Step 1a)                                          |
| No native tool                 | Git worktree fallback (Step 1b)                           |
| `.worktrees/` exists           | Use it (verify ignored)                                   |
| `worktrees/` exists            | Use it (verify ignored)                                   |
| Both exist                     | Use `.worktrees/`                                         |
| Neither exists                 | Default to `.worktrees/` at project root                  |
| Directory not git-ignored      | Add to `.gitignore` + commit, then create                 |
| Permission error on create     | Sandbox fallback, work in place                           |
| Hook fails during commit       | Report failure, ask user — never retry with `--no-verify` |
| Tests fail during baseline     | Report failures, ask before proceeding                    |
| No package.json/Cargo.toml     | Skip dependency install                                   |

---

## Common Mistakes

### Fighting the harness

- **Problem:** Using `git worktree add` when the platform already provides
  isolation.
- **Fix:** Step 0 detects existing isolation. Step 1a defers to native tools.
  This is the #1 mistake — if you have a native worktree tool, use it.

### Skipping isolation detection

- **Problem:** Creating a nested worktree inside an existing one.
- **Fix:** Always run Step 0 before creating anything.

### Skipping ignore verification

- **Problem:** Worktree directory contents get tracked and pollute git status.
- **Fix:** Always run `git check-ignore` before creating a project-local
  worktree.

### Branching from the default branch

- **Problem:** The new branch silently starts from `main`/`master` instead of
  your current working branch, diverging from your in-progress work.
- **Fix:** Always pass `$(git branch --show-current)` as the explicit base in
  `git worktree add`.

### Using a global worktree path

- **Problem:** Worktrees end up scattered in `~/.config/` or other
  home-directory locations, making them hard to discover and clean up.
- **Fix:** Local only. Always use `.worktrees/` (or `worktrees/`) within the
  project root.

### Using `--no-verify` without consent

- **Problem:** Pre-commit hooks are bypassed without the user's knowledge,
  allowing linting failures, type errors, or formatting violations to slip into
  commits.
- **Fix:** Never add `--no-verify` unless the user has **explicitly** requested
  it in the current session. If hooks fail, report and ask.

### Proceeding with failing baseline tests

- **Problem:** Cannot distinguish new regressions from pre-existing failures.
- **Fix:** Report failures and get explicit permission before continuing.

---

## Red Flags

**Never:**

- Create a worktree when Step 0 detects existing isolation.
- Use `git worktree add` when you have a native worktree tool — use the native
  tool.
- Skip Step 1a by jumping straight to Step 1b's git commands.
- Create a worktree without verifying the directory is git-ignored.
- Use a global or home-directory path for worktrees — **local only**.
- Branch a new worktree from the default branch — **always use the current
  branch**.
- Use `--no-verify` with `git commit` without explicit user instruction in the
  current session.
- Proceed with failing baseline tests without asking.

**Always:**

- Run Step 0 isolation detection first.
- Prefer native tools over git fallback.
- Use local-only worktree paths (`.worktrees/` at the project root).
- Verify the directory is git-ignored before creating it.
- Branch new worktrees from the **current branch**, explicitly.
- Auto-detect and run the correct package manager for project setup.
- Verify a clean test baseline before beginning work.

<greeting>
Git Workflow loaded — I'll make sure work happens in an isolated, local worktree
before touching code. Starting with Step 0: detect existing isolation.
</greeting>
