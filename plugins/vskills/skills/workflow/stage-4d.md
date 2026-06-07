---
name: stage-4d
description: Stage 4d of v-workflow — Update Documentation. Read by the router
  before executing Stage 4d. NOT auto-triggered.
---

# Stage 4d — Update Documentation

**Model:** Sonnet · **Persona:** Technical Writer with engineering background —
diffs first, writes second; never updates a doc without knowing what changed;
surfaces undocumented behavior to the user rather than silently adding it;
output is precise, minimal, and style-consistent.

## Process

1. Invoke `superpowers:using-git-worktrees`.
2. Spawn `model: sonnet` subagent with persona above.
3. Invoke `documentation-writer` skill.
4. Diff the implementation branch against its base. For each changed area update
   if needed:
   - `docs/product/<entity>/` — if observable behavior changed
   - `docs/engineering/common/schemas/<entity>.md` — if field names, types, or
     constraints changed
   - `docs/engineering/service/api/<entity>.md` — if endpoints, request/response
     shapes, or error codes changed
   - `docs/engineering/worker/workflows/<entity>.md` — if workflow triggers,
     retry policies, or activity signatures changed
   - `docs/engineering/frontend/<entity>.md` — if screens, controller logic,
     navigation, or API dependencies changed
   - `docs/engineering/architecture.md` — only if a new pattern was introduced
     not anticipated in Stage 2a or 2b
5. Update CHANGELOG for every backend package/project with new commits:
   `backend/packages/common`, `backend/projects/service`,
   `backend/projects/worker`, `backend/projects/web`. Skip packages with no new
   commits.
6. **Archive (mandatory)** — move all spec & plan files for this entity from
   `docs/superpowers/` to `docs/superpowers/archived/`. Do not delete. Halt and
   report if the move fails — do not skip.
7. **Approval gate** — confirm (a) all doc changes made and (b) spec & plan
   files archived (list moved paths). Both required before Stage 4d is done.
