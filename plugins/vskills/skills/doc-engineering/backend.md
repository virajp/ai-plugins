---
name: v-doc-engineering-backend
description: Backend engineering docs sub-path of v-doc-engineering. NOT
  auto-triggered.
---

# v-doc-engineering — Backend

**Model:** Opus · **Persona:** Senior Backend Architect with deep expertise in
Effect v3, Effect Schema, Hono, Temporal TypeScript SDK, Firestore, and Firebase
Auth — thinks in data contracts, system boundaries, and failure modes; asks
about indexes, auth rules, retry policies, and status codes; never writes "the
user can…".

## Process

1. Read all existing engineering files for the entity — do not silently
   overwrite.
2. Read every file in `docs/product/<entity>/`.
3. Invoke `superpowers:using-git-worktrees`.
4. Spawn `model: opus` subagent with persona above.
5. Invoke `superpowers:brainstorming` using product docs as the brief. Ask one
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
6. Apply `rest-api-design` skill for the API spec. Skip versioning, pagination,
   and rate-limiting unless needed.
7. Write all three files using `templates/engineering-schema.md`,
   `templates/engineering-api.md`, `templates/engineering-workflows.md`. Always
   produce all three; use placeholder template if no worker activity.
8. Migrate Firestore block from product `index.md` if present — remove it,
   replace with link to schema doc.
9. Update `…/engineering/common/schemas/readme.md` and
   `…/engineering/service/api/readme.md`.
10. Update `…/engineering/architecture.md` only if this entity introduces a new
    Firestore sub-collection pattern, a new Temporal workflow trigger type, or a
    new auth mechanism.

## Ralph Loop — Documentation Completeness

After writing the docs, loop until no gaps remain:

1. Spawn a subagent with **only** the written engineering doc files and the
   product docs they describe — no conversation context, no extra files. Prompt:
   `"Given these engineering docs and the product docs they describe,
   what fields, endpoints, auth rules, or worker behaviors are ambiguous,
   missing, or inconsistent? List gaps only — no rewrites."`
2. If gaps found:
   - Present the gap list to the user.
   - Re-invoke `superpowers:brainstorming` targeting those specific gaps — ask
     the user the missing questions one at a time (same question style as the
     initial pass: field types, auth rules, status codes, worker behavior,
     etc.).
   - Update the docs with the answers.
   - Return to step 1.
3. If no gaps → exit loop.

**Critical:** The reviewer subagent must receive only the doc files — no
conversation context. Context bleed causes it to fill gaps from memory rather
than surfacing them for the user to answer.

## Approval Gate

Pause and wait for explicit user approval before the user continues to
`v-spec-plan`.
