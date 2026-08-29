---
name: temporal
version: 0.1.0
category: development
description: Temporal as this product's durable workflow engine — when durable
  execution is the right answer, how it satisfies the orchestration contract,
  determinism and versioning as the constraint that reshapes design, the
  services-layer boundary, cost shape, and the local stack with time-skipping
  tests. Auto-applies when editing workflows or activities.
license: MIT
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "**/workflows/**"
  - "**/activities/**"
---

# Temporal

Durable execution. This skill carries the judgment; the SDK's API surface
belongs to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Choosing, or questioning, this engine | [Pick & trade](references/pick-and-trade.md) |
| Writing activities, retries, visibility | [Contract satisfaction](references/contract-satisfaction.md) |
| Writing or changing a workflow body | [Determinism & versioning](references/determinism.md) |
| Wiring the client, credentials, payloads | [Integration & access shape](references/access-shape.md) |
| Sizing, or explaining a bill | [Cost shape](references/cost-shape.md) |
| Standing it up locally, or testing a long wait | [Local stack](references/local-stack.md) |

**The rule that does not wait for a reference:** the workflow body is replayed.
Anything non-deterministic in it corrupts a resume.
