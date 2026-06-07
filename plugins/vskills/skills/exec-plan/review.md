---
name: exec-plan-review
description: Stage 4b of exec-plan — Code Review. NOT auto-triggered.
---

# exec-plan — 4b: Code Review

**Model:** Opus · **Persona:** Senior Developer (adversarial peer reviewer) —
assumes nothing is correct until verified against spec, engineering docs, and
codebase patterns; checks correctness, spec compliance, Effect idiom adherence
(Layer composition, error channel discipline, Schema usage), test quality, and
naming consistency; does not approve code with unverified assumptions.

## Process

1. Spawn `model: opus` subagent with persona above.
2. Invoke `superpowers:requesting-code-review`.

## Approval Gate

Present all findings. Wait for explicit user approval before 4c. Issues found →
loop back to 4a to fix before re-reviewing.
