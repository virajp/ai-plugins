# Health — Workers Static Assets

**There is no readiness endpoint here, and writing one would be a
mistake.** vwf's `health` harness capability asks how "is it up?" is
answered; for a static host the honest answer is an HTTP probe of the
deployed origin, because there is no process of yours to be unhealthy.
The platform either serves the file set or it does not.

The `harness.health` task is therefore `n/a`. This component fixes no task
name and ships no probe — what it fixes is **what the probe must ask**.

## Two probes, and the second is the one worth having

1. **`GET /` returns 200** and the body is the built entry document. This
   is the obvious one and it catches the obvious failures: a deploy that
   never landed, a route that points at nothing, an expired certificate.
2. **`GET` a path that certainly does not exist returns 404.** Use
   something no build will ever emit. This is the probe that earns its
   keep, because it is the only automated check that
   `not_found_handling` actually landed.

The second matters because of how the wrong configuration fails. A site
configured `single-page-application` when it should be `404-page` returns
**200 with the homepage** for every unknown path — see
[service doctrine](service-doctrine.md). The first probe passes.
Everything looks correct in a browser. What degrades is search indexing
and every link check, slowly, and nothing in the deploy pipeline ever
reported it.

## Why a health endpoint in the build is worse than no endpoint

The instinct is to have the build emit `/health` returning a fixed string.
It proves nothing the first probe does not, because a static file cannot
be stale in the way a process can — if `/health` is being served, `/` is
being served from the same upload. It also has to be excluded from the
site's own routing, its sitemap and its link checks, so it is a
maintenance cost with no diagnostic value.

The exception is a build stamp: a file naming the commit the release was
built from. That is genuinely useful — it answers "which release is live?"
rather than "is it live?" — and it is a different question from health.
Ship it if the product wants it, and do not call it a health check.

## What health cannot tell you here

- **Whether the assets are correct.** A successful upload of a broken
  build is a successful upload. Correctness is the acceptance suite's,
  running against a deployed URL — see [pipeline](pipeline.md).
- **Whether the cache headers are right.** A probe fetches once and sees
  a fresh response, which is exactly the case where a bad caching split
  looks fine — see [artifact](artifact.md).
- **Whether one region is broken.** A probe runs from wherever it runs.
  Edge-local failures are not visible from a single vantage point, and
  chasing them with more probes has poor returns.

## Alerting is built on request signals, not on instance health

There are no instances. Availability is measured as the error rate and
latency of real requests, which the platform's own analytics report;
building an alert on anything instance-shaped produces a metric that is
either always green or meaningless. That is the same conclusion the
compute side reaches about scale-to-zero, arrived at from the other
direction: there is nothing to probe between requests.
