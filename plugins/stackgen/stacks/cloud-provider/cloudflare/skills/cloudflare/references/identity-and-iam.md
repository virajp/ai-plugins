# Cloudflare — identity & IAM

Who may change the private plane, and what automation is handed. The
least-privilege grants a **particular** service needs cite this; the shape
below is provider-wide.

## Two identity systems, and they are not the same one

Confusing them is the most common mistake here, because both are called
"access":

- **Account access** — who may log into the Cloudflare account and change
  its configuration. Roles, members, API tokens. This reference.
- **Application access** — who may reach the product through the proxy.
  Policies, groups, service tokens. That is the service component's
  subject, not this one's.

An administrator of the first is not automatically a user of the second,
and a user of the second needs no account membership at all. Granting
account access so that someone can *use* an internal tool is the failure
this distinction exists to prevent.

## The workload identity shape

**One identity per workload, never a shared one and never a human's.** The
identity a pipeline uses to publish a configuration change is not the
identity an operator uses to review it, and neither is the credential a
test run presents at the proxy.

**Account-owned API tokens, scoped, over the Global API Key.** The Global
API Key is unscoped, carries the whole account, and cannot be narrowed —
it is a credential with no least-privilege story available, so it does not
appear in a design. An account-owned token is scoped to the permissions
and resources it needs and can be revoked without touching anything else.
Prefer account-owned over user-owned: a user-owned token dies with the
user's membership, which turns an ordinary departure into an outage.

## The roles broader than they look

Grants here are **account-scoped**, so a role handed out to change one
application reaches every application in the account. Two in particular
read as interchangeable and are not:

| Role | Reaches |
| --- | --- |
| `Cloudflare Access` | Access applications, policies and Tunnels |
| `Cloudflare Zero Trust` | Administrator over **every** Zero Trust product |

`Cloudflare Access` is the grant this work needs.
`Cloudflare Zero Trust` is a different request that happens to include it,
and asking for it because the name matched is how an account acquires an
administrator nobody meant to create. `Cloudflare Zero Trust Read Only`
is the grant for anyone who needs to see the configuration and not change
it — which is most of the people who ask.

Where the blast radius genuinely must be smaller than an account, the
answer is **a separate account**, not a cleverer role. Account scope is the
floor; nothing below it is expressible.

## The privilege review

Run it whenever the team changes, and at least whenever the cost review
runs — the two read the same evidence from different angles:

1. **Every member, and the role they hold.** Anyone at
   `Super Administrator` who does not manage billing or membership is
   over-granted.
2. **Every API token, and what it is for.** A token whose purpose nobody
   can state is a token to revoke; if it was load-bearing, that surfaces
   immediately and with a known cause.
3. **Every service token, and its expiry.** Covered by the service
   component, listed here so the review is one pass rather than two.
4. **Anything holding the Global API Key.** There should be nothing.

## Keyless auth, and its honest limit

The general preference is an identity the platform asserts rather than a
secret something holds. At this provider and this scope, the credential
that reaches the proxy from automation **is** a secret — a service token's
client ID and secret pair — so it is injected as an environment variable
at the process boundary and catalogued by name, never value, in
`docs/blueprint/environment.md`, exactly as any other secret is. Claiming
a keyless story that does not exist would be worse than naming the secret
and handling it properly.
