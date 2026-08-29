# OCI image · any container host — conventions

A **provider-neutral** deploy target: build a standard OCI image, push it to
any registry, run it on any host that runs containers. Pick it when the
product must not be tied to one cloud, and accept the trade — the managed
features a cloud's own compute service would have supplied are yours to
build or do without.

**One shared multi-stage build file per repo**, parameterized by the target
project, not one per deployable. The divergence between per-project copies
is almost always accidental, and a base-image bump applied to three of five
services is a class of drift nothing catches until one environment breaks.

**The image carries no environment-specific configuration and no
provider-specific entrypoint or agent.** Configuration arrives as
environment variables from the host, which is what lets the **same digest**
be promoted from staging to production rather than rebuilt — and that is
what makes the tested artifact the released artifact. A rebuild per
environment breaks the guarantee quietly, while still passing every test.

**The ignore file is a correctness file**, not housekeeping. It keeps host
build state out of the image, where it would shadow the image's own install
with platform-specific binaries, and it keeps local credentials out of a
published layer.

**Registry choice and release mechanics live behind the repo's own tasks**,
so the same command runs locally and in CI. That indirection is what makes
the host swappable: the pipeline calls the task, not a provider's CLI.
Deploys obey vwf's delivery-pipeline contract, which the CI system
implements — no build service of the host's is part of this stack, so
there is exactly one place a pipeline is defined.

**Every deployed project exposes the readiness endpoint** the `health`
harness capability requires, and the host's probes point at it. A project
that must not be publicly reachable is kept off the public network at the
infrastructure layer — a private network, an ingress allowlist, a mesh
policy — rather than by application auth alone.

**A client-distributed project does not deploy here.** It ships through its
platform's store or update channel; a `cli` frontend ships to a package
registry instead.

The local stack is **not** this component's subject, even though it uses the
same runtime: that is the harness contract at
`assets/contracts/local-stack.md`.

Full judgment: the `container-image` skill's references.
