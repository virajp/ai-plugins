# Workers Static Assets — service doctrine

The service's own usage rules: what the configuration says, what the edge
does with a request, and the two choices in it that fail silently.

**There is no clause-by-clause contract satisfaction here, and that is
correct rather than missing.** The `static-hosting` category realizes no
vwf capability token today, so there is no neutral capability contract to
check this against — the taxonomy records that as a known vwf-side gap and
nothing here mints a token to fill it.

## The whole configuration

An assets-only Worker deploys with four things and nothing else: a `name`,
a `compatibility_date`, `assets.directory`, and — where the site answers on
a hostname rather than a `workers.dev` subdomain — one `routes` entry with
`custom_domain` set.

**No `main`.** That is the definition of this stack, not a default. A
Worker with a script fronting the assets is a different arrangement with
different failure modes, and `assets.binding` and `run_worker_first` only
mean anything there. Adding any of the three is leaving this pack.

**`compatibility_date` is a date, not a version, and pinning it is the
point.** It fixes the runtime behaviour this deployment was written
against, so a future runtime change cannot alter how something already
shipped behaves. Move it deliberately and read the changelog for the span
skipped; a date bumped reflexively at every deploy is the same as not
pinning one.

**The file lives at the repo root.** Wrangler discovers its configuration
by walking up from the working directory, and the only alternative is
`--config` on every invocation any caller might type. The root allowlist
admits it for exactly that reason.

## `not_found_handling` is a product decision, and both wrong answers are silent

Two modes, and picking the wrong one produces a site that looks like it
works:

| Mode | Unmatched request gets |
| --- | --- |
| `404-page` | The directory's `404.html`, **with a 404 status** |
| `single-page-application` | `index.html`, **with a 200 status** |

- **A multi-page site takes `404-page`.** The build must actually emit
  `404.html` at the directory root; without it every unknown path falls
  back to a bare edge 404 with no branding, no navigation and nothing that
  says which site it came from.
- **A client-routed application takes `single-page-application`**, because
  the router in the browser is what resolves the path and it needs the
  shell delivered first.

**Choosing `single-page-application` for a multi-page site** makes every
typo, every dead link and every removed page return 200 with the homepage.
Crawlers index the duplicates, link checkers report nothing, and the
symptom is a slow decline in search results that nobody traces back to a
config key.

**Choosing `404-page` for a client-routed app** breaks every deep link:
the browser asks for a path only the router knows about and gets a 404
before the router ever loads.

## What the edge does with a request

The request is matched against the uploaded file set. Where a match
exists, the file is served; where it does not, `not_found_handling`
decides. Nothing else runs — there is no code path of yours to instrument,
which is why [health](health.md) is answered by probing rather than by an
endpoint.

**Headers and redirects ship as files inside the asset directory**, not as
configuration in `wrangler.jsonc`. They are part of the build output and
therefore part of the artifact — [artifact](artifact.md) owns what belongs
in them and why the caching rule is the one that matters.

## The route, and the deployment that has none

A `routes` entry with `custom_domain: true` binds the Worker to a hostname
and lets wrangler manage the DNS record for it; the zone has to already be
on the same account. **A repo with no custom domain deletes the block
rather than filling it in** — the Worker is then reachable at
`<name>.<account-subdomain>.workers.dev`, which is a complete deployment
and the right shape for a preview surface or an internal tool.

Serving from a **subpath** of an existing hostname rather than a whole one
is supported and needs a `route` plus a recent enough wrangler; check the
current floor at Context7 rather than assuming, because it moved once
already.

## Credentials are never in the file

`wrangler` reads `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` from
the environment. The token's scope, and why `wrangler login` is not the
CI path, are [identity shape](identity-shape.md)'s. What matters here is
the negative rule: nothing in `wrangler.jsonc` is a secret, and a config
that would need one is a config for a different stack.

## What this component stays silent on

**How the directory came to exist.** The build is the framework's, and the
deploy task runs the project's own build task where one exists rather than
defining one — see [pipeline](pipeline.md).

**Whether the site should be publicly reachable.** Putting it behind the
account's identity-aware proxy is a second pin on the same axis, and
`cloud-service/zero-trust-access` owns that judgment.
