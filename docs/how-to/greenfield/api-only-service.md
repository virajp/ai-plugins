# Build a headless service with no UI anywhere

Your product is an API and nothing else — no web app, no mobile client, no
operator back-office. Every consumer is somebody else's code. This guide is a
**delta** on [Start a product from an empty repo](./single-repo.md), which walks
the whole spine end to end; read that first. What follows narrates only the
stretches where a headless product diverges, and links back to the spine for
everything shared.

The worked example is **Hookline**, a payments-webhook relay: it receives events
from payment providers, stores them durably, and re-delivers them to its
customers' endpoints with retries. One repo, one TypeScript project, and the
registry declares exactly one platform — `service`. At the end you have a
blueprint whose primary surface is an OpenAPI contract, one slice built and
merged, and a production release that freezes that contract so every later
change is checked against it.

Mechanics — flags, halt conditions, config keys, file formats — live in the
[vwf plugin manual](../../plugins/vwf.md).

## The journey

### 1. Install the plugins

Same run as the spine's
[Install the plugins](./single-repo.md#install-the-plugins), minus one name:

```sh
claude plugin install vwf@virajp-plugins \
  typescript@virajp-plugins stackgen@virajp-plugins
```

No design tool is pinned, and that is the first consequence of having no
screens: the design adapter exists to answer imports from a canvas, and Hookline
never reaches one. Everything else is unchanged — `typescript` supplies the
language doctrine, and `stackgen` the project- and backing-axis bundles. Scopes
and upgrades: [the installer CLI](../../cli/usage.md#installing-plugins).

### 2. /vwf:setup

Identical to the spine — a blank repo is bootstrapped and nothing more. See
[`/vwf:setup`](./single-repo.md#vwfsetup).

### 3. /vwf:product

Identical in shape, different in who the users are. Hookline's users are
integrating engineers, not people looking at a screen, so its goals have to be
measurable in delivery outcomes rather than in anything visible:
`#goal-no-lost-events` (every accepted event reaches its destination or lands in
a dead-letter view an operator can act on; measured as accepted-to-delivered
ratio over 30 days, target 99.99%) and `#goal-integration-in-an-hour` (a new
customer's first endpoint receives its first event within an hour of signing up;
measured as median signup-to-first-delivery time).

Slice priority: ingest and store an event first, then delivery with retry, then
replay. Nothing else is worth building until an event survives arrival. The
shape of the conversation and the reviewer gate are the spine's —
[`/vwf:product`](./single-repo.md#vwfproduct).

### 4. /vwf:architecture

This is where the whole delta is decided, in one answer. The derivation proposes
topology `repo` and one project named `hookline`; the platform round is the
consequential one, and Hookline answers `[service]` alone.

That single answer is what the rest of this guide is about. A screen platform is
never assumed, so declining to add one is not a skipped step — it is the
registry saying this product has no visual surface, and every UI-conditional
part of vwf keys off it: the design-system foundation, the mandatory standard
flows, the per-platform flow files, the mockup renders, and `execute`'s UX
stage.

Stack pins run one axis at a time as usual — `typescript-effect-hono` on the
project axis (the template that declares `service`), `postgres` on the backing
axis, `container-generic` on the deploy axis, and the repo axis answered once
for the checkout. Why the axes never merge:
[Stack pins, one axis at a time](./single-repo.md#stack-pins-one-axis-at-a-time).
The twelve-foundation walk follows, unchanged in shape from
[The twelve foundations](./single-repo.md#the-twelve-foundations) — though
Hookline's answers lean harder on background processes and reliability targets,
since retrying delivery *is* the product.

Output as usual: `registry.yaml`, `architecture.md`, and the stack block. See
[`/vwf:architecture`](../../plugins/vwf.md#vwfarchitecture).

### 5. /vwf:design-system — skipped

There is nothing to run: the design system becomes a foundation only once some
registry project declares a screen platform, and the blueprint's design-system
halt fires only on a flow with a Screens section — Hookline's flows never have
one. Running it anyway is not an error, and the terminal-product guide narrates
what happens when you do, since it faces the same empty registry:
[`/vwf:design-system` on a screenless registry](./cli-product.md#4-vwfdesign-system).
Whether Hookline should have a UI surface at all is
[No screens is a registry answer](#no-screens-is-a-registry-answer) below.

### 6. /vwf:blueprint

The sweep works the same way and stamps coverage the same way — see
[`/vwf:blueprint`](./single-repo.md#vwfblueprint) for the rhythm. Three things
are different, and together they change what the stage is *for*.

**The worklist is entirely yours.** Screenless platforms carry no standard
flows, so nothing is mandated ahead of the product's own journeys: no `100-home`
anchoring the number line, no `signin` flow and none of the three account flows
that come with it. Hookline's worklist is just the slice priority in flow form —
`110-ingest-event`, `120-deliver-with-retry`, `130-replay-delivery` — numbered
in the product band, in execution order.

**Each flow is one document.** With no screen platform there are no
`<platform>.md` files, no Screens sections, no components to pin, no scratchpad
renders and no per-flow visual review. A flow is `index.md` alone: trigger,
actors, ordered steps, failure and compensation, background jobs, acceptance
criteria. That is a materially shorter conversation per flow than the spine's,
and it moves the whole precision budget somewhere else. (A terminal product
reaches the same shape by a different route —
[what a flow is with no screens](./cli-product.md#what-a-flow-is-with-no-screens).)

**The OpenAPI contract is where that budget goes.** A flow's Steps section
resolves to the project declaring `service`, which means each step names an
`operationId` in `apis/hookline.openapi.yaml`, and coverage does not hold until
every referenced `operationId` actually exists there. For a product with a UI,
the contract is one surface among several; here it is *the* surface — the only
place the product's externally visible behaviour is written down. The
`rest-api-design` doctrine is pulled on demand as each pass touches an API
operation, and it is what decides the shape of what you are pinning: resource
modelling, method semantics, the error envelope, pagination, and the versioning
strategy discussed in
[What the baseline already answered](#what-the-baseline-already-answered) below.
The skill is indexed under [vwf skills](../../plugins/vwf.md#vwf-skills).

Hookline's flows also introduce external integrations — each payment provider's
signing secret, each customer's delivery endpoint — so the sweep maintains
`environment.md` as it goes, cataloguing every variable by name and never by
value.

The coherence review closes the sweep as always, walking flows against entities,
schemas and the contract together.

### 7. /vwf:plan

Unchanged. Slices are flows and entities; the dependency chain is resolved and
each unimplemented dependency becomes its own plan. See
[`/vwf:plan`](./single-repo.md#vwfplan) and
[Plan approval](./single-repo.md#plan-approval).

### 8. /vwf:execute

Unchanged except that the UX stage does not run — it fires only for a slice that
changes screens on a screen platform, and Hookline has none. Code, review and
security still run per step, and the acceptance pass still runs once over the
whole slice, so the gate you reach is the same gate, with the UX stage reported
as explicitly skipped. See [`/vwf:execute`](./single-repo.md#vwfexecute) and
[The execute merge gate](./single-repo.md#the-execute-merge-gate).

### 9. /vwf:verify, and the release freeze

vwf never deploys. A staging run behaves exactly as the spine describes —
[`/vwf:verify`](./single-repo.md#vwfverify).

The production run is the delta. A clean pass against production offers to
record a **release**, and a standalone `service` project is precisely the shape
that offer is for. The spine's Relay is never snapshotted, because it declares
`[service, webapp]` — its API serves its own UI, shipped in the same deployable,
so there is no independent consumer to protect. That exclusion is automatic and
has nothing to do with the decision below: Relay is not asked and does not
decline. Hookline declares `service` and nothing else. Its callers are other
companies' code, running on their release cadence, and they are exactly who a
frozen contract protects.

```text
/vwf:verify production
```

Accept the offer and the living contract is snapshotted into the released-API
directory, keyed by its version. What that buys is enforcement everywhere the
contract could quietly change afterwards: the blueprint sweep's coherence review
and `execute`'s code review both start checking every later change against the
snapshot and blocking anything that is not additive, unless you consciously cut
a new major version. Before the first release, breaking your own API is a
judgement call nobody is making; after it, it is a gate. The snapshot rules and
what enforcement looks like on each side:
[`/vwf:verify`](../../plugins/vwf.md#vwfverify).

## Decision points

### No screens is a registry answer

The most expensive decision in this guide is the platform list, and it is made
before anything is written. `[service]` is a claim that no human will ever look
at this product directly — not an admin page, not a status dashboard, not a
signup form.

Getting it wrong in either direction costs. Declaring a screen platform you do
not have makes the design system a foundation you must satisfy before the first
flow with UI can be blueprinted, and brings the standard-flow mandates with it.
Omitting one you do need means adding it later through
[`/vwf:architecture`](../../plugins/vwf.md#vwfarchitecture) and re-sweeping the
affected flows to grow Screens sections they never had.

There is a second-order consequence worth knowing before you decide: adding a UI
platform to *this* project — turning `[service]` into `[service, webapp]` for an
operator back-office — is also what takes the release freeze away, since a
contract serving its own co-shipped UI has no independent consumer to protect.
If Hookline eventually wants an operator console *and* wants its public contract
frozen, the console belongs in its own registry project, not on the relay's
platform list.

### What the baseline already answered

vwf's engineering baseline settles a set of technical defaults that are never
elicited — idempotency on mutating operations, one error envelope, cursor
pagination, retry discipline — so blueprint rounds spent re-deciding them are
rounds wasted. The baseline is enforced default, not a menu; a deviation only
arrives when you raise one.

For an API-only product that leaves two genuinely open questions, and both are
worth spending real time on because the contract is the product:

**What the idempotency key *is*.** The baseline says a non-naturally-idempotent
create takes one; it does not say where it comes from. Hookline's ingest
endpoint could take a client-supplied header, or derive the key from the payment
provider's own event id. The second is stronger — a provider retrying its own
webhook cannot produce a duplicate even if it forgets the header — but it binds
the contract to a per-provider field, which is a decision the blueprint must
record because code written either way looks correct.

**Whether `/v1` is in the path from day one.** The `rest-api-design` position is
a version in the URL path for major breaking changes, alongside a fixed list of
what counts as breaking — and removing an endpoint is on it. Moving `/events` to
`/v1/events` after the fact removes an endpoint, so the cheap moment to decide
is before the first consumer exists, and certainly before the freeze. Hookline
ships `/v1` from the first deploy.

### Whether to accept the freeze offer

The offer is not automatic and declining is legitimate. Accepting converts your
contract from a document into an enforced bar: two independent gates start
refusing breaking changes, and a change that genuinely needs to break becomes an
explicit major-version decision rather than a diff nobody flagged.

The test is whether anything you do not control calls this API. If every caller
ships in the same deployable, the freeze buys you friction and no protection —
which is exactly why a `[service, webapp]` project is never snapshotted. If your
callers are other teams, other companies, or anything with its own release
cadence, accept: the alternative is discovering the break from their incident
channel.

One practical note before you accept. The snapshot is keyed on the contract's
own version, so bump it deliberately as part of shipping rather than leaving it
at whatever the template seeded: a version that has already been released is
refused rather than overwritten, and a version that is not semver is skipped and
flagged. Either way you get told, but both cost you a round trip you could have
avoided. The snapshot rules: [`/vwf:verify`](../../plugins/vwf.md#vwfverify).

## When things halt

- **Blueprint halts without `product.md`.**
  [`/vwf:blueprint`](../../plugins/vwf.md#vwfblueprint) — the design-system halt
  beside it cannot fire here, since no flow has a Screens section.

Every other halt on this path is the spine's and behaves identically:
[When things halt](./single-repo.md#when-things-halt).
