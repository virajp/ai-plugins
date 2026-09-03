---
type: vwf-product
title: virajp-plugins — Product
description: Problem, users, success metrics, and slice priority — the outcome
  contract the blueprint serves.
status: draft # draft | reviewed | stable
---

# virajp-plugins — Product

> **Source of truth for why the product exists and what "good" means.** Lives at
> `docs/blueprint/product.md`, authored by `/vwf:product` — the Phase −1
> foundation before `architecture`. Code- and stack-independent: no technology,
> project, or screen names — those belong to the registry and the entity docs.
> Every flow's Purpose links the goal(s) it serves (entities trace to goals
> through the flows that use them); the blueprint-reviewer flags surfaces that
> trace to no goal.

## Problem

A coding agent given a request builds **code**, not a **product**. Four failures
follow, and they compound:

- **No outcome contract.** Work starts at implementation. Scope is whatever the
  prompt implied that day, and nothing traces back to why it was wanted.
- **Drift between sessions.** Nothing durably records what was decided, so the
  next session reconstructs intent from the code — and reconstructs it
  differently. Docs, code and intent diverge with no authoritative source.
- **Quality is operator-dependent.** Whether a change gets tests, a code review,
  a security pass and an acceptance check depends on whether someone remembered
  to ask.
- **Dependencies arrive out of order.** Work starts on a slice whose foundations
  do not exist yet, so it stubs them badly or stalls.

This product is a **method for a coding agent to build products** — a documented
workflow that pins the outcome first, keeps a current contract, resolves build
order, and runs the quality gates unconditionally.

**Why now.** Agent-assisted development is fast enough that the bottleneck has
moved from writing code to deciding what is correct and keeping that decision
durable.

## Target users

| Persona                   | Who they are                                                                                | Core need                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Fresh-start developer** | Starting a greenfield product with an agent, from an idea rather than a codebase            | Reach a shipped, reviewed first slice without inventing a process on the way                                  |
| **Adopting developer**    | Has a codebase that already works and earns; wants the workflow without a rewrite           | Onboard existing work so its conventions are recognized rather than replaced, and keep shipping               |
| **Operating developer**   | Runs a live product already on the workflow; ships slice after slice once the first landed  | Keep the contract true as reality diverges from it, and carry work across sessions without rebuilding context |
| **Toolkit maintainer**    | Authors and maintains the workflow and its plugins; runs this repo through its own workflow | Keep the parts internally consistent, and prove the workflow works by depending on it in anger                |

## Goals & success metrics

### Work traces to a stated outcome {#goal-traceable-work}

- Outcome: every change that ships can be traced back to a measurable goal
  agreed before the code was written.
- Metric: share of merged cycle plans whose covered docs reach a flow that
  serves a goal anchor — target 100%, every cycle.
- Measured via: store-metric share of merged plan docs whose covered docs reach
  a flow that serves a goal anchor.
- Re-evaluate if: traced share below 100% by 2026-12-31 → pivot.

### The blueprint stays authoritative {#goal-authoritative-blueprint}

- Outcome: a later session reads the contract rather than re-deriving intent
  from the code, because the contract still matches reality.
- Metric: share of planning runs that complete without routing a discovered gap
  back into the blueprint — target ≥ 80%, every planning run. A run that routes
  a gap back instead records `vwf-plan.compensated`, so the ratio of the two is
  the metric.
- Measured via: counter vwf-plan.completed

### A decision is made once {#goal-decisions-persist}

- Outcome: a decision taken in one session is available to the next as a written
  record, so it is never re-litigated from the code.
- Metric: share of reality-changing runs that file their durable decisions, or
  record that there were none — target 100%, every run.
- Measured via: store-metric share of completed runs carrying a matching
  decision record.

### Quality gates run unasked {#goal-unconditional-quality-gates}

- Outcome: tests, code review, security review, acceptance and interface
  conformance happen because the workflow runs them, not because anyone asked.
- Metric: share of execution runs reaching their final gate with every stage
  recorded and none skipped — target 100%, every run. A stage that reports
  itself inapplicable counts as run; a skipped stage records
  `vwf-execute.failed`, so the ratio of the two is the metric.
- Measured via: counter vwf-execute.completed

### Dependencies precede dependents {#goal-ordered-dependencies}

- Outcome: no slice is built on a foundation that does not exist yet.
- Metric: share of cycle plans whose transitive dependency chain was fully
  planned before execution started — target 100%, every plan.
- Measured via: store-metric share of plan docs whose declared dependency chain
  was fully planned before execution started, read against the build stamps of
  the docs they cover.

### A working codebase adopts it without a rewrite {#goal-adopt-without-rewrite}

- Outcome: an existing, working repository can take up the workflow and keep
  shipping, its conventions recognized rather than replaced.
- Metric: share of onboarding runs that modify nothing outside the documentation
  tree, the configuration directory and the agent instructions file — target
  100%, per onboarding. A run that touches anything outside the permitted paths
  records `vwf-setup.failed`, so the ratio of the two is the metric.
