# Engineering Baseline

The centralized technical rules every product follows by default — **enforced,
not elicited**. `<%= it.cmd("vwf:blueprint") %>` seeds them into `conventions.md#baseline` as
canonical contract lines on first touch (like the shared-pattern placement
rules); every doc and every cycle then follows them without being asked. Only
**exceptions** are documented. Keep this list the single source of truth; the
surfaces read it rather than carrying their own copy.

The rules are **stack-agnostic contracts** — what must hold, never how. Each
stack realizes them its own way (the realization notes live in
`assets/stacks/`); the blueprint's code-independence line is untouched.

**Exceptions (both places, always).** A deviation is recorded where it applies —
on the deviating doc, in the section the rule governs (e.g. an entity's
Concurrency section: "last-write-wins — telemetry, lossy by design") — **and**
as an `enforcement.rules` waiver in `.config/vwf.yaml` so reviewers skip it
without re-asking:

```yaml
enforcement:
  rules:
    # product-wide
    baseline/<rule>: { waived: true, reason: <one line> }
    # scoped to one unit, e.g. baseline/write-versioning/entities/telemetry
    baseline/<rule>/<unit>: { waived: true, reason: <one line> }
```

A deviation note without a waiver (or a waiver without the doc note) is a gap
the reviewers flag. The hard floor applies: `baseline/boundary-validation` may
be scoped-waived for a named unit with a reason, but never product-wide —
unvalidated boundaries are a security surface.

## The rules

**Data-write discipline**

1. **`baseline/write-versioning`** — every mutating write to a stored entity
   uses **optimistic versioning**: a version token read, checked, and
   incremented in the same atomic write; a stale token fails the write (never
   silently last-writes). Entity docs no longer elicit concurrency — the
   Concurrency section reads `default — per conventions#baseline` unless the
   entity genuinely deviates.
2. **`baseline/atomic-multi-write`** — a write spanning more than one
   document/row/aggregate happens in **one transaction or batch**; partial
   multi-doc state is never observable. Flows declare the boundary in their
   Guarantees table; this rule sets the default for what "atomic" means.
3. **`baseline/server-time`** — timestamps are **server-authoritative UTC**; a
   client clock never writes time. Client-supplied times are payload data (e.g.
   a user-entered date), never record timestamps.
4. **`baseline/soft-delete`** — deletion is **soft by default** (a lifecycle
   state, recoverable); hard deletion happens only where the data-retention
   contract (`conventions.md#data-retention`) explicitly schedules it —
   `delete-account` flows compose both: soft-delete now, retention-driven purge
   later.

**Boundary & schema discipline**

5. **`baseline/boundary-validation`** — every input **and output** crossing a
   boundary (API request/response, event payload, job payload, stored write) is
   validated against its schema; malformed data is **rejected, never coerced or
   passed through**. The schemas are the blueprint's `schema.yaml` / OpenAPI
   contracts realized in code.
6. **`baseline/business-technical-separation`** — business logic and technical
   plumbing never mix in one module: technical concerns (persistence, transport,
   third-party SDKs, logging, config) live in **common/shared layers** consumed
   by business code; business rules never live inside technical helpers. The
   workspace placement rules (`rules/schemas-in-common`,
   `rules/integrations-via-common` — seeded under `#patterns`) are this rule's
   workspace-shaped realization. Backing services are **attached resources**
   (12factor IV): reached only through injected config
   (`environment.md`-catalogued), swappable without a code change — never a
   hardcoded host, bucket, or queue name.

**API discipline** (defaults the rest-api-design skill details; this rule makes
them enforced rather than advisory)

7. **`baseline/idempotency-keys`** — every mutating API operation is idempotent;
   non-naturally-idempotent creates take an **idempotency key**. The OpenAPI
   contract records the mechanism per operation.
8. **`baseline/error-envelope`** — **one error shape** across every service and
   operation (the product's error contract under `conventions.md#errors`); no
   endpoint invents its own.
9. **`baseline/cursor-pagination`** — collection reads paginate by **cursor**;
   offset pagination only as a scoped waiver (e.g. an admin report where
   stability under mutation does not matter).

**Resilience**

10. **`baseline/retry-discipline`** — retries only on **idempotent** operations,
    with exponential backoff + jitter and a bounded attempt count; a
    non-idempotent operation is never blind-retried.
11. **`baseline/tolerant-reader`** — event/message contracts are **versioned**;
    consumers ignore unknown fields and never break on additive change
    (mirroring the released-API additive-only rule on the async surface).

**Process discipline** (12factor VI, VIII, IX)

12. **`baseline/stateless-processes`** — no request or session state lives in
    process memory across requests; anything that must survive a request lives
    in a backing service. Every `service` and `worker` is **safe at N concurrent
    replicas** — no singleton assumption, no local-disk handoff, no in-memory
    lock — unless a scoped waiver declares the singleton and why.
    (`write-versioning` and `idempotency-keys` are what make N-replica safety
    real; this rule is why they matter.)
13. **`baseline/graceful-shutdown`** — a process drains on the termination
    signal: in-flight requests complete or hand back cleanly, claimed jobs are
    finished or returned to the queue, and **acknowledged work is never lost to
    a shutdown** (composes with `retry-discipline` and the delivery semantics
    the flows pin). Sudden death must be survivable; graceful exit is the norm.

**Operational hygiene**

14. **`baseline/structured-logs-no-pii`** — logs are structured (key-value, not
    prose) and **never contain PII or secrets**; identifiers are opaque ids.
    Logs, traces, and metrics all travel through **OpenTelemetry** (the
    observability foundation) — never bespoke log files or side channels.
15. **`baseline/integer-money`** — money and precise quantities are **integer
    minor units** (cents, satoshi, grams) with an explicit currency/unit field —
    never floats.

## How the surfaces apply it

- **`<%= it.cmd("vwf:blueprint") %>`** seeds `#baseline` into `conventions.md` on first touch
  (all 15 lines, minus any product-wide waivers) and applies the defaults while
  authoring: entity Concurrency defaults to rule 1, flow Consistency boundaries
  assume rule 2, API operations carry rules 7–9 — elicitation covers only
  genuine deviations, never re-asks a rule.
- **`blueprint-reviewer` / `blueprint-coherence-reviewer`** treat
  `default — per
  conventions#baseline` as complete, and flag a deviation note
  without its waiver (or the reverse) as a gap.
- **The execute reviewers** enforce the seeded `#baseline` lines like every
  other conventions anchor — code that last-writes without a version check,
  skips boundary validation, or embeds business logic in a technical layer is a
  finding, unless a waiver covers it.
