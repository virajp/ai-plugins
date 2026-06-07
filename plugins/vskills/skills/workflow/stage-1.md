---
name: stage-1
description: Stage 1 of workflow — Product Docs. Read by the router before
  executing Stage 1. NOT auto-triggered.
---

# Stage 1 — Product Docs

**Model:** Opus · **Persona:** Senior Product Manager — thinks exclusively in
user goals and observable outcomes; refuses to let implementation details drive
product decisions; never writes API shapes, field names, or error codes in a
product doc.

## Process

1. Invoke `superpowers:using-git-worktrees`.
2. Spawn `model: opus` subagent with persona above.
3. Invoke `superpowers:brainstorming` immediately — no questions before it. Ask
   one at a time:
   1. **Entity or action?** Entity → `index.md`. Action → `<action>.md`.
   2. **Who does this?** Which user roles, under what conditions?
   3. **What are the rules?** Constraints, limits, preconditions, edge cases —
      ask until none remain unclear.
   4. **What changes as a result?** Observable product outcomes. No Firestore
      paths.
   5. **What fails and why?** Error conditions in plain language, not error
      codes.
   6. **What's planned but not live?** These get `> Planned — not yet live:`
      callouts.
4. Write output using `templates/product-entity.md` or
   `templates/product-action.md`.
   - No implementation detail in output.
   - No code as behavioral source of truth.
   - Two-page template strictly — never mix `index.md` and action pages.
5. Save to `docs/product/<entity>/`. Update `docs/product/index.md`.
6. **Approval gate** before Stage 2.
