# Cloudflare — conventions

The provider half of the Cloud-Bundle: what holds across every Cloudflare
service the product uses, carried once so no service component restates it.

**The coverage here is deliberately narrow, and saying so is part of the
component.** This provider component exists to support **Zero Trust
Access** and **Workers Static Assets**, and nothing else. A **Worker script
fronting static assets** — server-side rendering on Workers — along with
Pages, R2, D1, KV, Durable Objects, Queues, Images and Stream, is planned
under its own effort and is **not offered** — a menu that comes back short
without explaining itself is indistinguishable from a broken one, so the
shortfall is stated rather than implied. Do not fill the gap from general
Cloudflare knowledge: a service this component has not written doctrine for
is a service it does not offer.

**Cloudflare hosts static files and fronts everything else.** At the scope
offered here it hosts exactly one kind of thing — a built directory of
files, on Workers Static Assets — and for anything with a running process
it fronts what runs on another cloud. That second half inverts the usual
reading of a Cloud-Bundle and is the single fact most likely to be got
wrong: a service or fullstack project pins its hosting elsewhere and pairs
the private plane with it, which is vwf's job, and any cloud's own deploy
bundle composes with it.

**The account is the unit of blast radius, and the roles are broader than
they look.** Grants are account-scoped, so a role handed out to edit one
application reaches every application in the account. `Cloudflare Access`
— which edits Access applications, policies and Tunnels — is the narrow
grant for this work; `Cloudflare Zero Trust` is administrator over every
Zero Trust product and is not the same request. Automation uses an
account-owned API token scoped to what it touches, never the Global API
Key, which is unscoped and carries the account.

**Billing follows the population, not the traffic.** A seat is consumed per
user allowed through, and it is freed by removing the user from the seat
rather than by their access expiring on its own. That shape is what makes
this cheap for an operator plane and the wrong answer for anything
customer-facing — the same conclusion the scoping rule reaches from the
other direction, and the reason offboarding is a billing event as well as a
security one.

**The private plane does not exist locally and must not be simulated.**
Cloudflare ships no emulator for the identity-aware proxy, and a local
stand-in would prove only that the stand-in works. Local runs reach the
project directly and inject the identity assertion as a fake through the
same seam the project already verifies in production.

Full judgment: the `cloudflare` skill and its references. The services this
provider carries are `cloud-service/zero-trust-access` and
`cloud-service/workers-static-assets`.
