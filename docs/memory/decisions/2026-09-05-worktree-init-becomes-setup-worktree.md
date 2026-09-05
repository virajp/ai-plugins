# Decision — `worktree:init` becomes `setup:worktree`

**Date** 2026-09-05 · **Branch** `2026-09-05-vwf-init` · **Reverses** the task
name in the mise pack and in
`plugins/vwf/skills/git-workflow/references/worktree-setup.md` · **Umbrella**
[`2026-09-05-vwf-init-and-the-repo-shape.md`](./2026-09-05-vwf-init-and-the-repo-shape.md)

## What was decided before

A fresh worktree was bootstrapped by `mise run worktree:init`, in a `worktree:`
group that held that one task.

## What changed

It is `setup:worktree`, in the `setup:` group with every other bootstrap step.
Its body is unchanged in kind — submodules initialised, `mise install`,
`setup:secrets`, then `setup:deps:install --frozen` — the lighter sibling of
`setup:all`, which is what a repo runs once.

vwf's `worktree-setup.md` reference and `/vwf:readme`'s Local Development
guidance both name the new spelling; `/vwf:readme` now mentions it explicitly,
because a contributor who does not know the light path exists runs the slow one
forever.

## Why

`worktree:` was a group of one, and the task it held is a bootstrap — the same
thing `setup:` means. Under the three-group vocabulary (`setup:` bootstraps,
`code:` is what a change runs through, `p:<project>:` is what a project does)
there was no argument for a fourth group; there was only the accident of where
the task was first written.

The name also reads better in the direction people use it: someone asking "how
do I set this worktree up" finds it by typing `setup:`.

## What it costs, stated plainly

The same cost as every rename in this plan: repos already shipping
`worktree:init` keep it until `/vwf:init` reshapes them, and vwf now probes only
`setup:worktree`. The mise pack's *Legacy names* table carries the mapping so
the rename is applied rather than guessed.
