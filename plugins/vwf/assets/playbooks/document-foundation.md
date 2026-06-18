<purpose>
Document one cross-cutting engineering concern as a layer-0 foundation: read
context, elicit the canonical contract through tiered questions, and write the
foundation doc that entity docs link to.
</purpose>

<user-story>
As a platform engineer, I want a canonical contract for a cross-cutting concern,
so that entity docs can link to it instead of restating system-wide behaviour.
</user-story>

<when-to-use>
- Documenting a cross-cutting engineering concern during the
  pipeline's author phase of the `/engineering` command, as a layer-0 unit
- The unit is a concern (not an entity) — e.g. auth, errors, observability
- A concern exists in the codebase or is a declared `planned` decision, and
  downstream specs depend on it
</when-to-use>

**Persona (the author subagent adopts this):** Senior Platform/Architecture
Engineer with deep expertise in the project's declared stack (inject `stack`
from the architecture registry). Thinks in system-wide contracts that every
entity relies on — authentication/authorization, error semantics, observability,
configuration, testing, and external integrations. Documents the canonical
contract once so entity docs can link to it; never restates an entity's own
behaviour here.

**Unit:** concern (not entity). **Output:**
`docs/engineering/foundations/<concern>.md`.

Foundations are **layer-0**: they are documented before `packages`, because
`service`, `worker`, `site`, and `frontend` docs all link to them. They are
created lazily — only for concerns the product/codebase actually has, exactly
like project types (no worker doc if there is no worker).

## Concern Catalogue

Document a concern only when it exists in the codebase or is a declared
`planned` decision. Start with the two that downstream specs depend on most:

| Concern       | Slug            | Owns                                                     |
| ------------- | --------------- | -------------------------------------------------------- |
| Auth          | `auth`          | AuthN mechanism + AuthZ model (roles/claims/permissions) |
| Errors        | `errors`        | Canonical error-code registry + error-envelope shape     |
| Observability | `observability` | Log / event / metric schema, correlation IDs             |
| Config        | `config`        | Configuration & secret inventory, where each is read     |
| Testing       | `testing`       | Testing strategy, layers, conventions for `spec-plan`    |
| Integrations  | `integrations`  | External-service contracts (third-party APIs, webhooks)  |

For any other cross-cutting concern, use the same template and an apt slug.

<steps>

<step name="read_context" priority="first">
Read any existing `docs/engineering/foundations/<concern>.md` — do not silently
overwrite. Read the **`cross_cutting`** block in the `docs/architecture.md`
registry if present (the one-line selections such as `auth: firebase-id-token`).
Treat each as the `{decision}` line; if absent, derive the decision from the
codebase scan and surface it to the user for confirmation (suggest recording it
via `product`'s architecture phase). From the codebase scan, identify where the concern is
implemented (e.g. the auth middleware, the error enum, the logging setup). Code
is the source of truth for `live`/`partially-live` concerns.
</step>

<step name="elicit_contract">
These are the questions for the pipeline's **audit + clarify** phases. The audit
subagent surfaces the applicable ones (Tier 1 always, shaped to the concern;
Tier 2 only when relevant) and frames multi-valued ones as options; the
orchestrator asks them in batches. The author subagent (this persona, injected
stack) writes the answers — pre-filled from the Codebase Map and the
architecture cross-cutting decision where unambiguous.

### Tier 1 — always ask (shape to the concern)

1. **Scope** — what does this concern cover system-wide, and what is explicitly
   out of scope?
2. **Contract** — the canonical spec for the concern:
   - `auth` → verification flow + role/claim/permission model.
   - `errors` → the full code registry and the envelope shape.
   - `observability` → the log/event/metric schema and correlation strategy.
   - `config` → the config/secret inventory and read sites.
   - `testing` → layers, tools, and the conventions specs must target.
   - `integrations` → endpoints, auth, payload shapes, webhook semantics.
3. **Rules & invariants** — what must always hold regardless of which project
   applies the concern?
4. **Consumers** — which projects/docs depend on this contract (confirm against
   the registry `depends_on`)?

### Tier 2 — ask only if relevant to the concern

- `auth` with `custom-claims-rbac` → how claims are minted and checked.
- `errors` with localized copy → where user-facing strings live.
- `observability` with `distributed-tracing` → trace-context propagation rules.
- `integrations` with `message-queue` / webhooks → retry, signing, idempotency.
  </step>

<step name="write_doc">
Write `docs/engineering/foundations/<concern>.md` using
`${CLAUDE_PLUGIN_ROOT}/assets/templates/engineering-foundation.md`. Apply status callouts: document
`live`/`partially-live` parts from code, write `planned` parts as build specs.

Update `docs/engineering/foundations/readme.md` (index of foundation docs).
</step>

</steps>

> Review is centralized: the pipeline's **verify** phase runs the Ralph reviewer
> on the written docs and the orchestrator applies the per-unit approval gate.

<output>
`docs/engineering/foundations/<concern>.md` — the canonical contract for the
concern (scope, contract, rules & invariants, consumers, with status callouts) —
plus an updated foundations index, passing the Ralph reviewer.
</output>

<acceptance-criteria>
- [ ] Existing doc read; not silently overwritten
- [ ] `cross_cutting` registry block read, or decision derived from code and surfaced for confirmation
- [ ] Concern's implementation located in the codebase scan
- [ ] Tier 1 questions answered; Tier 2 asked only when relevant to the concern
- [ ] Doc written from the template; `live`/`partially-live` from code, `planned` as build specs
- [ ] Foundations index updated
- [ ] Review delegated to the pipeline's verify phase (not run here)
</acceptance-criteria>

## Cross-link discipline

A foundation doc is the **single source of truth** for its concern. Entity docs
must link to it, not restate it:

- `service/api/<entity>.md` — the Auth line links to `foundations/auth.md` and
  states only the entity-specific role; the Errors table lists only
  entity-specific codes and links to `foundations/errors.md` for standard ones.
- `site/<page>.md` and `frontend/<entity>/<screen>.md` — auth-gated states link
  to `foundations/auth.md`.

If an entity doc references a concern that has no foundation doc yet, that is a
**foundations gap** — surface it during the pipeline's **audit** phase so the
concern can be documented first.
