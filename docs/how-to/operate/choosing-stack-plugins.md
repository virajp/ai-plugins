# Decide which plugins your product needs

`--all` installs the workflow and tells you nothing about your technology: vwf
names no language, no framework and no cloud, so every concrete option you are
ever offered comes from a plugin you installed by name. This guide is that
decision — eleven plugins you choose, plus the workflow and its one hard
dependency, which arrive together — and which subset a given product wants
**before** it reaches `/vwf:architecture`, since the menu that command presents
is exactly what the plugins you installed **and listed in the product's
`stacks:` roster** declare. At the end you have a plugin list you can hand to
the installer, with a reason for each name on it.

Flags and scopes are [the installer CLI](../../cli/usage.md); what each plugin
actually ships is its own page, beside [the vwf manual](../../plugins/vwf.md).
This page only decides which of those pages you need to read.

## The axes in one minute

A stack is composed from four templates that never merge and never outrank each
other: **project** (language, framework, source layout), **backing** (datastore,
identity, queue, storage), **deploy** (build artifact and host) — each pinned
per project — and **repo** (package manager, task runner, workspace), pinned
once for the checkout. That independence is why picking a web framework buys you
no database and no cloud, and it is why the plugin list below reads as roughly
one plugin per axis you hold an opinion about. The contract behind it — the
covering rule, what a template payload carries, how `plan` and `execute` resolve
a template's conventions — is
[stack templates](../../plugins/vwf.md#stack-templates).

## The plugin taxonomy

**Language plugins own the project axis**, and one of them is almost always the
first name on your list: a project with no covering template on its menu cannot
be pinned, and therefore cannot be planned.
[`typescript`](../../plugins/typescript.md) covers TypeScript and JavaScript,
shipping the project-, repo- and deploy-axis templates for both —
[the full list](../../plugins/typescript.md#stack-templates) is on its page.
[`flutter`](../../plugins/flutter.md) covers Dart and Flutter, bundles the Dart,
Kotlin and Swift language servers, and ships
[one project-axis template](../../plugins/flutter.md#stack-templates) that
serves `mobile`, `tablet`, `desktop` and `webapp` from a single codebase.

**Capability plugins own the vendor-free half of the backing axis.** Each holds
a neutral contract — what any provider must guarantee — plus, where one exists,
the provider that belongs to no cloud: [`datastore`](../../plugins/datastore.md)
ships Postgres, [`identity`](../../plugins/identity.md) ships any OIDC issuer,
[`observability`](../../plugins/observability.md) ships the self-hosted
OpenTelemetry → Grafana OTel-LGTM sink, and
[`orchestration`](../../plugins/orchestration.md) ships Temporal.
[`object-storage`](../../plugins/object-storage.md) is the one to know about
before you install it: **it ships no provider by design**, because every object
store belongs to a cloud. Installing it gets you the contract and a menu that
says out loud that it has nothing to offer and which cloud plugin does — which
is the point, since an unexplained empty menu is indistinguishable from an
adapter that failed to load.

**Cloud plugins supply the managed flavours** on the backing and deploy axes.
[`gcp`](../../plugins/gcp.md) brings Firebase and Cloud SQL as backing choices
and Cloud Run and GKE as deploy targets, along with the judgment an SDK
reference cannot give you — which service to pick, when it stops being the
answer, how it bills. [`cloudflare`](../../plugins/cloudflare.md) is
**deliberately parked at Zero Trust Access**: a private plane in front of a
project that must not be publicly reachable, whichever cloud hosts it. Workers,
Pages, R2 and the rest are not offered there yet, and the menu says so rather
than coming back quietly short — so install it for the private plane, not in the
hope of the rest.

**[`devtools`](../../plugins/devtools.md) is already there.** It is vwf's one
hard dependency and installs with it, so there is nothing to decide — but it is
worth knowing what it contributes, because it is why a product with no cloud
plugin still has a deploy answer and a runnable local stack: it owns
`container-generic`, the provider-neutral OCI target, and the Compose wiring the
acceptance verifier's readiness gates depend on.

**Two plugins are independent, installed by choice, and deliberately not vwf
dependencies.** [`design-tools`](../../plugins/design-tools.md) is the adapter
vwf imports screens, design systems and design-review conversations through,
resolving the tool per project — an adapter is chosen rather than inherited, so
vwf calls fixed skill names and never forces one tool on you.
[`cicd`](../../plugins/cicd.md) generates the delivery pipeline: vwf owns the
contract a pipeline must satisfy and nothing in vwf delegates to this plugin, so
it forces no install; add it when you want pipelines written for you.

## The closed menu

The union of what the plugins you installed **and listed in the product's
`stacks:` roster** declare **is** the vocabulary. There is no free-text pin and
no *other (describe)* escape: a project the menu cannot cover halts, and a
language no listed plugin claims is a blocking finding that stops `setup` and
`execute`. That refusal is deliberate — a stack no plugin defines supplies no
conventions to plan against, no harness to build against and no UX gate, so a
run against it would lose every guarantee while reporting itself healthy. The
practical consequence is the whole reason this guide exists: install the plugins
that own your technology, and list them, before `/vwf:architecture` — or pin
something you did not want. See
[stack templates](../../plugins/vwf.md#stack-templates).

## Worked mappings

Every guide in `docs/how-to/` builds a fictional product, and each one's plugin
list falls out of the same three questions: what language, what it stores, and
whether it has screens. `devtools` is on every line and omitted from the table,
since vwf brings it.

| Product                                          | Shape                                                                   | Installed beyond `--all`                  |
| ------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------- |
| [Relay](../greenfield/single-repo.md)            | One TS repo: API + web app, Postgres                                    | `typescript`, `datastore`, `design-tools` |
| [Centwise](../greenfield/ui-with-design-tool.md) | One Flutter app, designed on a canvas                                   | `flutter`, `design-tools`                 |
| [Hookline](../greenfield/api-only-service.md)    | One TS service, no UI                                                   | `typescript`, `datastore`                 |
| [clockon](../greenfield/cli-product.md)          | One TS command-line tool                                                | `typescript`                              |
| [Stallfront](../greenfield/multi-repo.md)        | E-commerce in four repos: a docs-only base plus storefront, API and IaC | `typescript`, `datastore`, `design-tools` |

Relay is the full case in miniature: `typescript` covers a project serving both
an API and its own web app, `datastore` answers the backing axis with Postgres,
and `design-tools` is what makes `/vwf:design-system` runnable at all — a
declared screen platform makes the design system a foundation, and without an
adapter there is nothing to import from. Centwise drops the datastore rather
than the design tool: it is an on-device app whose project axis comes from
`flutter`, and its screens still have to be imported and re-imported as they are
designed.

Hookline and clockon are the two subtractions. Hookline publishes an API and
declares no screen platform, so no design tool is involved anywhere in its
workflow — but it stores things, so `datastore` stays. clockon declares the
terminal platform, which has no screens at all and never reaches a canvas, so
the design system is not one of its foundations; it holds no state of its own
either, which leaves `typescript` alone doing project, deploy and repo. A
one-plugin product is a normal answer, not a sign something was missed.

Stallfront is the case that shows the roster is per product, not per repo: its
install is Relay's exact three plugins, spread across a base repo and three
members instead of one checkout. Splitting a product into repos changes where
commands run, not which plugins it needs. A cloud plugin joins the list the
moment Stallfront picks a host; until then `container-generic` from `devtools`
is a real answer and not a placeholder.

## Decision points

### A capability plugin now, or later

Install one when a project in your product actually needs the capability, not in
anticipation. Adding it later is cheap: install the plugin, list it in the
product's `stacks:` roster, and re-run `/vwf:architecture`, which asks only
about genuine deltas rather than re-eliciting what is already confirmed. What is
not cheap is discovering the gap at `/vwf:architecture` and pinning around it,
because a project whose backing axis was answered without the plugin that owns
its provider carries that pin into every plan and every run.

Two capabilities are worth deciding earlier than the rest.
[`identity`](../../plugins/identity.md) is one, because whether accounts exist
is a product decision that reaches the registry as a declared capability and
then reaches the blueprint as mandated flows wherever the product has screens.
[`observability`](../../plugins/observability.md) is the other, and for the
opposite reason: its contract is that your product emits OTLP and never a vendor
SDK, so adopting it early costs nothing and retrofitting it means rewriting
instrumentation that had a vendor baked in.

### A cloud plugin, or the provider-neutral default

You do not need a cloud plugin to have a complete stack. `container-generic`
from [`devtools`](../../plugins/devtools.md) answers the deploy axis with an OCI
image on any registry and any host that runs containers, and
[`datastore`](../../plugins/datastore.md)'s Postgres answers the backing axis
with a provider that belongs to no cloud — a fully vendor-free path through the
whole workflow, with a local stack that runs the same way on every machine.

Pick a cloud plugin when you want the managed flavour and the judgment that
comes with it — what each service costs, which have local emulators, and when
one stops being the answer. The managed set itself is listed on its own page:
[`gcp`'s backing templates](../../plugins/gcp.md#backing-templates), with its
deploy targets beside them. The axes stay independent, so this is not an
all-or-nothing switch — one project can take a managed datastore while another
stays on Postgres, and the deploy axis is answered per project too. Two things
constrain the choice rather than the plugin: a capability that ships no provider
of its own, like [`object-storage`](../../plugins/object-storage.md), leaves you
with only the cloud plugin's answer, and
[`cloudflare`](../../plugins/cloudflare.md)'s parked scope means it composes
with a host rather than replacing one.

## See also

- [Start a product from an empty repo](../greenfield/single-repo.md) — the whole
  spine, with the install step in context.
- [The installer CLI](../../cli/usage.md) — flags, scopes, and the external-tool
  gate.
- [The vwf manual](../../plugins/vwf.md) — the commands these plugins feed.
