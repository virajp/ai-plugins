# Workers Static Assets — local dev

**There is a real local runtime here, and that is the unusual part.** The
provider's local development map owns the general shape — the `cloudflare`
skill — including which parts of the platform have no local existence at
all. This is what it means for this service.

## What runs locally

`wrangler dev` serves the asset directory through the **same asset routing
rules** the edge applies. That is the substitution, and it is a good one:
it is the actual routing implementation rather than a static file server
standing in for it, so the behaviours that are easy to get wrong are
exercised rather than guessed at.

What it therefore does prove:

- **`not_found_handling` is what you meant.** Request a path that does not
  exist and see which of the two answers comes back — the check that
  matters most, because both wrong answers are silent in production. See
  [service doctrine](service-doctrine.md).
- **The build actually emits `404.html`**, and everything else the routing
  depends on.
- **`_headers` and `_redirects` parse and apply.** They are build output
  and it is easy to leave them in the source tree, where the edge never
  sees them — locally that failure is visible immediately.

The `local_stack` harness answer is nonetheless **`n/a`**, and honestly so:
there is no backing engine to compose behind a readiness gate. A static
site has nothing to wait for. `wrangler dev` is the project's own dev
command, not a stack this component adds.

## What local cannot tell you

Four things, and they are where the deployed failures actually live:

- **Whether the route is right.** The custom domain, its DNS record and
  the zone it lives in do not exist on a laptop. A route pattern that
  matches nothing, or that collides with another Worker on the account, is
  invisible until a deployed environment sees it.
- **Whether TLS works.** Certificates are the edge's, and a hostname
  serving a certificate for something else is a production-only symptom.
- **Whether the caching split is right.** Locally every response is fresh
  and every request is a miss, which is exactly the case where a bad
  `Cache-Control` split looks fine — see [artifact](artifact.md). The
  failure mode is *returning* visitors, and a laptop has none.
- **Whether the credential works.** `wrangler dev` needs no token; the
  first thing that does is the deploy. See
  [identity shape](identity-shape.md).

## The build is the thing that differs, not the serving

Most local surprises on a static site are the framework's, not this
component's: a dev server that resolves paths differently from the built
output, an asset referenced by a URL that only works before hashing, a
route that exists in dev mode and is never emitted by the build.

**So the local check that is worth insisting on is serving the BUILT
directory**, not running the framework's dev server. The two are different
programs with different routing, and the built directory is the artifact —
running `wrangler dev` against it is the closest a laptop gets to the real
thing, and it costs one command.

## Nothing about the local task changes because this component is pinned

The same command runs whether or not the project deploys here, which is
what makes the substitution cheap. This component adds no local service,
no emulator process and no environment variable a developer has to hold.
