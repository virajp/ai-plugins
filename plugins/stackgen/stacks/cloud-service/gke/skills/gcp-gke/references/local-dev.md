# Local dev — GKE

**Run the container directly**, against the backing bundle's local services. You
are testing your process, not the platform.

The provider's full emulator map, and what each service means for vwf's
`local_stack` capability, is the `gcp` skill's local-development reference. The
harness contract itself is `assets/contracts/local-stack.md`.

## Why not a local cluster

A local Kubernetes cluster reproduces **manifests**, not application behaviour,
and it costs real iteration time on every developer's machine forever. Bring one
in only when the thing under test genuinely *is* the manifest — a network policy,
an operator, an admission rule — and keep it out of the ordinary dev loop and
out of the E2E suite.

Validating manifests without a cluster covers most of what a local cluster is
reached for: schema validation and policy checks run in CI, in seconds, against
the same files the release task applies.

## What this component contributes to the local stack

**Nothing.** The local stack is the *backing* bundle's — the datastore, the
emulator suite, whatever the E2E suite actually talks to. That is the line
`assets/contracts/local-stack.md` draws between the two jobs containers do: the
local stack and the deploy artifact are unrelated, and a repo needs either, both
or neither.

## What does not reproduce locally

- **Scheduling.** Affinity, taints, eviction and resource pressure are the whole
  reason the platform was chosen, and none of them exist in a single local
  process.
- **Concurrency across replicas.** Locally there is one. Races between replicas,
  and anything assuming in-process state is shared, appear only in the cluster.
- **Network policy.** A default-deny policy that blocks a path the product needs
  fails only where the policy is enforced.
- **IAM and workload identity.** No local setup enforces either, so every
  permission error is a cluster-only error.

## Configuration parity

The process reads its configuration from environment variables in both places —
the manifest supplies them in the cluster, the dev task locally. **Never a code
branch on environment.** A branch is a production risk; an unset variable fails
loudly, which is what you want.
