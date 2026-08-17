# object-storage plugin

The `object-storage` plugin is a **capability plugin** for vwf. A capability
plugin holds the neutral contract — what *any* provider must be able to do to
serve a vwf product — and the concrete provider lives with whoever owns it. That
is the same shape as vwf's stack-adapter contract, one level down: **the
capability states the requirement, the provider states the mechanism.**

This one is the **deliberate exception** in the set. Its four siblings each ship
the contract *plus* the provider that needs no cloud — Postgres, an OIDC issuer,
OTel-LGTM, Temporal. `object-storage` ships **contract prose only**, because
there is no vendor-neutral object store to ship: every flavour is a cloud's.

It realizes the `object-file-storage` capability token. Blueprint prose calls it
**object storage** — never a product name.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

```sh
claude plugin install object-storage@virajp-plugins
```

Add `--scope project` to scope it to one repo instead of every repo on your
machine. There is no default install set — every plugin here, `object-storage`
included, is installed by name. It is worth installing even though it ships no
template: the contract is what the chosen store must satisfy, and it is what a
flow is written against.

## The contract

### What a provider must be able to do

| Requirement                                     | Why it is in the contract                                                                                                                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serve bytes without the application in the path | Uploads and downloads go **direct**, authorized by a short-lived signed URL the product issues. An application that proxies file bytes has turned a storage bill into a compute bill, a memory limit and a timeout. |
| Express lifecycle as a bucket policy            | Expiry, tiering and versioning are set at bucket creation, not in application code. A retention rule that lives in a cron job is a retention rule that stops running.                                               |
| State its consistency                           | Whether a read immediately after a write sees it, and whether a delete is immediate, changes what a flow may assume. It goes in the contract, not in a comment.                                                     |
| Bound access by prefix                          | A credential scoped to the whole bucket reads every tenant's files. Prefixes are the authorization boundary, designed with the key layout.                                                                          |
| Price egress, and say so                        | Storage is cheap and reading it back is not. Egress is the line that surprises products, and a design input for anything media-heavy.                                                                               |

### What the product decides, whatever the provider

The **key layout**, because it is the security boundary and effectively
immutable once objects exist. **Whether an object is user-visible**, and
therefore whether a signed URL is ever long-lived — it should not be. **What
happens on delete** — hard delete, tombstone, or lifecycle expiry — which is a
data-retention and PII decision, not a storage one. And **content-type and size
limits at issue time**: signing an unconstrained upload URL is signing a blank
cheque.

The access rule follows the other capability plugins: a project reaches the
store only through the shared services layer, and no project imports a vendor
SDK directly. Signing happens there, once, so expiry and constraints are decided
in one place rather than per caller.

Out of scope by design: which store (it comes from the cloud plugin, and this
plugin has no candidate to offer), what is stored (a blueprint contract), and
the client library (the project's language plugin).

## Self-hosted provider

**There is none, and that absence is a decision rather than a gap.**

Every object store worth using belongs to a cloud. There is a widely-implemented
wire protocol, but a protocol is not a stack template: it names no lifecycle
policy, no consistency guarantee, no egress price and no retention mechanism —
and those are exactly the decisions a template exists to record. Writing a
"compatible" template would mean writing prose that is true of nothing in
particular, which a product would then adopt believing a decision had been made.

So the menu returns `templates: []` **and states that it returns nothing**, on
every answer:

```yaml
plugin: object-storage
templates: []
note: This plugin is contract-only by design and ships no template. Every
  object store belongs to a cloud, so the flavour comes from the project's
  cloud plugin — Cloud Storage from gcp, R2 from cloudflare once it is
  unparked. …
```

**The `note` is not optional.** An empty list with no explanation is
indistinguishable from a broken adapter — a skill that failed to load, or one
whose invocation was flipped to `user` — and that silent ambiguity is precisely
what vwf's stack-adapter contract exists to prevent. `templates: []` alone would
tell the caller nothing about which of the two it was looking at.

The template skill applies the same reasoning one step further: since there is
no valid slug, **every call is an error**, not an empty payload. It names what
this plugin is, names the cloud plugins that do have a store, and stops — never
synthesizing a template from general storage knowledge or from a wire protocol,
never answering on another plugin's behalf, and never downgrading to a warning
and continuing. vwf's caller needs a halt it can act on, not an advisory it can
miss.

## Cloud flavours

This is where every real answer lives:

| Plugin                        | Flavours                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [gcp](./gcp.md)               | `object-file-storage` on both backing templates — Firebase Storage via `firebase`, Cloud Storage via `cloud-sql`                      |
| [cloudflare](./cloudflare.md) | R2, **once that plugin is unparked** — it is currently scoped to Zero Trust Access alone, and R2 arrives under its own dedicated plan |

vwf renders the union of the configured plugins' menus, so a product listing
both `object-storage` and `gcp` in its `stacks:` sees the contract from one and
the store from the other. This plugin never lists another plugin's template:
naming `gcp`'s buckets here would double-count them and make this plugin the
wrong owner of a decision it does not hold.

The cross-project rule lives in vwf's `capability-vocabulary.md` rather than
here: **consumers follow the publisher.** If project A publishes a capability
backed by one cloud and project B consumes it, B uses A's flavour even when B's
own cloud differs — which for object storage is what keeps one bucket's key
layout the same one every consumer signs against.

## Skills

Two skills, both the vwf **stack adapter**. Neither auto-applies; both are
invoked by `/vwf:architecture` and `/vwf:setup` when `object-storage` is listed
in the product's `stacks:`.

| Skill                           | What it returns                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `object-storage-stack-menu`     | An empty template list **with the note that explains it** — the deliberate no-provider answer, returned identically every time |
| `object-storage-stack-template` | An error naming the cloud plugins that do have a store, for any slug — because this plugin has none                            |

Both stay model-invocable, and here that is more load-bearing than anywhere else
in the set: a skill marked `disable-model-invocation: true` is removed from the
model's context entirely and **cannot be invoked by vwf**, so it returns nothing
at all. The failure this plugin exists to avoid *is* silence, and such a skill
is silent — an unexplained empty menu would be indistinguishable from the
explained one.

If a caller asks what the capability requires rather than which store to use,
that is a legitimate question with a real answer, and the template skill answers
it from the contract — the rule against proxying bytes, signed-URL expiry,
lifecycle as a bucket policy, prefix-scoped access, egress cost. It is the whole
reason this plugin exists.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that asks for a stack menu, and the
  stack-adapter contract whose silent-failure mode this plugin is written
  against.
- [gcp plugin](./gcp.md) — Cloud Storage and Firebase Storage.
- [cloudflare plugin](./cloudflare.md) — R2, once that plugin is unparked.
- [datastore](./datastore.md), [identity](./identity.md),
  [observability](./observability.md), [orchestration](./orchestration.md) — the
  four capability plugins that *do* ship a self-hosted provider.
