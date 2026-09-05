# Decision — `merge:develop` / `merge:main` become `code:merge:*`

**Date** 2026-09-05 · **Branch** `2026-09-05-vwf-init` · **Reverses** the task
names hardcoded in `plugins/vwf/skills/git-workflow/SKILL.md` and
`references/landing.md` · **Umbrella**
[`2026-09-05-vwf-init-and-the-repo-shape.md`](./2026-09-05-vwf-init-and-the-repo-shape.md)

## What was decided before

The landing tasks lived in a top-level `merge:` group, and vwf's git-workflow
skill named them by that spelling in four places.

## What changed

They are `code:merge:develop` and `code:merge:main`. vwf's git-workflow skill
moved with them, and the mise pack's *Legacy names* table records the rename so
`/vwf:init` can apply it to an existing repo.

Two behavioural changes ride along, and they are the reason the rename was worth
making:

- **`code:precommit` runs before staging**, over the working tree's changed
  files, so a fixup folds into the same commit instead of needing one of its
  own. The commit sequence in git-workflow is now `code:precommit` → stage →
  commit.
- **The merge tasks push with `--follow-tags`**, so the explicit `git push` in
  `landing.md` now belongs only to the manual fallback.

## Why

`merge:` was a top-level group of two, sitting beside `setup:` and `code:` as if
it were a peer namespace. It is not: a merge is one more thing a change runs
through, like the format, lint and security gates already under `code:`. The
grouping is what a contributor reads in `mise tasks`, and three groups that mean
*bootstrap*, *what a change goes through*, and *what this project does* is a
vocabulary someone can hold; a fourth group of two is noise.

## What it costs, stated plainly

Muscle memory, and every repo of the maintainer's that already ships the old
name. Nothing auto-migrates: a repo keeps working with `merge:develop` until
someone runs `/vwf:init` on it, but vwf's git-workflow skill now names only the
new spelling, so a repo that has not been reshaped will be told to run a task it
does not have. The *Legacy names* table is the mitigation, and running `init` is
the fix.
