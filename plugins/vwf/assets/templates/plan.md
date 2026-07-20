---
type: vwf-plan
title: <slice> — <date>
description: Cycle plan (a diff) for the <slice> blueprint slice.
status: draft # draft | reviewed | stable
covers: [
  docs/blueprint/flows/<project>/<device>/<NNN>-<flow>/index.md,
] # the blueprint doc(s) this plan implements — one, except for a dependency cycle planned together
requires: [] # plan filenames (docs/plans/...) that must be executed & merged first — direct prerequisites only
# optional, standardized: timestamp: <ISO 8601>  owner  resource  tags
---

# Plan: <slice> — <date>

<!-- A cycle plan is a DIFF, not a re-blueprint. Reference the blueprint sections; do not
     restate them. Steps are ordered for TDD: each names the failing test that
     defines "done". Written by `plan`, executed by `execute`, archived by
     `archive`. Filename: docs/plans/<date>-<time>-<slice>.md -->

## Slice

Which flow or entity this plan covers, with a link to its blueprint doc, and the
plan's chain position when it is part of a dependency chain — e.g. "Plan 2 of 3
— requires `<plan file>`; required by `<plan file>`". A standalone plan states
"no dependency chain".

## Current state (actual)

What already exists in the relevant submodule(s).

## Target state (per blueprint)

What the blueprint says should exist. Reference sections; do not restate them.

## Delta — ordered steps

1. <step> — test-first note: the failing test that defines done.
2. ...

## Acceptance criteria (from blueprint)

<!-- Copied verbatim from the Acceptance blocks of the flow docs this slice
     touches — the contract execute's acceptance stage verifies end to end.
     Steps above must include the E2E tests that cover each criterion
     (the coder implements them; the acceptance verifier maps and runs them).
     Write "none — no flow touched" when the slice maps to no flow. -->

- [ ] Given <...>, when <...>, then <...> — from
      [<flow name>](../blueprint/flows/<project>/<device>/<NNN>-<flow>/index.md)

## Risks / drift

Any mismatch between blueprint, registry, and code surfaced during diffing. Code
that contradicts the blueprint is listed here with the conforming step that
resolves it — the blueprint is never adjusted to match code silently.

## Out of scope for this cycle

- ...

## Gaps surfaced during execution

<!-- Appended by `execute` as blueprint/plan holes surface — do not fill at plan time.
     One terse line per gap: stage that found it · what the blueprint/plan
     under/mis-specified · the assumption execution proceeded on. The durable,
     mempalace-independent copy; full detail lives in the mempalace `gaps` room.
     Reconciled into the blueprint (/vwf:blueprint) and a re-plan (/vwf:plan) at cycle end. -->

- ...
