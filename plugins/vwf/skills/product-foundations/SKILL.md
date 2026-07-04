---
name: product-foundations
description: The foundational concerns every product must decide — users &
  operators, observability, audit logs, change logs, background processes, data
  retention & PII, notifications, runtime settings, rate limiting. Elicited
  defaults distilled from the 95octane reference implementation. Used by
  /vwf:architecture (the foundations checklist) and /vwf:blueprint (expanding
  accepted foundations into contracts); read the reference matching the
  foundation being decided or expanded.
---

# Product Foundations

Nine concerns every product hits sooner or later. Each has a **default
contract** distilled from the 95octane reference implementation — proposed per
product, never silently assumed: `/vwf:architecture` walks this checklist as
part of its cross-cutting elicitation (one MCQ per foundation: **accept the
default / adapt it / not applicable**), records the selection as a
`cross_cutting` token, and `/vwf:blueprint` expands accepted ones into the
canonical contract in `conventions.md` plus the per-entity surfaces each
reference names.

These are **elicited defaults**, not enforced standards: declining one is a
recorded decision (the registry simply omits the token), not an `enforcement:`
opt-out. The contract layer here is code-independent; each reference points at
the reference-stack docs for the 95octane realization.

## The checklist

| Foundation           | Default (one line)                                                         | Reference                                                  |
| -------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Users & operators    | Two user classes; document-based RBAC; claims for account-status only      | [users](references/users.md)                               |
| Observability        | OpenTelemetry (traces+metrics+logs) → Grafana Cloud, trace-correlated logs | [observability](references/observability.md)               |
| Audit logs           | Append-only record of privileged + destructive actions                     | [audit-logs](references/audit-logs.md)                     |
| Change logs          | Keep-a-Changelog source of truth → fastlane store metadata                 | [change-logs](references/change-logs.md)                   |
| Background processes | Sync/async per action; durable → worker, ephemeral → service               | [background-processes](references/background-processes.md) |
| Data retention & PII | Delete by default; pseudonymised legal-basis retention; no PII in logs     | [data-retention](references/data-retention.md)             |
| Notifications        | Per-channel contracts (push/email/SMS); triggers live on entities          | [notifications](references/notifications.md)               |
| Runtime settings     | One cached, schema-typed settings document; flags are settings             | [runtime-settings](references/runtime-settings.md)         |
| Rate limiting        | Endpoint-class limits with a uniform 429 contract                          | [rate-limiting](references/rate-limiting.md)               |

## How the workflow consumes this

- **`/vwf:architecture` (step 3c)** — walks the checklist. For each foundation:
  present the default in one line, ask accept/adapt/skip, record the selection
  as a `cross_cutting` token (e.g. `audit: privileged-destructive`,
  `notifications: [push, email]`). Skipped foundations are omitted from the
  registry — that omission *is* the record.
- **`/vwf:blueprint`** — for each accepted foundation, expand the contract into
  `conventions.md` under its anchor (the reference names it) on first touch, and
  elicit the per-entity surface as entities are authored: audit events for
  privileged/destructive actions, notification triggers, sync/async
  classification and placement, settings reads. Entity docs link the anchors;
  they never restate the contract.
- **`/vwf:plan` / `execute`** — consume the contracts like any other conventions
  anchor; the change-logs reference additionally hooks execute's docs-sync step.

Foundations expand into **existing** blueprint structures (conventions anchors,
Actors & Actions, Background Jobs, integration flows) — no new mandatory doc
sections, so a product that skips a foundation is not in format drift.
