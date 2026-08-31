# Service doctrine — GKE

This component realizes no blueprint capability — it is where the product runs,
not something the product uses — so there is no capability contract to satisfy
clause by clause. What it owes is the deploy-side half of vwf's
delivery-pipeline contract, which [Pipeline](pipeline.md) covers, and the rules
below.

## Resource requests are a design decision, not a hint

On Autopilot the request **is** the allocation and **is** the bill. This inverts
the habit most manifests are written with, where requests are a scheduling hint
and limits are the real constraint.

Right-size requests against observed usage, and **revisit after the first week
of real traffic** — that is the first point at which there is evidence rather
than a guess. Copied manifests are the common failure: example manifests are
sized for examples, and the workload runs perfectly well while costing
multiples.

## Manifests live in the repo, rendered per environment

Versioned alongside the code they deploy, rendered per environment by the
release task rather than maintained as three divergent copies. A manifest that
exists only in the cluster is a change nobody reviewed and nobody can reproduce.

Keep the per-environment difference to values — replica counts, resource sizes,
the image digest, configuration references. A structural difference between
environments means staging is not testing what production runs.

## Configuration and secrets

Configuration reaches pods as environment variables or mounted files, sourced
from the platform's secret manager rather than from cluster-native secrets where
the choice exists — cluster secrets are base64, not encryption, and they sit in
cluster state that more identities can read than most teams realize.

**Nothing environment-specific is baked into the image**, which is the
precondition for promoting one digest across environments.

## Network policy is not optional

Pod-to-pod traffic is **allow-all** until a policy says otherwise. On a private
cluster that default is what turns one compromised workload into every workload.
Write policy per namespace, default-deny, and open the paths the product
actually uses.

The private plane itself — a private cluster, an internal load balancer, an
identity-aware proxy or a WAF where public access is genuinely required — is the
provider's subject: see the `gcp` skill's networking reference.

## Statefulness is the reason you are here, so be explicit about it

If nothing in the product is stateful, the pick was wrong. If something is,
state where its data lives: a managed datastore outside the cluster is almost
always the right answer, and in-cluster persistence is a decision that carries
backup, restore and upgrade obligations the managed service already discharges.
