# Least Privilege

## Definition

Every actor — user, service, process, job, token, dependency — holds the
minimum authority needed for its current task, and holds it for the minimum
time. The measure of a design is its **blast radius**: what the compromise
of this one credential, process, or package can reach. Least privilege is
the principle that keeps that answer small.

It is [YAGNI](yagni.md) applied to authority — grant for the present need,
never the anticipated one — with the opposite default under uncertainty:
capability you can add later when needed; privilege you must deny now,
because an unused grant is pure risk carried for nothing.

## Smells

- Admin/root/owner credentials used for routine operation — the deploy job
  that can delete the account, the app user that can drop the schema.
- One shared identity for many services, so nothing can be scoped, rotated,
  or attributed independently.
- Wildcard grants — all actions, all resources, all scopes — installed to
  "make it work", never revisited.
- Long-lived static secrets where short-lived, task-scoped credentials were
  available.
- Authority decided by the **claims-carry-status** trap's inverse: roles
  and permissions minted into long-lived tokens, unrevocable until expiry.
- Privilege asymmetry ignored inside the product: every operator sees
  everything; a support role that can also mutate.
- CI and third-party dependencies running with the repository's or
  machine's full authority.

## How a reviewer verifies it

- For each credential, role, or scope the diff introduces or uses, ask the
  **blast-radius question**: if this leaked tonight, what exactly can the
  holder do? Then compare against what the code actually does — the gap is
  the finding.
- Grep for wildcards and admin-tier grants in policies, manifests, and
  config the diff touches; each one needs a justification or a narrowing.
- Check separation per task: distinct identities for distinct services and
  jobs, write access only on paths that write, production reach only from
  the deploy path that needs it.
- Verify revocation exists and is honored — a grant that cannot be
  withdrawn (or a status check skipped because "the token says so") fails
  the check even if the initial scope was right.
- Confirm secrets travel per the environment contract (catalogued names,
  injected values — never committed), and that new authority is named in
  the plan, mirroring the [minimalism](../minimalism.md) consent rule for
  new dependencies.

## Application patterns

- One identity per service/job, scoped to its resources; separate read from
  write roles; separate the operator plane from the user plane.
- Prefer short-lived, task-scoped credentials issued at use over long-lived
  secrets stored beside the code.
- Grant narrow and widen on demand — the request for more authority is
  cheap; the standing excess is not. Expire elevated grants.
- Scope interfaces to capability, not identity: passing a component the one
  capability it needs (an [interface-segregation](interface-segregation.md)
  move) enforces least privilege in the type system before any policy
  engine sees it.
- Treat build and CI as production-grade actors: pinned dependencies,
  scoped tokens, no ambient credentials in test runs.

## When not to apply it

- **Break-glass must exist.** An emergency path with elevated authority is
  a requirement, not a violation — designed with its own controls (named
  holders, audit, expiry) rather than denied until an outage improvises
  one.
- Granularity has an operating cost: a thousand micro-roles nobody can
  reason about produce *worse* security than a dozen legible ones, because
  review stops happening. Scope to the boundaries someone will actually
  maintain.
- In local development, friction that pushes developers to share or export
  production credentials is counterproductive — give development its own
  fully-privileged *local* world instead of narrowing it into workarounds.
- Don't let least privilege justify obscurity (hiding information instead
  of restricting authority) — what a component may *do* is the control
  surface; what it may *know* is [information hiding](information-hiding.md)'s
  separate question.
