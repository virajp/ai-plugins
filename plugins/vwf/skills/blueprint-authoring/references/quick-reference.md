# Blueprint Quick Reference

**The sort (every decision):** put it in the blueprint only if it has **>1
reasonable answer** AND is **true regardless of how the code is written**. Else
→ `plan` (realization) or `execute` (mechanical). Genuinely open → Open
Questions.

**Per-surface completeness bar (the reviewer gate):**

- **Data** — every field typed; optionality/default stated; enums fully
  enumerated; no "two reasonable answers".
- **Actions** — each has actor, precondition, authorization, observable outcome.
- **Lifecycle** — each transition has trigger, guard, side effect.
- **Concurrency** — concurrent-write resolution and idempotency stated for
  mutating actions.
- **API** — see the rest-api-design skill; error cases + idempotency per
  endpoint.
- **Relationships** — cardinality, ownership, cascade, required — per relation.
- **Flows** — steps, consistency boundary, failure compensation, idempotency.
- **Inter-service** — event/call contracts with delivery and failure semantics.
- **UI / UX** — navigation, interaction pattern, all states, form UX; visual
  language referenced from the design system, not re-decided.
- **Environment & secrets** — (`environment.md`, once integrations/secrets
  exist) every env var/secret catalogued per consuming project, classified
  (secret/non-secret/client-id), **no values**; the injection mechanism linked
  from `conventions.md#config`, not restated.
- **Limits / NFRs** — stated where they constrain observable behavior.
- **No realization leaked** — no file/class/library names, no pixels.
- **Minimalism** — every surface traces to a stated goal or a safety guardrail.
- **Frontmatter (OKF profile)** — mandatory `type` (valid vocabulary) / `title`
  / `description` / `status` on every doc (`timestamp`/`owner`/`resource`/`tags`
  optional).
- **Links resolve** — Relationships/References/flows use markdown links to
  target docs, and every edge resolves to an existing blueprint doc/anchor.
