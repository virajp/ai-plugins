# OTel-LGTM — integration & access shape

## The collector is the design decision

Run one as a real component with a real budget, not as a sidecar afterthought.
Two things live there that can live nowhere else, and they are the reason it
exists.

**Tail sampling.** Keeping every errored and slow trace while sampling the rest
requires buffering a whole trace to decide — which no individual service can do,
because no service sees the whole trace. Head sampling, decided at the first
span, throws away the errors you most wanted. Tail sampling is the reason to
have a collector.

**Redaction.** PII that reaches storage is a retention problem forever: it is in
backups, in replicas, and subject to whatever deletion obligation applies. A
processor that drops it at the collector is the only place it is cheap. Every
other place is an incident response.

## The collector's own failure

**This is the failure everyone forgets to test.** The collector is a single
point through which all telemetry flows; when it dies, the product is healthy
and blind, which looks exactly like quiet.

Give it health checks, capacity, and an alert of its own — and make sure that
alert does not depend on the pipeline it is monitoring, which is the classic
way this goes wrong.

## Where the boundary sits

The product's boundary is **one endpoint and one protocol**. Services know the
collector's address and speak OTLP. They do not know what backs it, how many
backends there are, or whether the destination changed last week.

Keeping the boundary there is what keeps the sink replaceable, and it is worth
defending in review: a service that knows a backend's name has punched through
it.

## Credentials

**Env-injected, names-not-values, catalogued in
`docs/blueprint/environment.md`.** Nothing read from a committed file.

**On a private network the endpoint may need no credential at all — say so
explicitly rather than leaving it ambiguous.** "No credential" and "credential
we forgot to configure" look identical in a config file and very different in a
threat model. An explicit statement that the network boundary is the control is
a decision; silence is an accident waiting to be discovered.
