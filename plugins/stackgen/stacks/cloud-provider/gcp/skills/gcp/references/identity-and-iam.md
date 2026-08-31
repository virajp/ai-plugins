# Identity & IAM — Google Cloud

Context7 has the full role catalogue and every API signature. What it cannot
tell you is **which role to grant**, why the obvious one is usually too broad,
and which identity mechanism to use in the first place. That is this file.

Each service component states the narrow grants *it* needs and cites this one;
nothing below is repeated there.

## The two rules that prevent most incidents

### 1. One service account per workload, never the default

Every project gets default service accounts, and they are granted **Editor** on
the project — near-total control. A workload running as one can read every
bucket, write every table, and modify infrastructure. It is the single most
common over-privilege here, and because it is the *default* it happens by
omission rather than by decision.

Create a dedicated service account per service, grant it only what that service
uses, and disable the defaults' automatic grants where the organization policy
allows it. When a service needs a new permission, that then shows up as an
explicit, reviewable grant — which is the entire point.

### 2. Never create a service-account key file

A downloaded key is a permanent credential with no expiry, and it ends up in a
`.env`, a CI variable, a chat message, a laptop backup. Key leakage is the most
common compromise on this provider, and it is entirely avoidable — every context
that needs an identity has a keyless mechanism:

| Context | Use |
| --- | --- |
| Any compute on this provider | **Attached service account** — the metadata server issues short-lived tokens automatically. Nothing to store. |
| The CI system | **Workload identity federation** — the workflow's OIDC token is exchanged for a short-lived provider token. No secret in the repo. |
| A developer's machine | Application-default login as the user's own identity, with the user's own permissions |
| Another cloud, or on-prem | Workload identity federation against that platform's OIDC issuer |

The client libraries resolve all of these through application default
credentials, so **the code is identical in every context**. Code that reads a
key-file path is code that will eventually run with a leaked key.

If an existing key is in play, treat rotating it out as security work with a
deadline, not as cleanup.

## Roles that are broader than they look

The instinct is to grant the role whose name matches the task. These are the
ones where that instinct over-grants badly:

| Tempting role | What it actually allows | Grant instead |
| --- | --- | --- |
| `Editor` (basic) | Modify nearly everything in the project, including IAM-adjacent settings | A predefined role scoped to the one service |
| `Owner` (basic) | Everything, including granting others access | Never for a workload. Humans only, and few. |
| Storage **admin** | Delete buckets and change their IAM — not just read and write objects | Object viewer / creator / user on the **specific bucket** |
| Datastore **owner** | Delete the database, change indexes | The data-plane read/write role |
| Service-account **user** | **Act as** that service account — an escalation path to everything it can do | Only where impersonation is the actual intent, scoped to one account |
| Secret-manager **admin** | Create, destroy and re-grant secrets | Secret **accessor** on the **specific secret** |
| Cloud SQL **admin** | Delete instances | The client role, which only connects |

Two habits sit behind that table. **Grant on the resource, not the project**,
wherever the service supports it — a role on one bucket is enormously narrower
than the same role project-wide. And **prefer predefined roles over custom
ones** until a predefined role genuinely does not exist: a custom role needs
maintaining as APIs add permissions, and a stale one fails in confusing ways.

## Security rules are not IAM

The two coexist and are constantly confused, which produces both security holes
and hours of pointless debugging.

- **Security rules** govern access by **client SDKs** — the app running on a
  user's device, authenticated as an end user. Where a service offers
  client-direct access, they are the entire access-control layer for it.
- **IAM** governs access by **server SDKs and admin credentials**. The admin SDK
  **bypasses security rules completely**, by design.

The debugging failure this causes: a rule is tightened, the server-side test
still passes because it runs as admin, and the client breaks in production. Test
rules against the **emulator with client credentials**, never through the admin
SDK.

The security hole this causes: a product assumes the rules protect it while a
server endpoint running as an over-privileged service account exposes the same
data with no equivalent check. **Every server endpoint re-authorizes**; the rules
protect only the direct client path.

## Shapes worth copying

- **Service-to-service calls** — the caller's service account is granted the
  callee's invoker role, and the callee requires authentication. No shared
  secret, no API key, no IP allowlist.
- **A service that reads one bucket and writes one topic** — two grants, both on
  the specific resources. A long grant list for one service is a signal that the
  service does too much.
- **Break-glass access** — a role granted to humans with an expiry, audited,
  rather than a standing grant. Standing production access for humans is the
  thing audit logs exist to catch.
- **CI** — one federated identity per repository, granted deploy permission on
  one environment. A CI identity that can deploy to production from any branch
  is a supply-chain risk, not a convenience.

## Reviewing for privilege

1. Does any workload run as a **default** service account?
2. Does any **key file** exist?
3. Is any **basic role** granted to a workload?
4. Is anything granted at **project level** that a resource-level grant would
   cover?
5. Can any service account **impersonate** another, and is that intended?
6. Does every server endpoint **re-authorize**, rather than trusting rules?

These six find nearly every real privilege problem, and none of them requires
reading the role catalogue — which is what Context7 is for.

**No emulator enforces IAM**, so every permission error is a production-only
error. That is why this review is run against a real environment and why the
local-development map treats IAM as an explicit fidelity gap.
