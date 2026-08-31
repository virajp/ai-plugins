# Health — GKE

Every deployed project exposes the readiness endpoint vwf's `health` harness
capability requires, and the pod's probes point at it. The endpoint's path is
the product's — recorded in the blueprint — and this component fixes no task
name.

## Readiness gates traffic; liveness restarts

**Configuring one as the other is the most common cause of restart loops under
load**, and it is worth being precise about why. Under load a service gets
slower. A readiness failure removes that pod from the load balancer, which sheds
its share of traffic and lets it recover. A liveness failure kills it — so the
remaining pods take its traffic, get slower, and fail their own liveness checks.
The failure cascades, and it cascades fastest exactly when the product is busiest.

The rule: **liveness answers a question about this process alone** — is it
deadlocked, has it lost the ability to respond at all. Everything else is
readiness.

## Startup probes exist so liveness can stay tight

A slow-starting process forces a choice between a long liveness timeout, which
then applies forever, and a container killed during initialization. The startup
probe removes the choice: it suppresses the other two until initialization
completes, so liveness can be configured for a running process rather than for
the worst case at boot.

Any workload that takes meaningfully longer to start than to respond needs one.

## What the readiness endpoint checks

**Its own ability to serve, and nothing more.** Checking every dependency from
readiness is the trap: a datastore blip marks every replica unready at once, all
of them leave the load balancer, and a degraded dependency becomes a total
outage. A dependency check belongs in a separate diagnostic endpoint that
reports rather than gates.

The endpoint is cheap and does not touch the datastore on every call — probes
poll continuously, so anything it does is on the hot path forever.

## What liveness must never check

A dependency. A restart cannot fix a datastore outage, and a liveness probe that
checks one converts an external failure into a restart loop that makes recovery
harder.

## Graceful shutdown is half of readiness

A pod being terminated is removed from endpoints and sent a termination signal
at roughly the same moment, not in a guaranteed order. A process that exits
immediately on the signal drops in-flight requests. Handle it: stop accepting
new work, fail readiness, finish what is in flight, then exit — within the
termination grace period, which must be longer than the longest request the
service serves.
