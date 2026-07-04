# Data Retention & PII

**Delete by default; retain narrowly, pseudonymised, with a named legal basis.**
Cross-cutting token: `data-retention: gdpr-dpdpa` (adapt the statute set to the
product's jurisdictions).

## Default contract

- **Permanent deletion is real**: when an account is removed (after the
  soft-delete grace period — see the users reference), all raw personal data
  (name, email, phone, photos, precise location history) is purged by a durable
  workflow. No raw PII survives deletion.
- **Retained categories are an explicit table**: each row names *what* is kept
  (pseudonymised — hashed identifiers unless the control demands the raw id),
  the *retention period* (measured from permanent deletion), and the *legal
  basis* (e.g. GDPR Art. 17(3)(e) / DPDPA S.8(7) legal-claims exception;
  tax-compliance periods for payment records; legitimate-interest for
  abuse-prevention caps). A category without a basis and a period doesn't get
  retained.
- **Raw-id exception, justified per row**: an abuse-prevention control that must
  recognise a returning identity may key on the raw UID (hashing would defeat
  the control) — the table says so explicitly.
- **Compliance-only access**: retained post-deletion data is visible and
  actionable only to the compliance operator role. Purges are **manual,
  compliance-triggered** from the console (the system lists records past their
  retention date; concurrent purge triggers are no-ops) — never a silent
  automatic sweep.
- **User rights are part of the contract**: right-of-access (before deletion
  only; auto-closed on deletion), right-to-object (case-by-case, legal-claims
  data may be exempt during disputes), identity verification before any
  disclosure.
- **Breach response**: the compliance operator owns it — supervisory-authority
  notification within 72 hours, affected individuals without undue delay; the
  role is never vacant (successor before deprovisioning).
- **No PII in telemetry**: emails/names/locations never appear in spans, logs,
  metric labels, or audit-event bodies (ids only) — this discipline is
  enforceable at review time and applies from day one, before any deletion
  machinery exists.

## Elicit per product

- Jurisdictions and statute set (the token's suffix), the grace period, and the
  retained-categories table itself — walk each entity's data for what genuinely
  needs post-deletion survival; default to *nothing*.
- Which durable workflow owns deletion, and what it deliberately preserves (each
  preservation is a retained-table row, owned by the compliance purge, not the
  deletion workflow).

## Blueprint expansion

- `conventions.md#data-retention` holds the full contract incl. the table; the
  user entity's Background Jobs carries the deletion workflow; the operator area
  carries the retention-management surface (compliance-only). Audit and
  retention interlock: moderation history is a retained category; purges are
  audited.
