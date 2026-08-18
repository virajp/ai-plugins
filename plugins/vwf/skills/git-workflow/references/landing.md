# Landing a Branch (Step 4's merge sequences)

Read this only when **Step 4** resolved to one of the two merge options — by the
user's choice or a caller-declared preference. A **Commit only** outcome never
needs it.

The merge-conflict hard halt in Step 4 applies to **both** sequences below: on a
conflict, abort cleanly, leave the worktree intact, and report — never resolve
autonomously.

## Merge, push & clean up

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

5. **Sweep stale worktrees.** After this one lands, list the other worktrees
   under the worktree dir (`git worktree list`) whose branches are **fully
   merged** into the destination (`git branch --merged`), and offer to remove
   them. Never remove a worktree with unmerged work.

For a repo with **no submodules**, skip steps 1–2: land the branch (its `merge:`
task if defined, else merge it in the main worktree), `git push`, then remove
the worktree.

## Merge, push & keep worktree

Run the same land sequence — any submodule work, then the outer repo +
`git
push` — but **do not remove** the worktree. Inform the user which branch
and path it is on.
