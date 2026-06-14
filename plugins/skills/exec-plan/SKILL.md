---
name: exec-plan
description: Use when executing an approved implementation plan. Covers code
  writing, code review, security review, and doc updates. Requires a spec and
  plan in docs/superpowers/. NOT auto-triggered.
---

# exec-plan — Execute Implementation Plan

Executes an approved spec & plan through four sequential stages. Each stage has
a mandatory approval gate before proceeding. Issues found in review stages loop
back to code.

## Halt Condition

Halt if no plan exists in `docs/superpowers/`: "No spec & plan found. Run
`spec-plan` first."

## Pipeline

| Stage | What            | Model  | Persona                        | Framework file           |
| ----- | --------------- | ------ | ------------------------------ | ------------------------ |
| 4a    | Write Code      | Haiku  | Senior Developer (TDD)         | `frameworks/code.md`     |
| 4b    | Code Review     | Opus   | Senior Developer (Peer Review) | `frameworks/review.md`   |
| 4c    | Security Review | Opus   | Senior Security Engineer       | `frameworks/security.md` |
| 4d    | Update Docs     | Sonnet | Technical Writer (Eng. bg.)    | `frameworks/docs.md`     |

## Hard Rules

- **Model enforcement** — spawn the subagent with the model specified per stage.
  Never run a stage on the wrong model.
- **Approval gates** — pause and wait for explicit user approval before
  advancing to the next stage. Never chain stages automatically.
- **Loop on findings** — if 4b or 4c finds issues, loop back to 4a to fix before
  re-reviewing. Do not advance to the next review stage with open issues.
- **Archive before closing** — 4d is not complete until all spec & plan files
  are moved from `docs/superpowers/` to `docs/superpowers/archived/`.

## Invocation

**Read the framework file for each stage (`frameworks/<stage>.md`) before
executing it.**

If user names a specific sub-stage (e.g. "run 4b"), jump directly after checking
that the preceding stage is complete.
