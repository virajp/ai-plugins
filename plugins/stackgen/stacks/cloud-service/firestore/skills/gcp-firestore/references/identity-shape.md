# Identity shape — Firestore

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference, and its "security rules are
not IAM" section is the general statement of the seam below. This file states
what that seam means for this service specifically.

## Two access-control systems, one store

- **Security rules** govern the **client-direct path**: the app on a user's
  device, authenticated as an end user. For that path they are the entire
  access-control layer — there is nothing else between the client and the data.
- **IAM** governs the **server path**: server SDKs and admin credentials. The
  admin SDK **bypasses security rules completely**, by design.

A grant in one says nothing about the other, and that is the source of both
failure modes below.

## The debugging failure

A rule is tightened, the server-side test still passes because it runs as admin,
and the client breaks in production.

**Test rules against the emulator with client credentials**, never through the
admin SDK. Rules are logic, they are the only thing protecting the client path,
and they deserve tests of their own — including negative tests, which are the
ones that catch a rule that is accidentally permissive.

## The security hole

The product assumes the rules protect it, while a server endpoint running as an
over-privileged service account exposes the same data with no equivalent check.

**Every server endpoint re-authorizes.** The rules protect only the direct client
path, so an endpoint's authorization is its own responsibility and cannot be
delegated to the store. Where the same authorization logic is needed on both
sides, it is written twice on purpose — once as a rule and once in the services
layer — and both are tested.

## Server-side grants

The service account gets the **data-plane** role, which reads and writes
documents. It does **not** get the owner role, which can delete the database and
change indexes — the naming trap the provider's IAM reference documents.

Migrations and index deployment run as a **different** identity with those
rights, so the running application cannot destroy what it depends on.

## Writing rules that hold

- **Default deny.** Every path that is not explicitly allowed is denied, and the
  ruleset is read as a whole rather than as a list of exceptions.
- **Rules are not filters.** A rule rejects a query it cannot prove is safe
  rather than trimming the results, so a query has to be written to be provable
  — which usually means constrained by the same field the rule checks.
- **Authorize on the document, not on the request.** A client controls
  everything it sends, so a rule that trusts a value from the request payload
  authorizes nothing.
- **Rules see the token, not the database — cheaply.** A rule can read another
  document to make a decision, and that read is billed and is on the latency
  path of every check. Keep the data a rule needs in the token or on the
  document itself.

## Reviewing this store

1. Are the rules **default-deny**, and are there negative tests?
2. Does every **server endpoint** re-authorize rather than trusting the rules?
3. Does the application identity hold the **owner** role rather than the
   data-plane one?
4. Can the **running application** deploy indexes or delete the database?
