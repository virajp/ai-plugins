# Component Taxonomy

stackgen's unit is the **component** — the atom a stack is actually made
of: `typescript`, `pnpm`, `axum`, `postgres`, `kafka`, `cloud-run`. One
pack per component (`${CLAUDE_PLUGIN_ROOT}/assets/pack-format.md`); a
**bundle** is never a directory — it is a recorded composition of component
refs in the template payload. This file is the closed vocabulary that
classifies every component, curated and generated alike. It is **extended
deliberately**: a new type or category is an edit to this file, reviewed
like any contract change — never a value a generation run invents because
nothing here fit.

Every component declares up to three classification fields in its metadata:
**`type`** always, **`category`** where its type has categories, and
**`capability`** where the component realizes a vwf capability.

## Component types

The closed list. A component is exactly one of:

- **`language`** — a programming language; the root a Language-Bundle
  composes around, and the one type that carries the per-language facts
  `/vwf:doctor` verifies (LSP provision, mise tool, manifest).
- **`package-manager`** — how a language's dependencies are installed and
  locked; contributes the `repo`-axis facts.
- **`framework`** — a library that imposes structure inside a language: a
  webserver, an ORM, a testing framework, a meta-framework.
- **`toolchain-gate`** — a repo-level gate: formatter, linter, secret
  scanner, vulnerability scanner, hook runner.
- **`cloud-provider`** — a provider itself: the account/IAM/billing and
  emulator judgment that spans its services.
- **`cloud-service`** — one service of one provider: a compute target, a
  managed database, a managed queue.
- **`datastore`** — a datastore the product runs against, standing on its
  own rather than as one cloud's flavour.
- **`queue`** — a standalone queue or event bus.
- **`cdn`** — a content-delivery layer.

## Categories

The finer cut, closed per type. A type absent here has no categories yet,
and its components leave `category` unset.

- **`framework`**: `webserver` / `orm` / `otel-sdk` / `testing` /
  `meta-framework`
- **`cloud-service`**: `compute` / `sql` / `queue` / `object-storage` /
  `cdn`
- **`datastore`**: `sql` / `document` / `graph` / `vector` / `key-value` /
  `in-memory`

A name appearing as both a type and a category is deliberate, not a
collision: `kafka` is type `queue` (a standalone component); a provider's
pub/sub service is type `cloud-service`, category `queue`. The shared
category is what makes them substitutable answers to the same blueprint
capability — and what lets a stack menu become a category-filtered query
rather than a per-plugin list.

## The capability seam

Capability tokens are **vwf's** — defined in vwf's capability-vocabulary
asset, blueprint-neutral, referenced here by token and never redefined. The
category taxonomy is **stackgen's** — the cut beneath the capability that
vwf never sees. vwf never learns what an ORM is; stackgen never redefines
what `relational-datastore` means. A component's `capability` field names
the vwf token it realizes: a `datastore`/`sql` component realizes
`relational-datastore`; a `queue` component `message-queue` or `pub-sub`.

Some categories have **no capability token today** — `cdn` is one. That is
a known vwf-side gap, not a taxonomy error: the component leaves
`capability` unset, and nothing here mints a token to fill the hole —
minting capabilities is vwf's move.

## Bundles — how types compose

A bundle is rooted per kind (`${CLAUDE_PLUGIN_ROOT}/assets/kinds.md`):

- A **Language-Bundle** is the composition rooted at a `language`
  component: the language + its `package-manager`, `framework` components
  and `toolchain-gate`s.
- A **Cloud-Bundle** is a `cloud-provider` component + `cloud-service`
  components.
- A **Datastore-Bundle** is category-level doctrine + an instance
  component (a `datastore`, or a cloud's `cloud-service`/`sql`).

## Category-level doctrine

Doctrine that belongs to a category rather than an instance — the
sql-datastore contract, for one — is written **once**, as stackgen curated
knowledge (arriving at Wave B). Instance components cite it and stay thin:
the `postgres` pack carries what is Postgres's alone.
