# Workers Static Assets — cost shape

The provider's cost doctrine — never write dollar figures, and run the
billing review against the same evidence as the privilege review — is the
`cloudflare` skill's, and this cites it rather than restating it.

**This service is the case that doctrine explicitly set aside.** It is
written for the account's seat-billed surface, where the bill tracks the
population allowed through and traffic growth does not move it. Hosting is
the other shape entirely: **requests, not seats**. Reading the seat
principle across to a static site gets the answer exactly backwards, and
noticing that is the point of this file.

## The bill tracks traffic

The unit is a **request served**, with the stored asset set as a much
smaller second term. So:

- **Team growth does not move the bill.** Ten more people working on the
  site cost nothing to serve. Nobody consumes a seat here; there is no
  seat.
- **Traffic growth does**, roughly linearly, and it is driven by whoever
  is on the internet rather than by anything the team decides.

This is why the two Cloudflare stacks in this taxonomy have opposite
sizing questions, and why pinning both on one project means answering
both.

## The trap: a cache miss is a billed request

The dominant lever is **how much of the traffic the browser and the edge
answer without asking for anything**, and it is decided entirely in the
build:

- **Fingerprinted assets served with a long immutable cache are
  effectively free after the first visit.** A build that emits stable
  filenames instead has given that up — every repeat visitor re-fetches
  every asset, forever, and the bill is a multiple of what it needed to
  be for no visible symptom.
- **A `single-page-application` fallback bills for the junk.** Every
  crawler probe, every scanner, every dead link returns 200 with the
  homepage rather than a cheap 404, and each one is a served request.
  That configuration mistake has a security-adjacent cost line as well as
  a correctness one — see [service doctrine](service-doctrine.md).

Both are the same trap from two directions: **cost here is a build-time
property, not a runtime setting**, so it is fixed where
[artifact](artifact.md) is decided and nowhere else.

## What is not a cost lever

- **Instance sizing.** There are none. Nothing about this deployment can
  be made smaller or larger.
- **Idle.** A site nobody visits serves nothing and costs approximately
  its stored bytes. There is no floor to pay for keeping something warm,
  which is the largest structural difference from any compute target.
- **Regions.** The file set is served from everywhere; there is no
  per-region multiplier and no decision to make about where to place it.

## The sizing question

Not "how many people work on this" but **"how many requests will the
public make, and what fraction of them can the cache answer"**. If the
honest answer to the second is "most of them", the bill for a static site
is a rounding error — which is the usual case and the reason this stack is
the default answer for anything that fits [pick & trade](pick-and-trade.md).

Where it is not the usual case — very large assets, video, a download
surface — that is a different service (object storage with a CDN in front)
and one this stack does not cover.

## Two costs that are not this service's

- **The build.** Whatever runs the build costs whatever it costs, on the
  CI system pinned on the project's `cicd` axis, and moving the build
  around does not change what serving the output costs.
- **The API the site talks to.** A static front end with a backend is two
  deploy pins, and the other one's cost doctrine owns its own bill.

Never write dollar figures. They change; the shape does not.
