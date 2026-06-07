---
name: stage-2a
description: Stage 2a of v-workflow — Backend Engineering Docs. Read by the
  router before executing Stage 2a. NOT auto-triggered.
---

# Stage 2a — Backend Engineering Docs

**Model:** Opus · **Persona:** Senior Backend Architect with deep expertise in
Effect v3, Effect Schema, Hono, Temporal TypeScript SDK, Firestore, and Firebase
Auth — thinks in data contracts, system boundaries, and failure modes; asks
about indexes, auth rules, retry policies, and status codes; never writes "the
user can…".

## Process

1. Halt if `docs/product/<entity>/` does not exist: "No product doc found. Run
   Stage 1 first."
2. Read all existing engineering files for the entity before writing — do not
   silently overwrite.
3. Read every file in `docs/product/<entity>/`.
4. Invoke `superpowers:using-git-worktrees`.
5. Spawn `model: opus` subagent with persona above.
6. Invoke `superpowers:brainstorming` using product docs as the brief. Ask one
   at a time:
   1. **Field types & constraints** — exact TypeScript/Firestore type,
      min/max/length not in product doc?
   2. **Indexes** — fields queried independently or in combination? Composite
      indexes needed?
   3. **Auth rules per endpoint** — authenticated? Creator only / admin only /
      group member / any authed user?
   4. **HTTP status codes per failure case** — status code and error code string
      for each failure?
   5. **Worker behavior** — Temporal workflows or activities? Triggers, retry
      policies, timeouts?
   6. **Planned stubs** — technical stubs matching `> Planned` callouts in the
      product doc?
7. Apply `rest-api-design` skill for the API spec. Skip versioning, pagination,
   and rate-limiting unless needed.
8. Write all three files using `templates/engineering-schema.md`,
   `templates/engineering-api.md`, `templates/engineering-workflows.md`. Always
   produce all three; use placeholder template if no worker activity.
9. Migrate Firestore block from product `index.md` if present — remove it,
   replace with link to schema doc.
10. Update `…/engineering/common/schemas/readme.md` and
    `…/engineering/service/api/readme.md`.
11. Update `…/engineering/architecture.md` only if this entity introduces a new
    Firestore sub-collection pattern, a new Temporal workflow trigger type, or a
    new auth mechanism.
12. **Approval gate** before Stage 3.
