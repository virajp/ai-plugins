# Cloudflare Zero Trust Access — conventions

A **private plane** in front of a project that must not be publicly
reachable — an operator back-office, an internal tool, a staging surface.
The project sits behind an identity-aware proxy on its own hostname, so
the admin plane is invisible to the public internet rather than merely
authenticated.

**This composes with a hosting pin rather than replacing one.** It
produces no artifact and runs no code. The project still ships however its
own hosting bundle says; this decides who can reach it once it has. That
is why it sits on the `deploy` axis carrying `artifact: n/a` beside a
hosting entry, rather than instead of one.

**The decision is per project and belongs in the registry**, because it
changes what the acceptance suite can reach. Behind it: anything whose
user population is the team, an operator group, or a named customer —
anything whose exposure has no upside. Not behind it: the product's public
surface, where an identity-aware proxy is a sign-in wall the product
already has, plus a second identity system to keep in step with the first.

**Least privilege means the policy allows a named group, not a domain.**
An email-domain rule is not authorization — every new hire and every
departed one is silently in scope. Access is denied by default; every
additional way in is a rule someone has to remember exists, which is the
argument for keeping the count at the smallest number that works and
knowing what each one is for.

**The application's own authorization is unchanged and still runs.** The
proxy decides who reaches the door; the product still decides what they
may do. The project verifies the identity assertion the proxy passes
rather than trusting a header, because an unverified header is a forgeable
one.

**The origin must not be reachable except through the proxy.** A hostname
that answers directly is a private plane in name only, and that failure is
invisible from the outside. It is the provider's rule, not this service's
— see the `cloudflare` skill's networking and private plane reference,
which this cites and does not restate.

**Health and pre-production are the two capabilities the proxy changes.**
An uptime probe reaching the proxy measures the proxy, and a staging suite
with no credential fails at the login page and reports it as an
application error. Both have a decision to make and record; the silent
version of the first is a green dashboard in front of a dead service.

**Where the fronted project actually runs is not this component's
subject.** Zero Trust Access fronts a service; it does not host one.
Pairing this with a hosting bundle is vwf's job, and any cloud's deploy
bundle composes with it — including this provider's own
`cloudflare-workers-static`, where the proxy and the hosting land in the
same account and are still two separate pins on the axis.

Full judgment: the `zero-trust-access` skill and its references. The
provider-wide doctrine it cites is the `cloudflare` skill's.
