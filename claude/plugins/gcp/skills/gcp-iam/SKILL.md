---
name: gcp-iam
description: Least-privilege identity on Google Cloud — the service-account
  shape
  per workload, why keyless beats JSON keys, the roles that are quietly
  over-broad, and how Firebase security rules relate to IAM. Use when wiring
  service auth, granting access, or reviewing a design for privilege.
disable-model-invocation: false
model: opus
effort: high
---

# Identity and access on Google Cloud

Context7 has the full role catalogue and every API signature. What it cannot
tell you is **which role to grant**, why the obvious one is usually too broad,
and which identity mechanism to use in the first place. That is this document.

## The two rules that prevent most incidents

**1. One service account per workload, never the default.**

Every project gets default service accounts, and they are granted **Editor** on
the project — near-total control. A workload running as the default can read
every bucket, write every table, and modify infrastructure. It is the single
most common over-privilege in real GCP projects, and it is the default, so it
happens by omission rather than decision.

Create a dedicated service account per service, grant it only what that service
uses, and disable the defaults' automatic grants where the organization policy
allows it. When a service needs a new permission, that shows up as an explicit,
reviewable grant — which is the entire point.

**2. Never create a service-account JSON key.**

A downloaded key is a permanent credential with no expiry, and it ends up in a
`.env`, a CI variable, a Slack message, a laptop backup. Key leakage is the most
common GCP compromise, and it is entirely avoidable — every context that needs
an identity has a keyless mechanism:

| Context                         | Use                                                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Cloud Run, GKE, any GCP compute | **Attached service account** — the metadata server issues short-lived tokens automatically. Nothing to store.                 |
| GitHub Actions                  | **Workload Identity Federation** — the workflow's OIDC token is exchanged for a short-lived GCP token. No secret in the repo. |
| A developer's machine           | `gcloud auth application-default login` — the user's own identity, with the user's own permissions                            |
| Another cloud, on-prem          | Workload Identity Federation with that platform's OIDC issuer                                                                 |

The client libraries resolve all of these through Application Default
Credentials, so **the code is identical in every context**. Code that reads a
key file path is code that will eventually run with a leaked key.

If an existing key is in play, treat rotating it out as security work with a
deadline, not cleanup.

## Roles that are broader than they look

The instinct is to grant the role whose name matches the task. These are the
ones where that instinct over-grants badly:

| Tempting role                  | What it actually allows                                                      | Grant instead                                                                    |
| ------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `Editor` (basic)               | Modify nearly everything in the project, including IAM-adjacent settings     | A predefined role scoped to the one service                                      |
| `Owner` (basic)                | Everything, including granting others access                                 | Never for a workload. Humans only, and few.                                      |
| `roles/storage.admin`          | Delete buckets, change IAM on them — not just read/write objects             | `objectViewer` / `objectCreator` / `objectUser` on the **specific bucket**       |
| `roles/datastore.owner`        | Delete the database, change indexes                                          | `datastore.user` for read/write data                                             |
| `roles/iam.serviceAccountUser` | **Act as** that service account — an escalation path to everything it can do | Grant only where impersonation is the actual intent, and scope it to one account |
| `roles/secretmanager.admin`    | Create, destroy, and re-grant secrets                                        | `secretAccessor` on the **specific secret**                                      |
| `roles/cloudsql.admin`         | Delete instances                                                             | `cloudsql.client` to connect                                                     |

Two habits behind the table: **grant on the resource, not the project**,
wherever the service supports it — a role on one bucket is enormously narrower
than the same role project-wide. And **prefer predefined roles over custom
ones** until a predefined role genuinely does not exist; custom roles need
maintaining as APIs add permissions, and a stale custom role fails in confusing
ways.

## Firebase security rules are not IAM

They coexist and are constantly confused, which produces both security holes and
hours of pointless debugging:

- **Security rules** govern access by **client SDKs** — the app running on a
  user's device, authenticated as an end user. They are the entire access
  control layer for direct client access.
- **IAM** governs access by **server SDKs and admin credentials**. The Admin SDK
  **bypasses security rules completely**, by design.

The failure this causes: a rule is tightened, the server-side test still passes
because it runs as admin, and the client breaks in production. Test rules
against the **emulator with client credentials**, never through the Admin SDK.

The security hole this causes: a product assumes "the rules protect it" while a
Cloud Function running as an over-privileged service account exposes the same
data through an endpoint with no equivalent check. **Every server endpoint
re-authorizes**; the rules protect only the direct client path.

## Shapes worth copying

- **Service-to-service calls** — the caller's service account is granted
  `run.invoker` on the callee, and the callee requires authentication. No shared
  secret, no API key, no allowlist of IPs.
- **A service that reads one bucket and writes one topic** — two grants, both on
  the specific resources. If the list of grants for a service is long, that is a
  signal the service does too much.
- **Break-glass access** — a role granted to humans with an expiry, audited, not
  a standing grant. Standing production access to humans is the thing audit logs
  exist to catch.
- **CI** — one federated identity per repository, granted deploy permissions on
  one environment. A CI identity that can deploy to production from any branch
  is a supply-chain risk, not a convenience.

## Reviewing for privilege

1. Does any workload run as a **default** service account?
2. Does any **JSON key** exist?
3. Is any **basic role** (`Owner`/`Editor`/`Viewer`) granted to a workload?
4. Is anything granted at **project level** that a resource-level grant would
   cover?
5. Can any service account **impersonate** another, and is that intended?
6. Does every server endpoint **re-authorize**, rather than trusting rules?

These six find nearly every real privilege problem, and none of them requires
reading the role catalogue — which is what Context7 is for.
