# Cloud Run · Artifact Registry — conventions

Serverless containers: scale to zero, no cluster to operate, one service per
deployable project. The default deploy target for a service or fullstack
project, and the right answer until a workload genuinely does not fit it.

**Three settings decide cost and behaviour**, and all three are design decisions
rather than tuning knobs. A warm-instance floor defeats scale-to-zero and is a
permanent charge per service per region — set it for latency-critical services
only. Concurrency is the largest lever available: raising it serves the same
traffic from fewer instances. A maximum-instance ceiling goes on **every**
service, because without one a runaway loop becomes an invoice, and in front of
a connection-limited datastore it becomes an outage.

**One image, promoted by digest.** A shared multi-stage build per repo,
parameterized by target project, pushed to Artifact Registry. The image carries
no environment-specific configuration, so the same digest is promoted from
staging to production rather than rebuilt — which is what makes the tested
artifact the released one.

**The release runs behind a mise task, never a raw provider command.** That is
what keeps the target swappable: the CI workflow calls the task. Deploys obey
vwf's delivery-pipeline contract — deliberate rather than branch-pushed, and
branch-validated. Which trigger fires the task belongs to the CI system on the
project's `cicd` axis (`assets/contracts/release-trigger.md`), and this
component defines no second pipeline of its own.

**Configuration and secrets arrive from the platform** as environment variables
and mounted secret versions. Nothing environment-specific is baked into the
image.

**One service account per service**, and service-to-service calls authenticate
with the caller's account granted the callee's invoker role — no shared secret
and no API key.

**Every deployed project exposes the readiness endpoint** vwf's `health` harness
capability requires, and the platform's startup and liveness probes point at it.

**A client-distributed project does not deploy here.** A frontend ships through
its platform's store or update channel; a CLI frontend ships to a package
registry. Record the channel in the architecture doc and pin `deploy_template`
accordingly.

Full judgment: the `gcp-cloud-run` skill's references. The provider-wide half —
cost doctrine, IAM, the emulator map, the private plane — is the `gcp` skill's.
