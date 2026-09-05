# Decision — `/vwf:readme` creates `readme.md`, not `README.md`

**Date** 2026-09-05 · **Branch** `2026-09-05-vwf-init` · **Reverses**
`plugins/vwf/skills/readme/SKILL.md`'s create-path default · **Umbrella**
[`2026-09-05-vwf-init-and-the-repo-shape.md`](./2026-09-05-vwf-init-and-the-repo-shape.md)

## What was decided before

*"Update an existing readme in place — preserve its filename and casing
(`README.md` / `readme.md`); otherwise create `README.md`."* The uppercase name
was the default for a repo that had none.

## What changed

The create path now writes **`readme.md`**. The preserve rule is untouched: an
existing readme keeps whatever casing it has, in either direction, and
`/vwf:readme` never renames one.

Renaming an existing `README.md` to `readme.md` is `/vwf:init`'s, on an existing
repo, as one `git mv` line of a surveyed plan the user approves in full — with
the content untouched.

## Why

Every other file the toolkit lays at a repo root is lowercase — `.gitignore`,
`.editorconfig`, `.gitattributes`, `fnox.toml`. The shouting readme was the one
exception, and it was an exception nobody had chosen; it was inherited. The root
allowlist that arrived with the reopened config fence lists `readme.md`, so the
two now agree.

Keeping the rename out of `/vwf:readme` is the other half of the decision: a
command whose job is to write *content* silently changing a *filename* is a move
no one asked for, and git's case-insensitive-filesystem behaviour makes it a
move that can go wrong quietly. It belongs in the one command that shows every
move in a plan first.

## What it costs, stated plainly

`README.md` is what GitHub's own tooling, most templates and most contributors
expect, and lowercase will read as unusual to anyone arriving from elsewhere.
GitHub renders either, so nothing breaks; the cost is unfamiliarity, accepted
for consistency with the rest of the shaped root.
