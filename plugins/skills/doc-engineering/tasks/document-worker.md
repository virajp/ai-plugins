<purpose>
Document one entity's background workflows for a `worker` project: read context,
elicit triggers, activities, and state transitions through tiered questions, and
write the worker engineering doc.
</purpose>

<user-story>
As a backend engineer, I want a code-grounded description of an entity's
background workflows, so that the team can understand its triggers, ordered
activities, state transitions, and failure/retry semantics.
</user-story>

<when-to-use>
- Documenting a `worker` (background tasks) project's entity during the
  `full_documentation` step of `document-engineering.md`
- The architecture registry lists the project as `type: worker`
</when-to-use>

**Persona:** Senior Backend Architect with deep expertise in the project's
declared workflow/async stack (inject `stack` from the registry — e.g. the
durable-workflow engine or queue system). Thinks in triggers, ordered
activities, state transitions, and failure/retry semantics; never writes API
request/response shapes (that is the service doc).

**Unit:** entity. **Output:** `docs/engineering/worker/workflows/<entity>.md`.

<steps>

<step name="read_context" priority="first">
Read any existing `docs/engineering/worker/workflows/<entity>.md` — do not
silently overwrite. Then read every file in `docs/product/<entity>/`, the
entity's schema doc, and the service API doc if present (workflows often act on
the same entity the API writes).
</step>

<step name="elicit_workflows">
Adopt the persona with injected stack. Brainstorm one question at a time (MCQ +
"Other"). **Wait for response after each.**

### Tier 1 — always ask

1. **Workflows** — what background workflows exist for this entity? What does
   each accomplish?
2. **Triggers** — event-driven, API-initiated, or scheduled? What is the
   triggering condition?
3. **Activities** — ordered list of activities per workflow.
4. **State transitions** — which entity state changes the worker drives (e.g.
   upcoming → ongoing → completed)?
5. **Failure handling** — what happens when an activity fails partway?

### Tier 2 — ask only if the capability is in the registry

- `durable-workflows` → **retry policy** (max attempts, initial interval,
  backoff coefficient), **timeouts** (workflow-run, activity start-to-close),
  and any **signals/queries**?
- `scheduled-jobs` → cron schedule, timezone, and overlap/catch-up policy?
- `message-queue` / `pub-sub` → which events are consumed and which emitted?
- `push-notifications` → which workflow steps emit notifications, and to whom?
- `distributed-tracing` → how is trace context carried from the service into the
  worker (e.g. W3C trace-context propagation)?
  </step>

<step name="write_doc">
Write `docs/engineering/worker/workflows/<entity>.md` using
`templates/engineering-workflows.md`. If no worker activity exists for the
entity, write the "no worker activity" variant from the template.

Update `docs/engineering/worker/workflows/readme.md` (index).
</step>

<step name="review">
Run the shared **Ralph loop** and **Approval gate** from the main SKILL.
</step>

</steps>

<output>
`docs/engineering/worker/workflows/<entity>.md` — the entity's background
workflows (triggers, ordered activities, state transitions, failure handling) —
plus an updated workflows index, passing the Ralph reviewer.
</output>

<acceptance-criteria>
- [ ] Existing doc read; not silently overwritten
- [ ] Product, schema, and service API docs read where present
- [ ] Tier 1 questions answered; Tier 2 asked only for declared capabilities
- [ ] Doc written from the template; "no worker activity" variant used when applicable
- [ ] Workflows index updated
- [ ] Ralph loop and approval gate honoured
</acceptance-criteria>
