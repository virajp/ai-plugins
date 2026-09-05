# Workers Static Assets — pick & trade

## What it is for

Hosting a project whose **entire deployment is a directory of files**. The
build runs in CI, the output directory is uploaded, and the edge serves it
from every location. There is no `main`, so no code of yours runs on a
request — which is the property that makes everything below true.

Unlike the account's other stack here, this **is** where the project runs.
It produces an artifact and it is what a `site` project pins on the
`deploy` axis.

## When a project belongs here

- **A documentation site, a marketing site, a blog** — anything a static
  site generator builds ahead of time.
- **A client-rendered application** whose server side is a separate API on
  its own deploy target. The browser bundle is files; the API is not this
  stack's problem.
- **Anything already static that is currently on a virtual machine or an
  object-storage bucket with a CDN in front.** The whole arrangement
  collapses to one upload.

The common thread is that **the response for a given path is decided at
build time**. Where that holds, there is no server to size, patch, keep
warm or watch, and the deploy is an upload rather than a rollout.

## When it stops being the answer

- **Anything that must run per request.** Server-side rendering with
  request-dependent output, a session check, a form handler, an API route.
  That is a Worker with a script in front of the assets — a real and
  supported shape, and deliberately **not this pack**. Reaching for
  `main` here is the signal that the project needs the other one.
- **Personalized HTML.** If two users must get different bytes for the same
  path, no amount of asset configuration produces it.
- **A build that cannot enumerate its pages.** Content-driven routes that
  only exist once a database is read are not a static file set, however
  much the framework claims otherwise.
- **Anything needing storage or state.** The assets are immutable once
  uploaded. There is no writable surface here at all.

## The trade, stated plainly

**What it buys:**

- **No origin.** There is no server to patch, no process to restart, no
  scaling policy and no cold start of yours to reason about.
- **One artifact, one act.** The deploy is an upload of a file set, so
  what is running is exactly what the build produced, and rolling back is
  selecting a previous version rather than rebuilding an old commit.
- **Global by default**, with no CDN to configure separately from the
  origin — because there is no separate origin.

**What it costs:**

- **The dynamic escape hatch is a different stack.** The day a form needs
  a handler, the answer is a Worker script, and this pack does not cover
  it. That is a real migration, not a config flag, and it is worth
  predicting rather than discovering.
- **`not_found_handling` is a decision with a wrong answer in both
  directions** — see [service doctrine](service-doctrine.md). Getting it
  wrong is silent.
- **Caching correctness moves into the build.** With no server deciding
  headers per request, the framework's filename hashing and the header
  rules shipped alongside the files are the whole cache story — see
  [artifact](artifact.md).
- **Local development cannot see the edge.** Routing that lives in DNS or
  the route pattern is invisible on a laptop — see
  [local dev](local-dev.md).

## What choosing it does not decide

**Where the product's API runs.** A static front end and a backend service
are two projects with two deploy pins, and this one covers exactly the
first. Pairing them is vwf's job.

**Whether the site is public.** A static site can sit behind the account's
identity-aware proxy — `cloud-service/zero-trust-access` — which is a
second pin on the same axis rather than a replacement for this one.
