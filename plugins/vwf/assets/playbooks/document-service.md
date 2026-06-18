<purpose>
Document one entity's HTTP API for a `service` project: read context, elicit the
contract through tiered questions, and write the API engineering doc.
</purpose>

<user-story>
As a backend engineer, I want a code-grounded API contract for an entity, so that
the team can build and rely on its endpoints, auth, and error behaviour.
</user-story>

<when-to-use>
- Documenting a `service` (API backend) project's entity during the
  pipeline's author phase of the `/vwf:engineering` command
- The architecture registry lists the project as `type: service`
</when-to-use>

**Persona:** Senior Backend Architect with deep expertise in the project's
declared stack (inject `stack` from the architecture registry — e.g. the API
framework, schema/validation library, datastore, and auth mechanism). Thinks in
data contracts, system boundaries, and failure modes; asks about query patterns,
indexes, auth rules, idempotency, and status codes; never writes "the user can…"
(that is product-level).

**Unit:** entity. **Output:** `docs/engineering/service/api/<entity>.md`.

<steps>

<step name="read_context" priority="first">
Read any existing `docs/engineering/service/api/<entity>.md` — do not silently
overwrite. Then read every file in `docs/product/<entity>/` and the entity's
schema doc at `docs/engineering/packages/schemas/<entity>.md` if it exists. Also
read `docs/engineering/foundations/auth.md` and
`docs/engineering/foundations/errors.md` if they exist — auth and standard error
codes are linked, not restated.
</step>

<step name="elicit_contract">
These are the questions for the pipeline's **audit + clarify** phases. The audit
subagent surfaces the applicable ones (Tier 1 always; Tier 2 only if the
capability is in the registry) and frames multi-valued ones as options; the
orchestrator asks them in batches. The author subagent (this persona, injected
stack) writes the answers — pre-filled from the Codebase Map where the code is
unambiguous.

### Tier 1 — always ask

1. **Endpoints** — what operations does this entity expose? Method + path for
   each.
2. **Auth per endpoint** — public / authenticated / role-gated? Which role
   (creator only, admin, group member, any authed user)? The mechanism lives in
   `foundations/auth.md`; capture only the per-endpoint role here. If no
   `foundations/auth.md` exists yet, this is a foundations gap — flag it.
3. **Request & response shapes** — reference the shared schema in `packages`;
   note any endpoint-specific deviation.
4. **Validation** — what validation beyond the schema contract?
5. **Failure cases** — HTTP status code and error-code string for each. Standard
   codes live in `foundations/errors.md`; document only entity-specific codes
   here and link to the registry for the rest.
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
  </step>

<step name="write_doc">
Write `docs/engineering/service/api/<entity>.md` using
`${CLAUDE_PLUGIN_ROOT}/assets/templates/engineering-api.md`. Indexes and query patterns are documented here
(the service owns how shared schemas are queried), not in the schema doc.

**Legacy migration:** if the product `index.md` embeds a data-model/schema
block, move it to `docs/engineering/packages/schemas/<entity>.md` and replace it
in the product doc with a link.

Update `docs/engineering/service/api/readme.md` (index of API docs).
</step>

</steps>

> Review is centralized: the pipeline's **verify** phase runs the Ralph reviewer
> on the written docs and the orchestrator applies the per-unit approval gate.

<output>
`docs/engineering/service/api/<entity>.md` — the entity's API contract
(endpoints, auth, request/response, errors, idempotency, query patterns) — plus
an updated API index, passing the Ralph reviewer.
</output>

<acceptance-criteria>
- [ ] Existing doc read; not silently overwritten
- [ ] Product, schema, and foundation docs read where present
- [ ] Tier 1 questions answered; Tier 2 asked only for declared capabilities
- [ ] Doc written from the template; query patterns documented here, not in schema
- [ ] Auth and standard errors linked to foundation docs, not restated
- [ ] API index updated
- [ ] Review delegated to the pipeline's verify phase (not run here)
</acceptance-criteria>
