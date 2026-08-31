# Google Cloud — conventions

The provider half of every Google Cloud bundle: what is true across the services
rather than about any one of them. Each `cloud-service` component cites this and
does not restate it.

**The meter runs per operation, not per capacity.** The instinct from running
servers — it is provisioned, so use it freely — inverts here. A loop that reads
one record at a time is not slow-but-fine; it is the bill. Cost is decided in
the data model and the access pattern, and is nearly unfixable by tuning
afterwards. Cloud SQL is the deliberate exception and says so itself.

**Six guardrails go in on day one**, because none of them can be retrofitted
calmly during an incident: a billing budget with alerts on every project, one
project per environment so attribution is possible at all, labels on every
resource, lifecycle rules on every bucket at creation, partitioning on every
analytics table at creation, and a ceiling on every autoscaling service.

**One service account per workload, never the default.** The default accounts
carry Editor on the project, so a workload that uses one can read every bucket
and modify infrastructure — the most common over-privilege here, and it happens
by omission rather than decision.

**No service-account JSON keys.** Every context that needs an identity has a
keyless mechanism — an attached service account on GCP compute, workload
identity federation from CI or another cloud, the developer's own credentials
locally — and the client libraries resolve all of them identically, so the code
does not change between them.

**A private plane is invisible, not merely authenticated.** A surface that must
not be publicly reachable is kept off the public internet at the infrastructure
layer; application auth is the second lock, never the only one.

**Observability leaves through OTLP.** The product instruments against
OpenTelemetry and terminates in the provider's trace, metrics and logging
services as a **sink**. No vendor observability SDK enters product code — that
is what the neutral contract in `assets/contracts/observability.md` requires, and
it is the one decision here that cannot be undone cheaply.

**Emulator coverage is per service, not per provider.** Some services have a
first-class offline emulator, some have a substitute, and some have neither;
which a product gets decides whether its tests need a real project. The map is
this component's business, the consequence each service's own.

Full judgment: the `gcp` skill's references.
