---
name: workflow
description: Explicit project workflow router. Call this to start any product or
  engineering work. NOT auto-triggered.
---

# workflow — Project Workflow

Explicitly called by user to start or continue the product development workflow.
Never auto-triggered. Supports running the full pipeline or jumping to any
stage.

## Doc Paths

All paths are relative to `workspace/` (the Claude Code working directory).

| Doc type       | Path                                                   |
| -------------- | ------------------------------------------------------ |
| Product        | `docs/product/`                                        |
| Backend Engr.  | `docs/engineering/` (common/, service/, worker/, web/) |
| Frontend Engr. | `docs/engineering/frontend/<entity>.md`                |
| Schema         | `docs/engineering/common/schemas/<entity>.md`          |
| API spec       | `docs/engineering/service/api/<entity>.md`             |
| Workflows      | `docs/engineering/worker/workflows/<entity>.md`        |
| Spec & Plan    | `docs/superpowers/`                                    |
| Archived       | `docs/superpowers/archived/`                           |

## Hard Rules

- **Git worktrees** — invoke `superpowers:using-git-worktrees` at the start of
  every stage that produces file output. Never work directly in the main
  worktree.
- **Approval gates** — pause and wait for explicit user approval before
  advancing to the next stage. Never chain stages automatically.
- **Model enforcement** — spawn a subagent with the specified model. Never run a
  stage on the wrong model.
- **Halt on missing prerequisites** — if a stage's required inputs do not exist,
  stop and tell the user what to run first.
- **Loop on findings** — if Stage 4b or 4c finds issues, loop back to Stage 4a
  to fix before re-reviewing.
- **Archive before closing** — Stage 4d is not complete until all spec & plan
  files are moved from `docs/superpowers/` to `docs/superpowers/archived/`. The
  approval gate must confirm this explicitly.

## Pipeline

| Stage | What                | Model  | Persona                        | Requires                 | Stage file    |
| ----- | ------------------- | ------ | ------------------------------ | ------------------------ | ------------- |
| 1     | Product Docs        | Opus   | Senior Product Manager         | —                        | `stage-1.md`  |
| 2a    | Backend Engr. Docs  | Opus   | Senior Backend Architect       | Stage 1                  | `stage-2a.md` |
| 2b    | Frontend Engr. Docs | Opus   | Senior Flutter Architect       | Stage 1                  | `stage-2b.md` |
| 3     | Spec & Plan         | Sonnet | Senior Developer / Architect   | 2a and/or 2b (per scope) | `stage-3.md`  |
| 4a    | Write Code          | Haiku  | Senior Developer (TDD)         | Stage 3                  | `stage-4a.md` |
| 4b    | Code Review         | Opus   | Senior Developer (Peer Review) | 4a + 100%                | `stage-4b.md` |
| 4c    | Security Review     | Opus   | Senior Security Engineer       | 4b done                  | `stage-4c.md` |
| 4d    | Update Docs         | Sonnet | Technical Writer (Eng. bg.)    | 4c done                  | `stage-4d.md` |

## Invocation

**Full pipeline** — auto-detect starting stage from what exists:

- No `docs/product/<entity>/` → Stage 1
- Product docs exist, no `docs/engineering/common/schemas/<entity>.md` → Stage
  2a
- Product docs exist, no `docs/engineering/frontend/<entity>.md` → Stage 2b
- Both 2a and 2b done (or only the relevant one for backend/frontend-only
  features), no spec in `docs/superpowers/` → Stage 3
- Spec exists, no implementation → Stage 4a

**Single stage** — user names the stage explicitly; jump directly after checking
prerequisites. Use this to skip 2a or 2b for backend-only or frontend-only
features.

If user intent is unclear, ask one clarifying question before proceeding.

**Before executing any stage:** read the corresponding stage file listed in the
pipeline table above.
