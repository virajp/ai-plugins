# Container image — health & reachability

## The readiness endpoint is the contract

Every deployed project exposes the readiness endpoint vwf's `health` harness
capability requires, and the host's probes point at it. This is the same
endpoint the acceptance verifier uses, which is what keeps one definition of
"ready" across local runs, staging and production.

Readiness means **this instance can serve a request now** — its
configuration loaded, its dependencies reachable. It is not "the process
started".

## Liveness and readiness answer different questions

Where the host offers both, do not point them at the same handler:

- **Readiness** gates traffic. Failing it removes the instance from
  rotation, which is the correct response to a dependency being briefly
  unavailable.
- **Liveness** gates the process. Failing it restarts the container, which
  is the correct response to a wedged process and the *wrong* response to a
  dependency outage — a restart loop across every instance turns a
  degradation into an outage.

A readiness check that reaches a downstream dependency is usually right. A
liveness check that does is usually a mistake.

## A private project is private at the infrastructure layer

A project that must not be publicly reachable is kept off the public network
by the infrastructure — a private network, an ingress allowlist, or a mesh
policy — rather than by application auth alone.

Application auth is a control that can be misconfigured by a code change; an
unreachable network address cannot be. Use both, and treat the network
control as the one that has to hold.

This is also the boundary where a separate private-access plane belongs, if
the product has one. It is a deploy-time and network-time decision, not
something the image knows about.

## Shutdown is part of readiness

On a termination signal, stop reporting ready, drain in-flight work, then
exit. A container that exits immediately on the signal drops the requests it
was serving, and the host has no way to know that happened.
