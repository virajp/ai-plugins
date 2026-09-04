# Ruff — conventions

Both halves of the Python gate — the linter and the formatter — are one tool.
Topic 10 of the language bundle, deliberately not a repo gate: a linter
meaningful for exactly one toolchain belongs to that toolchain's bundle, or a
polyglot repo acquires one gate per language.

**Ruff runs through `uv run`**, never off `PATH`. The gate must be the version
the lockfile pinned, or CI and a developer's machine can disagree about what
passes. See the `uv` package-manager pack.

**`--fix` is a flag, not the default.** `code:lint` and `code:format` check by
default and mutate only when asked, so the same task is a gate in CI and a
tool locally.

## The seam with the repo formatter

**This pack owns `code/format` and `code/lint` wholesale.** It ships the whole
file, not a fragment — the composition seam is ownership plus a stated
contract, not assembly from contributed pieces, because assembling would mean
a templating layer stackgen deliberately does not have.

What the contract requires: **the repo formatter runs first inside
`code:format`**, before `uv run ruff format`. dprint owns every file type it
has a plugin for across the whole repo; ruff owns Python. The shipped
`code/format` does exactly that, in that order — the same repo-gate-plus-
language shape the node and flutter overlays have.

**Composition order, when more than one component writes this tree:**
`toolchain-manager`, then `package-manager` / `language`, then `app-framework`
— a later component's file wins, and the lockfile records per file which
component supplied what landed.

## Not yet reachable

**This pack is authored but not yet reachable, and that is expected.** It
declares `kind: language-bundle`, but there is no `language/python` component
and no python bundle for it to compose into, so no materialization can land it
today. Authoring the python language bundle against the 12-topic bar, with
per-topic research, is its own wave — this is not a bug to fix in passing. The
four repo-gate packs have had the same status since Wave A.
