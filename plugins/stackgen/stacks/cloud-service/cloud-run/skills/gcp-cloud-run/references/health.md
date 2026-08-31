# Health — Cloud Run

Every deployed project exposes the readiness endpoint vwf's `health` harness
capability requires, and the platform's startup and liveness probes point at it.
The endpoint's path is the product's — recorded in the blueprint — and this
component fixes no task name.

## Three probes, three different questions

Configuring one as another is the most common cause of a service that restarts
under load, so the distinction is worth being precise about:

- **Startup** — "has initialization finished?" It runs first and suppresses the
  others until it passes, which is what gives a slow-starting process room
  without forcing a long liveness timeout forever.
- **Readiness** — "should this instance receive traffic *now*?" A failure removes
  the instance from rotation; it does not restart it.
- **Liveness** — "is this process unrecoverable?" A failure restarts it.

## What the readiness endpoint checks

**Its own ability to serve, and nothing more.** The instinct to check every
dependency from the readiness endpoint is the trap: a datastore blip then marks
every instance unready simultaneously, the platform removes them all from
rotation, and a degraded dependency becomes a total outage. A dependency check
belongs in a separate diagnostic endpoint that reports rather than gates.

The endpoint is cheap, unauthenticated at the platform's discretion, and does
not touch the datastore on every call — it is polled continuously, so anything
it does is on the hot path forever.

## What liveness must never check

A dependency. A restart cannot fix a datastore outage, and a liveness probe that
checks one converts an external failure into a restart loop that makes recovery
harder. Liveness answers a question about *this process*: is it deadlocked, is
its event loop wedged, has it lost the ability to respond at all.

## The interaction with scale-to-zero

An instance that has scaled to zero is not unhealthy — there is nothing to
probe. Alerting must be built on request-level signals (error rate, latency,
saturation), not on instance health, or a healthy idle service reads as an
outage and a genuinely broken one reads as nothing at all.
