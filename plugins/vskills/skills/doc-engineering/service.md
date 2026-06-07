---
name: doc-engineering-service
description: Service (API backend) doc set of doc-engineering. NOT
  auto-triggered.
---

# doc-engineering — Service

**Persona (orchestrator adopts this):** Senior Backend Architect with deep
expertise in the project's declared stack (inject `stack` from the architecture
registry — e.g. the API framework, schema/validation library, datastore, and
auth mechanism). Thinks in data contracts, system boundaries, and failure modes;
asks about query patterns, indexes, auth rules, idempotency, and status codes;
never writes "the user can…" (that is product-level).

**Unit:** entity. **Output:** `docs/engineering/service/api/<entity>.md`.

## Process

1. Read any existing `docs/engineering/service/api/<entity>.md` — do not
   silently overwrite.
2. Read every file in `docs/product/<entity>/` and the entity's schema doc at
   `docs/engineering/packages/schemas/<entity>.md` if it exists.
3. Adopt the persona with the injected stack. Invoke `superpowers:brainstorming`
   and ask the questions below one at a time (MCQ + "Other").

### Tier 1 — always ask

1. **Endpoints** — what operations does this entity expose? Method + path for
   each.
2. **Auth per endpoint** — public / authenticated / role-gated? Which role
   (creator only, admin, group member, any authed user)?
3. **Request & response shapes** — reference the shared schema in `packages`;
   note any endpoint-specific deviation.
4. **Validation** — what validation beyond the schema contract?
5. **Failure cases** — HTTP status code and error-code string for each.
6. **Idempotency** — which writes must be safe to retry?

### Tier 2 — ask only if the capability is in the registry

- `document-datastore` / `relational-datastore` → **Query patterns & indexes:**
  which fields are queried alone or in combination? Composite indexes needed?
  Consistency requirements?
- `third-party-auth` / `custom-claims-rbac` → how is identity verified and how
  are roles/claims checked per endpoint?
- `cache-layer` → what does the API cache and how is it invalidated?
- `object-file-storage` → upload/download endpoints, signed URLs, size/type
  limits?
- `realtime-sync` → streaming or subscription endpoints?
- `payments-subscriptions` → entitlement checks gating any endpoint?
- `distributed-tracing` → trace-context propagation expected to the worker?

4. Write `docs/engineering/service/api/<entity>.md` using
   `templates/engineering-api.md`. Indexes and query patterns are documented
   here (the service owns how shared schemas are queried), not in the schema
   doc.
5. **Legacy migration:** if the product `index.md` embeds a data-model/schema
   block, move it to `docs/engineering/packages/schemas/<entity>.md` and replace
   it in the product doc with a link.
6. Update `docs/engineering/service/api/readme.md` (index of API docs).
7. Run the shared **Ralph loop** and **Approval gate** from the main SKILL.
