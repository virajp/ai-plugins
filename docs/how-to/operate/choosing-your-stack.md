# Decide which stack your product pins

Installing `vwf` gets you the workflow and tells you nothing about your
technology: vwf names no language, no framework and no cloud, so every concrete
option you are ever offered comes from `stackgen`. That plugin arrives as vwf's
dependency, so there is no install decision left to make — but there is still a
decision, and it is now one axis at a time rather than one plugin at a time.
This guide is that decision: which **bundle** each of your product's four axes
pins, and why, **before** it reaches `/vwf:architecture`. At the end you have a
pin list you can defend.

What stackgen actually ships is [its own page](../../plugins/stackgen.md),
beside [the vwf manual](../../plugins/vwf.md). This page only decides which
parts of those pages you need to read.

> **This guide used to be about choosing plugins.** Until the retirement wave
> there were separate `typescript`, `flutter`, `gcp` and `cloudflare` plugins,
> and picking your stack meant picking which of them to install. Their doctrine
> is now stackgen packs, so the install list collapsed to one name you do not
> choose, and the choice moved down a level to the bundle.

## The axes in one minute

A stack is composed from four templates that never merge and never outrank each
other: **project** (language, framework, source layout), **backing** (datastore,
identity, queue, storage), **deploy** (build artifact and host) — each pinned
per project — and **repo** (package manager, task runner, workspace), pinned
once for the checkout. That independence is why picking a web framework buys you
no database and no cloud, and it is why the pin list below reads as roughly one
decision per axis you hold an opinion about. The contract behind it — the
covering rule, what a template payload carries, how `plan` and `execute` resolve
a template's conventions — is
[stack templates](../../plugins/vwf.md#stack-templates).

## What answers each axis

**The project axis is almost always the first pin**, because a project with no
covering bundle on its menu cannot be pinned and therefore cannot be planned.
stackgen's `language/typescript` bundle and its framework components cover
TypeScript and JavaScript; `app-framework/flutter` covers Dart and Flutter and
serves `mobile`, `tablet`, `desktop` and `webapp` from a single codebase.
Anything else takes the **generate** entry — see below.

**The backing axis splits into a vendor-free half and a managed half.** Each
capability has a neutral contract — what any provider must guarantee — beside
the providers that realize it. Vendor-free: `postgres` for the datastore, `oidc`
for identity, `otel-lgtm` for observability, `temporal` for orchestration,
`doppler` and `fnox` for secrets. Managed: a cloud's own services, `gcp`
bringing Firestore, Cloud SQL and the Firebase services. Object storage is the
one to know about — **it has no vendor-free provider by design**, because every
object store belongs to a cloud, so its contract states the requirement and
points at a cloud's answer rather than offering a neutral one.

**The deploy axis has a provider-neutral default that is a real answer**, not a
placeholder: `deploy-target/container-image` is an OCI image on any registry and
any host that runs containers, with the Compose wiring the acceptance verifier's
readiness gates depend on. The managed alternatives are `cloud-run` and `gke`.
`zero-trust-access` composes with a host rather than replacing one — a private
plane in front of a project that must not be publicly reachable, whichever cloud
hosts it.

**The repo axis** is the package manager and workspace layout: `pnpm` (with or
without a workspace), `bun`, or `pub` for a Flutter checkout.

## The closed menu, and the one door out of it

The union of what the installed stack plugins declare **is** the vocabulary.
There is no free-text pin and no *other (describe)* escape: a project the menu
cannot cover halts, and a language nothing claims is a blocking finding that
stops `setup` and `execute`. That refusal is deliberate — a stack nothing
defines supplies no conventions to plan against, no harness to build against and
no UX gate, so a run against it would lose every guarantee while reporting
itself healthy. See [stack templates](../../plugins/vwf.md#stack-templates).

What keeps that from being a wall is stackgen's one open entry. A stack no pack
covers is **generated** — researched topic by topic against current
documentation, instantiated from vwf's principles catalog, gated by a reviewer
agent and your explicit consent, and landed in your repo's `.claude/` tree as
plain committed files. So the practical question is not "is my stack supported"
but "is it covered by a pack or generated", and the difference you feel is one
consent prompt and a slower first pin.

## Worked mappings

Every guide in `docs/how-to/` builds a fictional product, and each one's pin
list falls out of the same three questions: what language, what it stores, and
whether it has screens.

| Product                                          | Shape                                                                   | project                  | backing    | deploy              |
| ------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------ | ---------- | ------------------- |
| [Relay](../greenfield/single-repo.md)            | One TS repo: API + web app, Postgres                                    | `typescript-hono-refine` | `postgres` | `container-generic` |
| [Centwise](../greenfield/ui-with-design-tool.md) | One Flutter app, designed on a canvas                                   | `dart-flutter`           | —          | `container-generic` |
| [Hookline](../greenfield/api-only-service.md)    | One TS service, no UI                                                   | `typescript-effect-hono` | `postgres` | `container-generic` |
| [clockon](../greenfield/cli-product.md)          | One TS command-line tool                                                | `typescript-effect-cli`  | —          | `npm-package`       |
| [Stallfront](../greenfield/multi-repo.md)        | E-commerce in four repos: a docs-only base plus storefront, API and IaC | `typescript-hono-refine` | `postgres` | `container-generic` |

Relay is the full case in miniature: one project serves both an API and its own
web app, `postgres` answers the backing axis, and a `design-tool` bundle is what
makes `/vwf:design-system` runnable at all — a declared screen platform makes
the design system a foundation, and without a materialized adapter there is
nothing to import from. Centwise drops the datastore rather than the design
tool: it is an on-device app, and its screens still have to be imported and
re-imported as they are designed.

Hookline and clockon are the two subtractions. Hookline publishes an API and
declares no screen platform, so no design tool is involved anywhere in its
workflow — but it stores things, so `postgres` stays. clockon declares the
terminal platform, which has no screens at all and never reaches a canvas, so
the design system is not one of its foundations; it holds no state of its own
either, which leaves project, deploy and repo as the whole pin list. A
three-axis product is a normal answer, not a sign something was missed.

Stallfront shows the pins are per product, not per repo: the same three answers
as Relay, spread across a base repo and three members instead of one checkout.
Splitting a product into repos changes where commands run, not what it pins. A
cloud bundle joins the list the moment Stallfront picks a host; until then
`container-generic` is a real answer.

## Decision points

### A capability now, or later

Pin one when a project in your product actually needs the capability, not in
anticipation. Adding it later is cheap: pin the bundle and re-run
`/vwf:architecture`, which asks only about genuine deltas rather than
re-eliciting what is already confirmed. What is not cheap is discovering the gap
at `/vwf:architecture` and pinning around it, because a backing axis answered
without the provider you actually wanted carries that pin into every plan and
every run. Deferring is also a first-class answer — an axis may be left
`unresolved` while you keep defining the product, though `/vwf:plan` and
`/vwf:execute` halt until it is answered.

Two capabilities are worth deciding earlier than the rest. **Identity** is one,
because whether accounts exist is a product decision that reaches the registry
as a declared capability and then reaches the blueprint as mandated flows
wherever the product has screens. **Observability** is the other, and for the
opposite reason: its contract requires only that leaving the backend never be a
rewrite, and the pack that satisfies that by construction — a vendor-neutral
wire format — costs nothing to adopt early, while retrofitting it means
rewriting instrumentation that had a vendor baked in.

### A cloud bundle, or the provider-neutral default

You do not need a cloud at all to have a complete stack. `container-generic`
answers the deploy axis with an OCI image on any registry and any host that runs
containers, and `postgres` answers the backing axis with a provider that belongs
to no cloud — a fully vendor-free path through the whole workflow, with a local
stack that runs the same way on every machine.

Pick a cloud bundle when you want the managed flavour and the judgment that
comes with it — what each service costs, which have local emulators, and when
one stops being the answer. The axes stay independent, so this is not an
all-or-nothing switch: one project can take a managed datastore while another
stays on Postgres, and the deploy axis is answered per project too. Two things
constrain the choice rather than the bundle: a capability with no vendor-free
provider, object storage being the one, leaves you with only a cloud's answer,
and `zero-trust-access`'s scope means it composes with a host rather than
replacing one.

### Where a language server comes from

Most of what a bundle materializes is plain files in your repo, which every
collaborator gets with a `git pull`. A **language server** cannot be — it is a
plugin-manifest feature no project file can express — so stackgen writes one
small local plugin on your machine and prints the two commands that register it,
rather than running them. It is user-scoped, so it serves every repo you work in
and **your collaborators get none of it**: their editor tooling is their own
machine's business. Expect to do that once, and to be asked before it happens.

## See also

- [Start a product from an empty repo](../greenfield/single-repo.md) — the whole
  spine, with the install step in context.
- [The stackgen plugin](../../plugins/stackgen.md) — packs, bundles, kinds, and
  what a generation run actually does.
- [The installer CLI](../../installer/usage.md) — flags, scopes, and the
  external-tool gate.
- [The vwf manual](../../plugins/vwf.md) — the commands these pins feed.
