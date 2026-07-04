# Audit Logs

An **append-only record of who did what to whom, when, and why** — distinct from
observability (traces answer "what happened in the system"; audit answers "which
human/actor is accountable"). Cross-cutting token:
`audit: privileged-destructive` (the default scope).

## Default contract

- **Scope: privileged + destructive.** Every operator/console action, plus any
  destructive or irreversible mutation of user data regardless of actor —
  delete, merge, ban, purge, payout, permission change. Ordinary CRUD stays in
  observability traces; recording everything is a deliberate, elicited widening,
  never the default.
- **Event shape** (every event): actor (id + class: customer/operator/system),
  action (a stable verb from the entity's Actors & Actions), target (entity +
  id), timestamp, outcome (success/denied/failed), reason (mandatory for
  operator moderation actions — bans, purges), and the correlating trace id.
- **Append-only, never edited or deleted in place** — retention expiry is the
  only removal path, executed as a purge (see data-retention; moderation history
  is itself a retained category with a legal basis).
- **Structurally unavoidable**: privileged mutations pass through an audit layer
  so it is impossible to mutate without an event (the console reference-stack's
  `AuditLogService` pattern) — audit is not a per-endpoint courtesy call.
- **Read surface**: audit events are visible to operators in the console
  (moderation history per user/target); events referencing retained
  post-deletion data are compliance-role only.
- **PII discipline**: events reference ids, never copy personal data into the
  event body.

## Elicit per product

This foundation is the least built-out in the reference implementation
(documented intent, no code yet) — elicit rather than assume:

- The event list: walk each entity's Actors & Actions and mark which rows are
  audit-recorded (all operator rows + destructive rows by default).
- Storage: the default is a dedicated append-only collection/table in the
  primary datastore; elicit if the product needs an external/immutable store.
- Retention period per event class (ties into the data-retention table).
- Whether customers get a self-view ("account activity") — off by default.

## Blueprint expansion

- `conventions.md#audit` holds the contract (scope, event shape, storage,
  access); each entity's Actors & Actions marks audited rows; the operator
  area's Screens include the moderation-history read surface. Audit-worthy async
  work (purges, merges) also names its audit event in Background Jobs.
