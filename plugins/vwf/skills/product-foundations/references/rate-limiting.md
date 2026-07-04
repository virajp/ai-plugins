# Rate Limiting

HTTP-level protection with **endpoint classes and a uniform 429 contract** —
distinct from domain caps (a business rule like "N requests per user per week"
belongs to its entity, not here). Cross-cutting token:
`rate_limiting: endpoint-classes`.

## Default contract

- **Three endpoint classes**, each with a limit the product tunes:
  - **auth/abuse-sensitive** (sign-in, token, account recovery, anything
    enumerable) — the tightest class; limits keyed per identity *and* per source
    address.
  - **expensive** (search, exports, fan-out reads, media) — moderate, keyed per
    identity.
  - **default** (everything else) — a generous ceiling that only trips on abuse,
    keyed per identity (per source address when unauthenticated).
- **Uniform denial contract**: `429` with the product's coded error envelope and
  a `Retry-After` header; the app treats it as a back-off signal, never an error
  dialog loop.
- **Enforced centrally** in the API project's middleware (one place, per-class
  configuration) — never per-handler ad hoc. The console (private, behind a
  zero-trust perimeter) may run laxer limits but is not exempt on
  abuse-sensitive routes.
- **Limits are runtime-tunable where operationally useful** — the class limits
  may live in the runtime-settings document so an operator can tighten under
  attack without a deploy.
- **Observable**: throttled requests are counted (a `429` metric per class) so
  tuning is data-driven.
- **Domain caps stay domain**: entity-level quotas (invites per day, requests
  per week) are blueprint contract rows on the entity with their own coded
  errors — the limiter here never substitutes for them.

## Elicit per product

- Which routes fall in the auth/expensive classes (walk the API surfaces), the
  three class limits, and the unauthenticated keying (address-based) policy.
- The store: in-memory per instance is acceptable for a single-region service
  (stated as such); elicit a shared store only when horizontal scale makes
  per-instance limits meaningless for the product.

## Blueprint expansion

- `conventions.md#rate-limiting` holds the classes, limits, keying, and the 429
  contract; entity API tables note the class only when non-default. Realization:
  the middleware placement in the `service` reference-stack doc.
