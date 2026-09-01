# Gaps — `uv` and `ruff` are authored but nothing can materialize them

**Date** 2026-09-01 · **Branch** `develop` · **Tag** `stackgen/parked`

Mirrors the mempalace drawer (wing `ai-plugins`, room `gaps`); both stores
written together, per `plugins/vwf/assets/memory.md`.

Filed by section F of
[the devtools dissolution plan](../../plans/archived/2026-09-01-devtools-dissolution.md),
which called for exactly this record so the state is not rediscovered later as a
bug. It was written into the two packs' own files at landing time and is lifted
here, where the gap register actually lives.

## What was raised

`devtools`' python task overlay — six files calling `ruff` and `uv` — had no
destination in stackgen, which shipped neither a `language/python` nor a
`package-manager/uv`. The dissolution's no-skill-lost rule needs a destination
to exist *before* a deletion, so two thin packs were authored to carry the
payload, split on the line `eslint` already established:

| Pack                  | Carries                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| `package-manager/uv`  | the 4 `setup/deps/*` tasks (`install` is `uv sync --all-extras`)                  |
| `toolchain-gate/ruff` | `code/lint` and `code/format`, as topic 10 of a python bundle — `language-bundle` |

**Neither is reachable.** There is no `language/python` component and no python
bundle for either to compose into, so no materialization run can land them
today. The packs are correct and inert.

This is the same status the four repo gates carried from Wave A until the
dissolution's section D minted the `repo-gates` bundle for them — authored,
composed by nothing, invisible to every gate the repo has. The difference is
that the gates had a fix that fit inside one plan and these do not.

## Why it was not closed

Authoring a full python `language-bundle` means the 12-topic bar with per-topic
Context7 research and a `stackgen-skill-reviewer` pass on each artifact. That is
a wave of its own, not a section of a dissolution plan whose binding constraint
was that nothing devtools shipped may be lost.

## What closing it looks like

1. Author `language/python` against the `language-bundle` topic bar.
2. Author a python bundle composing it with `package-manager/uv` and, at topic
   10, `toolchain-gate/ruff`.
3. The six task files then land through the `config/` tier with no change — they
   are already byte-identical to what devtools shipped and already 755.

Until then the two packs are dead weight that costs nothing: `plugins:check`
validates them, and no bundle names them.

## Related

- `plugins/stackgen/stacks/package-manager/uv/conventions.md` and `pack.yaml` —
  where the same fact is stated for whoever opens the pack
- `plugins/stackgen/stacks/toolchain-gate/ruff/` — same
- Section J of the dissolution plan, which lists this among the four things
  deliberately left out of scope
