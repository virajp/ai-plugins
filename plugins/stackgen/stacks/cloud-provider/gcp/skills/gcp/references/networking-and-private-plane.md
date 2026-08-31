# Networking & private plane — Google Cloud

**Provider-wide by ruling.** Both compute services in this bundle need a private
plane and the mechanisms overlap heavily, so it is written once here and cited
from each rather than restated twice — which is how the two would drift apart.

## The bar: invisible, not merely authenticated

A surface that must not be publicly reachable — an operator back-office, an
internal admin plane, a service only other services call — is kept off the
public internet **at the infrastructure layer**. Application auth is the second
lock, never the only one.

The difference is not pedantry. An authenticated-only surface is still
reachable, so it is still scanned, still enumerable, still exposed to whatever
the auth layer gets wrong. An unreachable one is not, and no application bug can
change that.

State which of the two a project gets in the blueprint, per project. A product
where every surface is public is a legitimate answer; a product where nobody
decided is not.

## The mechanisms, and when each is the answer

| Want | Take |
| --- | --- |
| A request-scoped service only other services call | **Internal ingress** — the service accepts traffic only from inside the network, and callers authenticate as themselves |
| A human-facing internal tool | An identity-aware proxy in front, so the identity check happens before the request reaches the service at all |
| A pod-scheduled workload with no public surface | A **private cluster** — nodes without public addresses — exposed through an internal load balancer |
| A public surface that needs a WAF, a custom domain, or multi-backend routing | An external load balancer with the provider's WAF in front |
| Egress from a serverless service to a private backend | A serverless VPC connector, or the equivalent direct-egress setting |
| A managed datastore that should have no public address at all | Private IP plus the private-service-access path, so no public endpoint exists to allowlist |

**Prefer removing the address over allowlisting it.** An allowlist is a list
someone maintains; a resource with no public address needs no maintenance and
fails closed.

## Two defaults that are rarely what anyone intends

- **Pod-to-pod traffic is allow-all** until a network policy says otherwise. On
  a private cluster this is the gap that turns one compromised workload into
  every workload.
- **A managed datastore created with a public address keeps it.** Adding a
  private path later does not remove the public one; that is a separate,
  easily-forgotten act.

## Where this touches the bill

Cross-region traffic between your **own** services is billable egress;
same-region is not. So the network layout is a cost decision as well as a
security one: co-locate services that talk to each other, and put the datastore
in the region of the service that reads it most. An external load balancer is a
standing charge, which is the reason a request-scoped service's built-in URL is
worth keeping until a custom domain or a WAF is genuinely needed. The full
picture is in [Cost doctrine](cost-doctrine.md).

## What this file does not decide

Address ranges, subnet layout and peering topology are infrastructure-as-code
decisions for the project that owns them, not doctrine. This file states which
mechanism answers which requirement; the wiring is written where the
infrastructure lives.
