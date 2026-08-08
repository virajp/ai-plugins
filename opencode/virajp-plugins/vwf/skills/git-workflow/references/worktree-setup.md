# Creating an Isolated Workspace (Step 2)

Read this only when **Step 1** concluded a worktree must be created — you are in
the main checkout and isolation was consented to (or pre-declared by the
caller). Already inside a linked worktree, or working in place after a decline,
skip straight to Step 3.

Try the mechanisms in this order — stop at the first that applies.

## 2a. Native Worktree Tools (preferred)

Do you have a tool named `EnterWorktree`, `WorktreeCreate`, a `/worktree`
command, or a `--worktree` flag? If so, use it and **proceed to Step 2c**
(submodules).

Native tools handle directory placement, branch creation, and cleanup
automatically — prefer them over raw git commands.

## 2b. Git Worktree Fallback

Only use this if no native worktree tool is available.

### Directory selection

Follow this priority:

1. Check instructions for a declared worktree directory preference.
2. Check for an existing project-local worktree directory:
   ```bash
   ls -d .worktrees 2>/dev/null   # preferred
   ls -d worktrees 2>/dev/null    # alternative
   ```
   Use it if found (`.worktrees/` wins if both exist).
3. Default to `.worktrees/` at the project root.

### Safety verification

Verify the directory is git-ignored before creating the worktree:

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

If NOT ignored: add it to `.gitignore`, commit that change, then proceed.

### Create the worktree

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

## 2c. Initialize Submodules (always, after any mechanism)

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

## 2d. Initialize the Worktree (mise task)

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
