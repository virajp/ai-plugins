# Identity shape — Cloud Run

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference. This file states only the
grants this service needs and the one shape it makes possible.

## The service's own identity

**One service account per service, never the project default.** The default
carries Editor on the project, so a service running as it can read every bucket
and modify infrastructure. Cloud Run attaches the account you give it and the
metadata server issues short-lived tokens against it, so **nothing is stored and
no key exists**.

Grant that account only what the service actually uses, on the specific
resources — one bucket, one secret, one datastore instance — rather than
project-wide. A long grant list for one service is a signal that the service
does too much, not that the grants are wrong.

## Service-to-service calls

The shape worth copying, because it removes a whole class of credential:

- The callee **requires authentication** — it does not accept unauthenticated
  requests at all.
- The caller's service account is granted the **invoker** role on the callee,
  and only on that callee.
- The caller attaches its own identity token to the request; the platform
  verifies it before the request reaches the callee's code.

No shared secret, no API key, no IP allowlist, and nothing to rotate. A caller
losing its grant fails closed with an authorization error rather than silently
succeeding.

## Deploying

The identity that *deploys* is not the identity the service *runs as*, and
conflating them is the common mistake. The deploying identity is the CI system's
federated identity, granted deploy permission on one environment; the runtime
identity is the attached service account with none of that. If the deployer can
also read production data, the separation has been lost.

Granting the deployer the ability to **act as** the runtime service account is
required and is itself an escalation path — scope it to that one account, never
project-wide.

## Reviewing this service

1. Is it running as the **default** service account?
2. Does it accept **unauthenticated** requests, and is that intended?
3. Are its grants on **specific resources** rather than the project?
4. Does the **deploying** identity have any runtime data access it does not need?
