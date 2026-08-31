# Cloudflare — networking & the private plane

**Invisible to the internet, rather than merely authenticated.** This is
the provider-wide rule every Cloudflare service component cites; none
restates it.

## The distinction the whole arrangement rests on

An authenticated service is one anybody can reach and only some can use.
A **private plane** is one that is not reachable at all except through a
proxy that decides, before the request arrives, who is allowed to make it.
The difference is not a matter of degree:

- An authenticated service's attack surface is its entire request-handling
  path — every route, every parser, every dependency — exposed to anyone
  who can resolve its hostname.
- A private plane's attack surface, from the public internet, is the
  proxy.

The product's own authorization is unchanged and still runs either way.
The proxy decides who reaches the door; the product still decides what
they may do once inside. Neither replaces the other, and a design that
drops the second because the first exists has traded a defence for a
convenience.

## The failure that makes it decorative

**An origin that answers a direct request is a private plane in name
only.** This is the single most important sentence in this stack, and the
reason it needs stating is that the failure is **invisible from the
outside**: the proxied hostname works, the login prompt appears, the group
policy is enforced, everything looks correct — and the origin is sitting
on a second address answering anyone who finds it.

Nothing about the correct configuration distinguishes itself from the
broken one at the surface everyone looks at. So it has to be checked
deliberately, from off the network, at the origin's own address rather
than the proxied one, and re-checked whenever the hosting arrangement
changes. A green private-plane check that only ever exercised the proxied
hostname has verified the proxy.

## The two mechanisms, and which to reach for

There are two ways to arrive at an origin that cannot be reached
directly, and they are not equivalent:

1. **An outbound-only connector.** A daemon inside the network dials out
   and holds the connection; the origin needs no inbound rule, no public
   address and no open port at all. This is the strong form — there is no
   address to find because there is not one — and it is the default to
   reach for. It also composes with any hosting arrangement, including
   ones with no public networking surface to configure.
2. **Network-level restriction at the host.** The origin exists publicly
   but the hosting cloud is configured to admit only the proxy — an
   ingress allowlist, a private network, a mesh policy. This works, and
   it is sometimes the only option, but it is enforced by configuration
   in a system this stack does not own, so it drifts independently of
   everything here and is the form most worth re-checking.

**Belt and braces is not redundancy here, and is the recommendation.**
Even behind an outbound-only connector, the connector itself can be
configured to validate the proxy's identity assertion before it forwards
anything — so a request that reached it through some misconfiguration is
rejected at the network edge rather than at the application. That check is
cheap, and it is the one that catches the failure mode nobody planned for.

Whichever mechanism the product uses, the project **still verifies the
assertion itself**. An unverified header is a forgeable one, and a design
where the application trusts a header because "only the proxy can set it"
is one network change away from being wrong — silently, and in the
direction that grants access rather than denying it.

## What is deliberately not decided here

**Where the fronted project runs.** A private plane fronts a service; it
does not host one. Which hosting mechanism the project uses, and how its
network is shaped, belong to that project's own hosting pin — and any
cloud's deploy bundle composes with this one. Pairing the two is vwf's
job.