- Measured via: counter vwf-setup.completed

### The toolkit stays internally consistent {#goal-consistent-toolkit}

- Outcome: the parts agree with each other and with their own documentation — no
  part advertises a capability it lacks, no manifest disagrees with the catalog
  generated from it.
- Metric: share of pushes on which the consistency checks pass — target 100%,
  every push.
- Measured via: external the repository's own continuous integration — the
  consistency checks on every push.

### Getting started is one command {#goal-one-command-start}

- Outcome: reaching a usable first state is a single command, not a setup
  procedure.
- Metric: number of commands required from a clean machine to a usable state —
  target 1, plus an agent restart; per release.
- Measured via: external the post-release environment check, run from a clean
  machine.

### The workflow imposes no stack {#goal-stack-agnostic-workflow}

- Outcome: the workflow names no technology at all; every concrete choice comes
  from an optional part installed only if the product uses it.
- Metric: count of prescriptive technology references inside the workflow —
  target 0, every push.
- Measured via: external the technology-free guard in the repository's checks.

## Slice priority

| Rank | Slice (flow / entity)                    | Serves goal                       | Validates                                                            | Why now                                                                                                         |
| ---- | ---------------------------------------- | --------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1    | Finish the whole-product blueprint sweep | #goal-authoritative-blueprint     | The revised granularity rule holds across the full sweep             | Coverage reads partial, which hard-halts planning — every slice below is blocked behind it                      |
| 2    | Local end-to-end verification task       | #goal-unconditional-quality-gates | —                                                                    | The acceptance stage has nothing to run until one named task exists; onboarding deliberately left it            |
| 3    | One small change through plan → execute  | #goal-traceable-work              | —                                                                    | The end-to-end proof the workflow operates on this product; needs rank 1 to unblock and rank 2 to be meaningful |
| 4    | Post-release install verification        | #goal-one-command-start           | Continuous integration catches a bad merge before a user installs it | The goal with the weakest evidence today — nothing yet proves the single command works from clean               |

```mermaid
flowchart LR
  A[Finish the blueprint sweep] --> B[Local end-to-end verification task]
  B --> C[One small change through plan and execute]
  C --> D[Post-release install verification]
```

## Non-goals

- **Bespoke builds for other agents.** One authored form, for one host. Other
  tools are served by a documented prompt, not a maintained port — the losses
  were accepted knowingly when the multi-target build retired.
- **A configurable framework for large organizations.** One workflow, one set of
  conventions, sized for a solo developer or a small team. Requests for
  configurability are not gaps.
- **Deploying anything.** The workflow states the delivery contract and verifies
  an environment after the fact. The mechanism belongs to an optional part; the
  act of deploying belongs to the user.
- **Measuring its own users.** Nothing phones home. The workflow leaves its
  evidence in the repository — run records, plan documents, continuous
  integration — where the developer can read it, and nowhere else. That is also
  why every goal above is measured from local artifacts.
- **Being cheap to run.** Judgment-heavy stages run the strongest model
  available, hold the whole contract in context at once, and loop on findings.
  Meaningful cost per slice is a deliberate trade, not a defect to optimize
  away.

## Risks & assumptions

| Assumption                                                                           | Risk if wrong                                                                                                       | Validation method                                                                            | Status      | Evidence                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The contract format can describe an agent-extension product, not just an application | The blueprint sweep cannot express what a part does, and planning halts — the format underspecifies its own subject | `prototype`                                                                                  | invalidated | The first sweep (2026-08-27) found the literal reading demanded 102 flows, roughly 12,000 lines, against a repo whose densest document is about 600. Resolved by redefining an extension product's flow as an invocable extension point, which cut scope from 48 to 25 |
| The revised granularity rule holds across the full sweep                             | The rule fixes the count without fixing the fit, and the sweep stalls again partway with the same overage argument  | `slice:finish-the-whole-product-blueprint-sweep`                                             | untested    | 3 of 25 flows written and certified ([010](./flows/plugins/010-vwf-setup/index.md), [020](./flows/plugins/020-vwf-product/index.md), [030](./flows/plugins/030-vwf-architecture/index.md)), each over budget but reviewed as genuine. The remaining 22 settle it       |
| Measuring the goals against one product is representative                            | Every metric reads green because the same author built both the workflow and the thing measured; n=1                | `accepted-risk — no external adoption is scheduled, so every reading is n=1 by construction` | untested    | None. The risk is carried knowingly rather than mitigated; it closes only if an outside team adopts the workflow                                                                                                                                                       |
| Continuous integration catches a bad merge before a user installs it                 | The catalog is served from the main branch, so a broken merge is installable until the build goes red               | `slice:post-release-install-verification`                                                    | untested    | The per-push validation exists and runs, and now asserts every catalog reference names a tag that exists — but it narrows the window rather than closing it; nothing yet proves a published version installs from clean                                                |
