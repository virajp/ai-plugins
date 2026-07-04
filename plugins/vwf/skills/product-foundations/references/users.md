# Users & Operators

Every product has **two user classes**: **customers** (the product's users) and
**operators** (the people who run it). The default contract below is the
code-independent layer; the realization (Firebase Auth, an `operators` datastore
collection) lives in the `service` and `console` reference-stack docs.

## Default contract

- **One user schema, not two.** Customers are the user entity; operators are
  **not a second user schema** — an operator is a membership record in a
  dedicated operator registry (a single collection/table), checked per request.
  Enumerating all operators is one read.
- **Two operator roles**: a **general** operator (moderation: ban/suspend users,
  groups, content) and a **compliance** sub-role (a superset — the only role
  that can view retained personal data, trigger retention purges, and own breach
  response; see the data-retention reference). At least one active compliance
  operator must exist at all times.
- **Document-based RBAC.** Roles and ownership are read from datastore documents
  per request — resource owner, membership roles, subscription tier, operator
  membership. **Identity-token custom claims are never used for RBAC**: a
  per-user claim cannot express per-resource roles.
- **Claims carry account status only.** The user lifecycle
  (`onboarding → active → banned / banned_final / to_be_deleted`, plus any
  product-specific states) lives on the user document as the system of record;
  `banned` / `to_be_deleted` are mirrored into an identity claim so a returning
  user is recognised at the identity level and receives a distinguishing coded
  response (`ACCOUNT_BANNED` / `ACCOUNT_DELETED`) the app branches on — never a
  blanket auth disable, which would make a recovery flow impossible.
- **Soft delete + identity reuse as anti-fraud.** Account deletion sets
  `to_be_deleted` (grace period) and **retains the identity record**, so the
  same UID rebinds a returning user to their history — preventing
  delete-and-recreate abuse (entitlement farming). Permanent purge follows the
  grace period via a durable workflow (see background-processes).
- **No impersonation.** Operators never act *as* a customer inside the product;
  they act *on* records from the operator console, and every such action is
  audit-recorded (see audit-logs). If store reviewers need a way in, a hidden
  review-mode test identity is the pattern — not impersonation.
- Every entity lifecycle with ≥3 states carries its state diagram (format 8
  diagram bar) — the user lifecycle always qualifies.

## Elicit per product

- The customer lifecycle beyond the baseline states (product-specific states,
  e.g. trial/subscriber tiers — a field, never a claim).
- The operator action list (what general vs compliance can do) — becomes the
  operator area's Actors & Actions table.
- Whether a resource-membership hierarchy exists (groups/teams/orgs) and its
  role enum — document-based like everything else.

## Blueprint expansion

- The **user entity** (`docs/blueprint/user/`) carries the lifecycle, statuses,
  and soft-delete semantics; the **operator area** (its own entity/page doc)
  carries the operator roles' Actors & Actions with explicit authorization per
  action. `conventions.md#auth` holds the RBAC tiers table and the
  account-status-claims contract.
