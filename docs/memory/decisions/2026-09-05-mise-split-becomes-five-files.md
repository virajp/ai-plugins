# Decision — the toolchain manager's three-file split becomes five

**Date** 2026-09-05 · **Branch** `2026-09-05-vwf-init` · **Reverses** the
three-file split in the mise pack's `conventions.md` and
`skills/mise/references/config-files.md` · **Umbrella**
[`2026-09-05-vwf-init-and-the-repo-shape.md`](./2026-09-05-vwf-init-and-the-repo-shape.md)

## What was decided before

Three files: `.config/mise.toml`, `.config/mise.dev.toml`,
`.config/mise.ci.toml` — the base plus two `MISE_ENV` variants — and that was
the whole doctrine.

## What changed

Five, and the pack ships four of them:

| File              | Loaded when         | Holds                                        |
| ----------------- | ------------------- | -------------------------------------------- |
| `mise.toml`       | always              | shared settings, the runtime, `[tasks.init]` |
| `mise.dev.toml`   | `MISE_ENV=dev`      | dev tooling, shell aliases, local env values |
| `mise.ci.toml`    | `MISE_ENV=ci`       | the pipeline's and production's overrides    |
| `mise.test.toml`  | `MISE_ENV=dev,test` | test deltas, layered on top of dev           |
| `mise.local.toml` | always, last        | never committed — this machine's overrides   |

`mise.test.toml` ships with a banner saying it is deltas only and an empty
`[env]`. `mise.local.toml` is **never** shipped — it is gitignored by the
hygiene pack and documented in `mise.toml`'s banner, which is the only way a
machine-local override is discoverable without being committed.

A sixth path arrived with it and is not part of the count:
`.config/mise/conf.d/<provider>.toml`, the directory mise auto-loads, so a
secrets provider contributes its own `[env]` without any component editing
`mise.toml`.

## Why

`MISE_ENV` is a comma list where the last entry wins, so `MISE_ENV=dev,test`
makes a test file a **delta on dev** rather than a fourth full config. Without
it, a repo with a separate test environment had to either duplicate dev's
contents or put test values in dev and hope. The file costs nothing empty.

`mise.local.toml` was the more consequential omission: it existed in exactly one
of the maintainer's four repos and was gitignored in that one only, which meant
a machine-local override was either committed by accident or invented per repo.
Naming it in the doctrine — and never shipping it — settles both.

## What it costs, stated plainly

Two more files in every shaped repo's `.config/`, at least one of which most
repos will never put anything in. That is the trade taken deliberately: the
answer to "where does this go" should never require creating a file first, and
an empty file with a banner explaining what belongs in it is cheaper than the
question.
