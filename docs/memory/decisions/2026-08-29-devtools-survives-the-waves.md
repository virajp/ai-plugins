# Decision — `devtools` survives; the north star closes at three

> **SUPERSEDED 2026-09-01 — the opposite shipped.** `devtools` was dissolved
> into `stackgen` and deleted; the north star closed at **two**. The plan that
> reversed this is
> [`docs/plans/2026-09-01-devtools-dissolution.md`](../../plans/2026-09-01-devtools-dissolution.md),
> whose §H answers the reasoning below argument by argument.
>
> **The body is left exactly as written.** A superseded decision is evidence,
> and this one is the strongest case against what was done — read it before
> reopening the question.

**Date** 2026-08-29 · **Branch** `main` (main checkout, deliberately not a
worktree) · **Supersedes** the plugin *count* in
[`2026-08-17-north-star-two-plugins.md`](./2026-08-17-north-star-two-plugins.md),
not its reasoning.

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`).

## What was decided

`devtools` is **not** merged into stackgen and **not** retired. It survives as
vwf's one dependency, keeping `mise`, `scaffold`, `doppler` and the five repo
gates whose doctrine also ships as stackgen packs.

So the convergence target is **`vwf` + `stackgen` + `devtools`**, not two.

## Why

The question put to Viraj was where `mise` doctrine should live, given no
component type fits a tool-version manager that is also a task runner. Three
options: mint a `toolchain-manager` type, reuse `build-orchestrator`, or leave
it. The answer was **leave it**.

The reasoning that survives independent of the call:

- **`mise` is a `/vwf:doctor` blocking mandate.** Doctrine that explains a halt
  belongs next to the halt. Moving it into stackgen would mean a user meets the
  block in vwf and finds the explanation in a plugin they may not have pinned.
- **`scaffold` is a live seam, not doctrine.** `/vwf:setup` invokes
  `/devtools:scaffold` mid-run, and a skill vwf cannot see fails **silently** —
  the same failure shape that sent the design adapters to vwf rather than to
  stackgen. It also carries 28 task files it copies into a repo's `.config/`,
  which is outside stackgen's `.claude/`-only output vocabulary.
- **`scaffold` and `mise` cannot be split.** scaffold's whole job is laying down
  the standard the `mise` skill defines. Separating them puts a writer and its
  spec in different plugins.

## What it costs, stated plainly

Seven bundles name mise in prose (`pnpm-workspace.md`: *"the task runner is the
only orchestration"*) and **no component supplies it**. That hole is now
permanent by choice rather than pending a wave: stackgen's bundles assume a task
runner they do not provide, and `devtools` is where a user gets it.

That is defensible — a stack bundle assuming the machine has a toolchain manager
is no stranger than assuming it has git — but it should not be rediscovered as a
bug later.

## Consequences

- **`devtools/doppler` stops blocking anything.** It was only a blocker because
  it had no home once `devtools` was deleted; there is no deletion, so nothing
  needs a `secrets` capability token minted in vwf. That question is closed, not
  deferred.
- **Wave D's remaining blockers are the three `gcp` skills** — `gcp-cost`,
  `gcp-iam`, `gcp-local-stack` — and they block by design, pending real
  per-topic research rather than a fold.
- The marketplace's floor is **three** entries plus whatever `gcp` and
  `cloudflare` resolve to, not two.
