---
name: Cloudflare Zero Trust Access
axis: deploy
kind: cloud-provider
components:
- cloud-provider/cloudflare@0.1.0
- cloud-service/zero-trust-access@0.1.0
artifact: n/a
---

# Deploy — Cloudflare Zero Trust Access

A **private plane** in front of a project that must not be publicly
reachable — an operator back-office, an internal tool, a staging surface.
The project sits behind an identity-aware proxy on its own hostname, so the
admin plane is invisible to the public internet rather than merely
authenticated, whichever cloud actually hosts it.

**The composition is the provider plus one service**, which is what a
Cloud-Bundle is. The provider component carries what spans services — the
account and role model, seat-shaped billing, what exists locally, and the
networking rule that decides whether the private plane is real or
decorative. The service component carries this one service and **cites**
that rule rather than restating it.

**This is a deploy-axis entry that produces no artifact and composes with a
hosting pin — such as `cloudflare-workers-static` — rather than replacing
one.** It runs no code: the project still ships however its own hosting
bundle says, and this decides who can reach it once it has. Since
`config_format` 16 made `deploy_template` a list, that pairing is
representable — pin this alongside the hosting entry, not instead of it.
Pairing the two is vwf's job, and any cloud's deploy bundle composes with
this one.

**The scope is parked at Zero Trust Access and Workers Static Assets, and
the bundle says so rather than coming back quietly short.** Static hosting
on Workers is offered, as `cloudflare-workers-static`. A **Worker script
fronting those assets** — server-side rendering on Workers — along with
Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream, is planned
under its own effort and is **not** offered here. A short menu with no
explanation is indistinguishable from a broken adapter; a product needing
one of those has a gap to name, not a gap to fill from general Cloudflare
knowledge.

**What it decides that neither component decides alone** is that the
private plane is a **per-project** decision belonging in the registry,
because it changes what the acceptance suite can reach. A project moved
behind the proxy without its suite being given a service credential does
not fail informatively — it fails at a login page and reports it as an
application error.

**The category realizes no vwf capability token.** `access` is one of the
three the taxonomy records as a known vwf-side gap, so both components
leave `capability` unset and nothing here mints one.

Full judgment: the components' own skills and their references.
