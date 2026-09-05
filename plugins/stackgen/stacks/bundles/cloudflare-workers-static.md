---
name: Cloudflare Workers Static Assets
axis: deploy
kind: cloud-provider
components:
- cloud-provider/cloudflare@0.1.0
- cloud-service/workers-static-assets@0.1.0
artifact: static-assets
---

# Deploy — Cloudflare Workers Static Assets

A **built directory of files served from the edge**: a site, a docs build,
a single-page app — anything whose whole deployable is what a build step
left on disk. The Worker carries no script at all; the platform serves the
directory, and the deploy is the upload of that directory under one Worker
name.

**The composition is the provider plus one service**, which is what a
Cloud-Bundle is. The provider component carries what spans services — the
account and role model, the token scoping rule, what does and does not
exist locally. The service component carries this one service and **cites**
that rule rather than restating it.

## What this bundle decides that no component decides alone

**The artifact is a directory of files, and there is no promotion by
digest.** A container bundle ships an image it can move from staging to
production untouched; this one has no such handle — the upload is the
release. So the guarantee has to come from the build instead: the same
commit must produce the same directory, which makes a **reproducible
build** this pipeline's real job rather than a nicety. One Worker name per
environment, each fed its own build of the same commit.

**The release runs behind `p:<project>:deploy`, and this bundle ships no
workflow.** The task is the only thing that knows a Cloudflare Worker is on
the other end, which is what keeps the target swappable; the CI system
pinned on the project's `cicd` axis decides what fires it, behind
`assets/contracts/release-trigger.md`. Naming the task and writing the
workflow are different jobs, and only the first one is stackgen's.

**Credentials arrive from the environment, never from the config file.**
`wrangler.jsonc` is committed and describes the deployment; the account and
the token that authorize it come from the secrets provider at deploy time.
A config file that carries either is a config file that cannot be read in
review.

**A Worker script fronting these assets is not here.** No `main`, no
`run_worker_first`, no assets binding — the moment code runs in front of
the directory, the deployable stops being a directory and the reproducible
build stops being the whole story. That is a separate service pack under
its own effort, and until it exists, a product that needs server-side
rendering on Workers has a gap to name rather than a gap to fill from
general Cloudflare knowledge. So are Pages, R2, D1, KV, Durable Objects,
Queues, Images and Stream.

**The seam with [Cloudflare Zero Trust Access](cloudflare-zero-trust.md).**
That bundle produces no artifact and "composes with a hosting pin rather
than replacing one" — this is a hosting pin it composes with. A `site` that
must not be publicly reachable pins **both**: this one decides how the
files get served, that one decides who is allowed to reach them. Since
`config_format` 16 made `deploy_template` a list, pinning two is
representable, and pairing them is vwf's job.

Full judgment: the components' own skills and their references.
