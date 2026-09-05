# Decision — Workers Static Assets redeems the Cloudflare reservation

**Date** 2026-09-05 · **Branch** `2026-09-05-cloudflare-workers-static` ·
**Plan** `docs/plans/2026-09-05-cloudflare-workers-static/` · **Reverses**, for
one service only, the Cloudflare scope reservation written into
`stacks/bundles/cloudflare-zero-trust.md` and
`stacks/cloud-provider/cloudflare/conventions.md` when the zero-trust pack
arrived.

## What was decided before

The Cloudflare coverage was parked at Zero Trust Access, and both files said so
in almost the same words. The bundle:

> Workers, Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream are
> planned under their own effort and are **not** offered here.

The provider's conventions went further — *"This provider component exists to
support **Zero Trust Access** and nothing else"* — and drew the conclusion that
**Cloudflare is not where the product runs**: at the scope offered, it fronted
something running elsewhere.

The reservation was deliberate and it was reasoned: a menu that comes back short
without explaining itself is indistinguishable from a broken adapter, so the
shortfall was stated rather than implied.

## What changed

**One service leaves the reserved list.** Workers Static Assets is offered, as
the bundle `cloudflare-workers-static` — `cloud-provider/cloudflare@0.1.0`
composed with a new `cloud-service/workers-static-assets@0.1.0` pack, in exactly
the shape `cloudflare-zero-trust` established. The pack ships judgment for an
**assets-only** Worker (no `main` script), a root `wrangler.jsonc` with marked
positions for the project name and the route, and a `p/<id>/deploy` overlay that
runs `wrangler deploy`.

**A new `cloud-service` category, `static-hosting`**, carries the same
three-topic extension `compute` does — artifact, pipeline, health — because a
deploy stack has to say what it publishes, how it gets there and how you know it
is up whether or not a container is involved. `kinds.md`'s extension is renamed
from "Compute-category extension" to "**Deploy-target extension**" to say that
plainly, and its reviewer clause fences the category: a `static-hosting` service
whose artifact is anything but a directory of files, or that ships a server-side
script fronting them, is a gap.

**Everything else stays reserved, by name.** Pages, R2, D1, KV, Durable Objects,
Queues, Images and Stream — and, newly named, **a Worker script fronting the
assets** (SSR on Workers), which is its own pack under its own effort. The
reservation prose is narrowed, not deleted: the reasoning that made it worth
writing still holds for the eight services it still covers.

**The provider's "not where the product runs" reading is corrected**, since one
of its services now is.

## The two doctrine widenings that rode with it

Both were confirmed by the user rather than assumed.

1. **`wrangler.jsonc` joins the root allowlist.** Wrangler discovers its config
   only at the repo root. *Rejected:* `.config/wrangler.jsonc` with `--config`
   on every invocation — the D17 dprint precedent — because a flag every caller
   has to remember is worse than one allowlisted root file; and documenting the
   file without shipping it, which is the "prerequisite nobody supplies" failure
   the charter-fence decision already named. Recorded as a dated addendum on
   [`2026-09-05-charter-fence-opens-for-gate-configs.md`](./2026-09-05-charter-fence-opens-for-gate-configs.md).
2. **`cloud-provider` and `cloud-service` components compose last**, after
   `capability-provider`. A deploy target's config is the most specific thing a
   repo pins, so nothing may overwrite it. *Rejected:* placing them before
   `capability-provider`, and leaving the order undefined. The secrets overlay
   still outranks every language and framework pack for the reason it always did
   — it is simply no longer last. The two types were absent from the order until
   now for a plain reason rather than an oversight: no cloud pack shipped a
   `config/` tree, so there was nothing of theirs to compose.

## Why

The first greenfield `/vwf:init` run on a real repo (`virajp.dev`, 2026-09-05)
completed clean and then halted one command later. `/vwf:architecture`'s deploy
round requires a `site` project to pin at least one deploy slug, and **nothing
on the axis had a directory of files as its artifact** — the offer was
`container-generic`, generate, or defer. A repo whose whole deployment is a
build output directory had no answer on a menu that is deliberately closed, and
a closed menu with no answer is the one failure mode the reservation's own
reasoning was written to avoid.

The user's ruling settled the shape: Cloudflare has many services and stackgen
covers them **per service**, so this is one new service pack beside
`zero-trust-access`, not an extension of that bundle and not a `deploy-target`
pack — `kinds.md` fences a cloud's targets out of `deploy-target`. Static assets
now; SSR later, as its own pack.

This repo's own site is the prior art the pack generalizes:
`site/wrangler.jsonc` has been an assets-only Worker with a `404-page` fallback
and a custom-domain route since
[`2026-09-05-website-on-workers-static-assets.md`](./2026-09-05-website-on-workers-static-assets.md).
The doctrine that was already true for one repo became a pack.
