---
name: workers-static-assets
version: 0.1.0
category: development
description: >-
  Cloudflare Workers Static Assets as this product's static host — when a
  directory of files is the whole deployment and when it stops being one,
  the asset routing and caching rules the edge actually applies, what the
  build must emit, how the release and its rollback are shaped, what
  request-shaped billing means for a static site, the least-privilege
  token a deploy needs, and why local development cannot see the edge.
license: MIT
allowed-tools: Read Grep Glob Edit Write Bash
---

# Cloudflare Workers Static Assets

An assets-only Worker: no `main`, no bindings, no script. The build output
directory is uploaded and the edge serves it. This skill carries the
judgment; wrangler's current flags, the asset configuration keys and the
API's shape belong to Context7 at use time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Deciding whether a project belongs here | [Pick & trade](references/pick-and-trade.md) |
| Shaping the config, or the routing the edge applies | [Service doctrine](references/service-doctrine.md) |
| Deciding what the build must emit, and how it is cached | [Artifact](references/artifact.md) |
| Wiring the release, a preview, or a rollback | [Pipeline](references/pipeline.md) |
| Deciding how "is it up?" is answered | [Health](references/health.md) |
| Sizing, or explaining, the bill | [Cost shape](references/cost-shape.md) |
| Issuing the credential a deploy uses | [Identity shape](references/identity-shape.md) |
| Running or testing the site on a laptop | [Local dev](references/local-dev.md) |

**Three rules that do not wait for a reference.** Adding `main` is not a
configuration change — it is a different stack, and this one is **static
assets only** by ruling. The `not_found_handling` mode is a product
decision with a wrong answer in both directions, so it is chosen and not
inherited. And the deploy carries **no credentials in any file**: the
token and the account id arrive from the environment, and the task refuses
to start without them.

The rules this skill leans on hardest are the provider's, not its own: the
account is the unit of blast radius and the roles are broader than they
look. That is the `cloudflare` skill's identity and IAM reference, cited
here and restated nowhere.

## What this stack does not cover

**A Worker script fronting the assets** — `main`, `assets.binding`,
`run_worker_first`. Server-side rendering, an API route beside the site,
an auth check at the edge: all of that is a separate pack under its own
effort and is **not** part of this stack.

Neither are Pages, R2, D1, KV, Durable Objects, Queues, Images or Stream.
If the product needs one, that is a gap to name — not a gap to fill from
general Cloudflare knowledge, because doctrine nobody wrote is doctrine
nobody reviewed.
