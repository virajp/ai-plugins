# Zero Trust Access — pick & trade

## What it is for

Putting a project that must not be publicly reachable behind an
identity-aware proxy on its own hostname, so it is **invisible to the
internet rather than merely authenticated** — whichever cloud actually
hosts it.

It composes with a hosting pin rather than replacing one. It produces no
artifact and runs no code: the project still ships however its own hosting
bundle says, and this decides who can reach it once it has.

## When a project belongs behind it

Anything whose user population is **the team, an operator group, or a
named customer**. Anything whose exposure has no upside:

- An operator back-office or admin surface.
- An internal API with no third-party consumer.
- A metrics or observability UI.
- A pre-production environment of anything.

The common thread is that the population is enumerable and the exposure
buys nothing. Where both hold, the proxy removes the entire
request-handling path from the public internet for the cost of a seat per
person, which is a very good trade.

## When it is not the answer

- **The product's public surface.** An identity-aware proxy in front of a
  consumer app is a sign-in wall the product already has, plus a second
  identity system to keep in step with the first. Every user is now a seat
  and every sign-up is a provisioning step in two systems.
- **A machine-to-machine API with many independent callers.** Each one
  needs a credential issued and rotated here as well as in the product.
  One or two automations are fine; a caller population that grows on its
  own is the shape this stops fitting.
- **Nothing to front.** A project with no deployed environment — a
  library, a CLI, a client-distributed app — has no origin to make
  private.

## The trade, stated plainly

**What it buys:** the attack surface from the public internet becomes the
proxy rather than the application. The project's own authorization is
unchanged and still runs; this is a layer in front, not a replacement for
it.

**What it costs:**

- **A seat per person allowed through**, so the bill tracks the org chart
  rather than the traffic — see [cost shape](cost-shape.md).
- **A second place authorization is decided.** The group the policy allows
  and the roles the application enforces must agree, and nothing keeps
  them agreeing automatically.
- **Two verification surfaces that must be checked deliberately** — that
  the origin really is unreachable directly, and that the project really
  verifies the assertion rather than trusting the header. Both fail
  invisibly.
- **Local development loses the layer entirely.** The private plane cannot
  be exercised on a laptop, so it is verified in a deployed environment or
  not at all — see [local dev](local-dev.md).

## The decision is per project

It belongs in the registry, because it changes **what the acceptance suite
can reach**. A project moved behind the proxy without the suite being
given a credential does not fail informatively; it fails at a login page
and reports it as an application error.

## What choosing it does not decide

**Where the fronted project runs.** Zero Trust Access fronts a service; it
does not host one. The hosting pin is a separate decision on the same axis
— another cloud's, or this provider's own `cloudflare-workers-static` when
what is being fronted is a static site — and pairing the two is vwf's job.
Same account or not, they stay two pins.
