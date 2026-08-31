# Identity shape — GKE

The provider's identity doctrine — one service account per workload, no key
files, the roles that are broader than they look, the six-question privilege
review — is the `gcp` skill's identity reference. This file states only how a
pod gets an identity here, and the one mistake that makes the cluster the weak
link.

## Workload identity federation, and nothing else

A Kubernetes service account is **bound** to a cloud service account, so pods
running under it receive short-lived credentials from the metadata server. There
is no key material in the cluster and nothing to rotate.

**Never mount a service-account key file as a cluster secret.** A cluster secret
is base64, not encryption; it sits in cluster state that more identities can
read than most teams realize, and the credential inside it never expires. This
is the single worst identity mistake available on this platform, and it is the
one a tutorial written for another context will suggest.

## One cloud identity per workload

Not one per cluster and not one per namespace. The binding is per Kubernetes
service account, so the granularity is available for free — take it. A workload
that needs a new permission then shows up as an explicit grant on its own
identity rather than as a widening of something shared.

The default Kubernetes service account in a namespace is the trap that mirrors
the provider's default-service-account trap: a pod that names no service account
gets it, so a pod nobody thought about runs as whatever that default is bound
to. Bind it to nothing, and make every workload name its own.

## Two access-control systems, both in play

Kubernetes RBAC governs what an identity can do **to the cluster**; cloud IAM
governs what it can do **to cloud resources**. They are unrelated, and a grant in
one says nothing about the other.

The practical rule: a human or CI identity with cluster-admin RBAC can schedule a
pod under any service account in the cluster, and therefore holds every cloud
permission any of those accounts holds. Cluster-admin is a cloud-level privilege
wearing a Kubernetes name — grant it accordingly.

## Deploying

The deploying identity is the CI system's federated identity, granted permission
to apply manifests to one environment's cluster and nothing more. It is not the
identity workloads run as, and per the paragraph above, giving it broad RBAC
gives it everything the workloads can reach.

## Reviewing this cluster

1. Does any pod run under the namespace **default** service account?
2. Does any **key file** exist as a cluster secret?
3. Is any workload's cloud identity shared with another workload?
4. Who holds **cluster-admin**, and is that grant understood as a cloud-wide one?
