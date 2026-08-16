---
name: docs-sync
description: Reconcile the repo's human-facing docs — README, CLAUDE.md, docs/
  guides, per-project READMEs, the app changelog — with a change that landed,
  editing only what the change falsified. Runs at the end of every
  reality-changing vwf command, and standalone after ad-hoc work — pass a
  commit range, or let it scope to the current branch's delta.
argumentHint: "[<commit-range>]"
model: sonnet
effort: medium
invocation: both
---

# docs-sync — Reconcile Human Docs With What Landed

Bring every human-facing doc the change contradicts back in line with reality,
and edit nothing else. The **when** — which runs must end here, and why
`blueprint`/`plan` are exempt — is the contract in
`<%= it.root %>/assets/docs-sync.md`; this skill is the procedure it names.

## 1. Resolve the change scope

Every edit below must trace to a change, so first pin down what changed:

- **Invoked by a vwf run** (`execute`, or `architecture`/`product` update
  mode): the caller's change set is the scope — its worktree's commits plus its
  own summary of what changed. Use it as given; never re-derive it.
- **`$ARGUMENTS` names a commit range or single commit**: that diff is the
  scope.
- **Standalone, no argument**: the current branch's delta — the diff from its
  merge-base with the default branch to `HEAD` — plus any uncommitted changes.
  On the default branch itself, the uncommitted changes plus `HEAD`'s own diff.

An **empty scope** ends the run: report `docs: nothing to sync` and stop. A
scope touching **only** `docs/blueprint/` or `docs/plans/` is intent, not
reality (the asset's exemption) — say so and stop. A scope that is itself only
edits to the human docs has nothing to reconcile either.

## 2. Survey — delegate the scan

Spawn `docs-sync-surveyor` with the scope (the range, or the caller's diff
summary) and the **doc inventory**, and nothing else. The inventory is: every
README in the repo, `CLAUDE.md`, the human guides under `docs/` (excluding
`docs/blueprint/`, `docs/plans/`, `docs/memory/`, `docs/prompts/`, and
`docs/scratchpad/`), plus whatever `.config/vwf.yaml` `docs_sync.include`
adds. The agent returns the contradicted passages as findings; it never edits.

## 3. Apply — surgical or wholesale

- **Surgical by default.** For each finding, read the passage and update only
  what the change falsified or what now omits a landed capability. No style
  rewrites, no restructuring, no documenting unchanged behavior — every edited
  line traces to the scope.
- **Broad README drift** (the surveyor returns `BROAD DRIFT` instead of
  enumerating): regenerate via <%= it.cmd("vwf:readme") %> rather than
  patching sentence by sentence.
- **App changelog** (only when the registry's `cross_cutting` accepted the
  change-logs foundation): when the scope alters user-visible behavior on a
  device screen platform (`desktop`/`mobile`/`tablet`/`auto`), append a draft
  entry to the app repo's `CHANGELOG.md` `[Unreleased]` section — user-facing
  language, not commit prose — per the product-foundations change-logs
  reference.

## 4. Commit & report

- **Called by a run**: leave the edits in the caller's worktree — they land in
  the run's own commit flow, never a separate branch.
- **Standalone**: commit via <%= it.cmd("vwf:git-workflow") %> with a `docs:`
  message.

Either way, end with the report line the asset mandates: which docs were
synced, or the explicit `docs: nothing contradicted`. Never a silent skip.
