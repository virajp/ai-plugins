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

| Persona                   | Who they are                                                                                | Core need                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Fresh-start developer** | Starting a greenfield product with an agent, from an idea rather than a codebase            | Reach a shipped, reviewed first slice without inventing a process on the way                    |
| **Adopting developer**    | Has a codebase that already works and earns; wants the workflow without a rewrite           | Onboard existing work so its conventions are recognized rather than replaced, and keep shipping |
| **Toolkit maintainer**    | Authors and maintains the workflow and its plugins; runs this repo through its own workflow | Keep the parts internally consistent, and prove the workflow works by depending on it in anger  |

## Goals & success metrics

### Work traces to a stated outcome {#goal-traceable-work}

- Outcome: every change that ships can be traced back to a measurable goal
  agreed before the code was written.
- Metric: share of merged cycle plans whose covered docs reach a flow that
  serves a goal anchor — target 100%, every cycle.
- Measured via: the plan documents against the flow contracts they cover.

### The blueprint stays authoritative {#goal-authoritative-blueprint}

- Outcome: a later session reads the contract rather than re-deriving intent
  from the code, because the contract still matches reality.
- Metric: share of planning runs that complete without routing a discovered gap
  back into the blueprint — target ≥ 80%, every planning run.
- Measured via: the planning run's own outcome; a gap it finds is a case where
  the contract had drifted from the code.

### Quality gates run unasked {#goal-unconditional-quality-gates}

- Outcome: tests, code review, security review, acceptance and interface
  conformance happen because the workflow runs them, not because anyone asked.
- Metric: share of execution runs reaching their final gate with every stage
  recorded and none skipped — target 100%, every run. A stage that reports
  itself inapplicable counts as run.
- Measured via: the run journal each execution writes.

### Dependencies precede dependents {#goal-ordered-dependencies}

- Outcome: no slice is built on a foundation that does not exist yet.
- Metric: share of cycle plans whose transitive dependency chain was fully
  planned before execution started — target 100%, every plan.
- Measured via: the plan documents' declared dependency chains against the build
  stamps of the docs they cover.

### A working codebase adopts it without a rewrite {#goal-adopt-without-rewrite}

- Outcome: an existing, working repository can take up the workflow and keep
  shipping, its conventions recognized rather than replaced.
- Metric: share of onboarding runs that modify nothing outside the documentation
  tree, the configuration directory and the agent instructions file — target
  100%, per onboarding.
- Measured via: the diff the onboarding run itself commits.

### The toolkit stays internally consistent {#goal-consistent-toolkit}

- Outcome: the parts agree with each other and with their own documentation — no
  part advertises a capability it lacks, no manifest disagrees with the catalog
  generated from it.
- Metric: share of pushes on which the consistency checks pass — target 100%,
  every push.
- Measured via: the repository's own continuous integration.

### Getting started is one command {#goal-one-command-start}

- Outcome: reaching a usable first state is a single command, not a setup
  procedure.
- Metric: number of commands required from a clean machine to a usable state —
  target 1, plus an agent restart; per release.
- Measured via: the post-release environment check.

### The workflow imposes no stack {#goal-stack-agnostic-workflow}

- Outcome: the workflow names no technology at all; every concrete choice comes
  from an optional part installed only if the product uses it.
- Metric: count of prescriptive technology references inside the workflow —
  target 0, every push.
- Measured via: the technology-free guard in the repository's checks.

## Slice priority

| Rank | Slice (flow / entity)                   | Serves goal                       | Why now                                                                                              |
| ---- | --------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1    | Local end-to-end verification task      | #goal-unconditional-quality-gates | The acceptance stage has nothing to run until one named task exists; onboarding deliberately left it |
| 2    | One small change through plan → execute | #goal-traceable-work              | The end-to-end proof the workflow operates on this product; depends on rank 1 to be meaningful       |
| 3    | Post-release install verification       | #goal-one-command-start           | The goal with the weakest evidence today — nothing yet proves the single command works from clean    |
| 4    | Consolidation of the optional parts     | #goal-stack-agnostic-workflow     | Largest slice by far; each wave needs its own explicit go-ahead before it starts                     |

```mermaid
flowchart LR
  A[Local end-to-end verification task] --> B[One small change through plan and execute]
  B --> C[Post-release install verification]
  C --> D[Consolidation of the optional parts]
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
- **Being cheap to run.** Judgment-heavy stages run the strongest model
  available, hold the whole contract in context at once, and loop on findings.
  Meaningful cost per slice is a deliberate trade, not a defect to optimize
  away.

## Risks & assumptions

| Assumption                                                                           | Risk if wrong                                                                                                       | Validated by                                                                                  |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| The contract format can describe an agent-extension product, not just an application | The blueprint sweep cannot express what a part does, and planning halts — the format underspecifies its own subject | The full sweep, then the first planning run producing a plan without halting                  |
| Measuring the goals against one product is representative                            | Every metric reads green because the same author built both the workflow and the thing measured; n=1                | A real external adoption — nothing currently schedules one, which is why this risk stays open |
| Continuous integration catches a bad merge before a user installs it                 | The catalog is served from the main branch, so a broken merge is installable until the build goes red               | The per-push validation — a mitigation that narrows the window rather than eliminating it     |
