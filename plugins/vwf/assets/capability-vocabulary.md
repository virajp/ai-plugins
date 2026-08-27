# Capability Vocabulary

Shared by `/vwf:architecture` (the registry elicitation offers these tokens as
MCQ options) and the `architecture-writer` agent (which records them). Keep this
list the single source of truth; both surfaces read it rather than carrying
their own copy.

Capabilities are stack-agnostic feature flags — the gates that decide which
deep, stack-specific questions `blueprint` asks. Pick all that apply per
project; add Other for anything not listed. Extensible — add new capabilities as
the system grows.

**Every token carries a kind**, marked below. The groups are by subject domain,
because that is how someone picking capabilities thinks; the **kind** is the
orthogonal fact about *what answers the token*, and it is what makes "this
capability has no provider" checkable rather than ambiguous:

| Kind    | Means                                                                                                     |
| ------- | ----------------------------------------------------------------------------------------------------------- |
| **`B`** | **backing service** — something outside the product provides it, so the project pins a `backing_template`  |
| **`F`** | **product foundation** — implemented in the product's own code; there is nothing to pin. See the `product-foundations` skill |
| **`P`** | **project-axis fact** — a property of how the project is built, not a service it talks to; belongs to the project template |

A new token **must** be classified when it is added. An unclassified token is
the ambiguity this table exists to remove.

- **Data & storage:** `document-datastore` **B**, `relational-datastore` **B**,
  `object-file-storage` **B**, `cache-layer` **B**, `search-index` **B**
- **Async & messaging:** `durable-workflows` **B**, `message-queue` **B**,
  `pub-sub` **B**, `scheduled-jobs` **B**
- **Realtime & comms:** `realtime-sync` **B**, `realtime-location` **B**,
  `push-notifications` **B**, `email` **B**, `sms` **B**, `voice-audio` **B**
- **Auth & identity:** `third-party-auth` **B**, `custom-claims-rbac` **F**,
  `operator-rbac` **F**
- **Commerce:** `payments-subscriptions` **B**
- **Geo:** `maps-navigation` **B**
- **Web rendering:** `ssr` **P**, `ssg` **P**, `cms-content` **B**, `seo` **P**
- **Mobile:** `offline-first` **P**, `deep-linking` **P**,
  `device-permissions` **P**
- **Observability & governance:** `distributed-tracing` **B**, `audit-log`
  **F**, `rate-limiting` **F**, `runtime-settings` **F**

Three classifications are worth their reasoning, since each looks like the
neighbouring kind:

- **`custom-claims-rbac` and `operator-rbac` are `F`, while `third-party-auth`
  is `B`.** The issuer is a service the product talks to; what the claims *mean*
  and who may act on them is the product's own authorization code. An identity
  provider does not decide your roles.
- **`cms-content` is `B`, alone among Web rendering.** `ssr`/`ssg`/`seo` are
  rendering strategies the project template settles; a CMS is a service holding
  content the product does not own.
- **`distributed-tracing` is `B`.** The product emits OTLP and a sink receives
  it — the sink is a backing service, even though the instrumentation is the
  product's own code.

**Only `B` tokens are pinnable.** Asking which template provides `rate-limiting`
or `ssr` is a category error, and the check below relies on that.

## A declared `B` capability should have a provider

Nothing used to verify this: a product could declare `document-datastore`, pin
nothing, and pass every gate. `/vwf:doctor` now reports a **`B`** capability
declared by a project whose `backing_template` list contains no entry declaring
it — and stays silent on every `F` and `P` token, which have nothing to pin.

It is a **finding, not blocking**. Several `B` tokens have no template offering
them anywhere in the installed plugins, so halting `setup` and `execute` would
punish a product for a gap in the template library rather than for anything
wrong in its own repo. That trade changes once stack coverage is real; the
finding is written to be promotable without re-deciding its shape.

## Consumers follow the publisher

A capability is declared per project, but a capability is often **shared**: one
project publishes it and others consume it. When they do, the *provider* is the
publisher's — not each consumer's own.

**If project A publishes a capability backed by one cloud and project B consumes
it, B uses A's flavour, even when B's own cloud is a different one.** A shared
datastore has one implementation; a consumer that "uses its own cloud's" is not
consuming the same capability at all, it is standing up a second one.

Two consequences worth stating, because both are otherwise discovered late:

- **A consumer's cloud pick is not a vote.** It decides where that project runs
  and what *it* publishes. It never re-decides a capability it only consumes.
- **The publisher is a registry fact, not a convention.** Record which project
  publishes each shared capability, so `plan` and `execute` resolve the provider
  the same way every time rather than inferring it from whoever asks first.

This rule is why a capability plugin holds the **contract** and a cloud plugin
holds the **flavour**: the contract is what a consumer codes against, and it is
identical whichever provider the publisher chose.

## Prose nouns — how blueprint docs name these

A capability token answers *which* gate is open. Blueprint **prose** needs a
noun for the same thing, and that noun must be as stack-agnostic as the token:
the blueprint states that an order is written to **the datastore**, never to a
particular datastore product.

This is enforced by construction, not by discipline: since blueprint-format 16
the **registry carries no `stack`** — the concrete technology lives in
`.config/vwf.yaml` under `projects.<name>.stack`, which no blueprint author or
reviewer reads. A product name appearing in a blueprint doc therefore came from
somewhere it should not have, and is a reviewer failure.

| Capability                                   | Prose noun                       |
| -------------------------------------------- | -------------------------------- |
| `document-datastore`, `relational-datastore` | the datastore                    |
| `object-file-storage`                        | object storage                   |
| `cache-layer`                                | the cache                        |
| `search-index`                               | the search index                 |
| `message-queue`, `pub-sub`                   | the queue / the event bus        |
| `durable-workflows`, `scheduled-jobs`        | the worker (by registry project) |
| `realtime-sync`, `realtime-location`         | the realtime channel             |
| `push-notifications`, `email`, `sms`         | the push / email / SMS provider  |
| `third-party-auth`                           | the identity provider            |
| `payments-subscriptions`                     | the payment provider / the store |
| `maps-navigation`                            | the maps provider                |
| `distributed-tracing`                        | telemetry                        |

## Nouns for things that are not capabilities

The table above covers **backing services**, because those are what a capability
token names. But blueprint prose keeps reaching for a second group — the
developer-facing machinery every product sits on — and with no noun offered, the
product name goes in instead. These are the ones observed leaking:

| Instead of                        | Write                                              |
| --------------------------------- | -------------------------------------------------- |
| Git, GitHub, GitLab               | version control / the version-control host         |
| "gitignored", "in `.gitignore`"   | ignored by version control                         |
| "the main checkout", "the worktree" | the primary checkout / an isolated checkout       |
| the default branch's product name | the default branch                                 |
| npm, PyPI, crates.io              | a package registry                                 |
| GitHub Actions, GitLab CI         | the continuous-integration workflow                |
| Docker, Podman                    | the container runtime                              |
| VS Code, JetBrains, a named agent | the editor / the agent host                        |

**These are not capability tokens** and never appear in a registry
`capabilities:` list — they are prose nouns only, and they live here because
this is the file every author already reads for the same purpose.

The **plugin contract's** carve-out sits beside this and is genuinely different:
a plugin flow **must** name its host's extension mechanism, because that choice
decides what the host supplies. See the plugin-contract reference; do not
generalize it past the extension model.

**Two carve-outs**, where a real product name is the contract:

- **`environment.md`** — a secret's **issuer** is a fact about the world
  ("issued by the payment provider's dashboard"); name it where naming it is the
  point.
- **`conventions.md#integrations`** — the integrations anchor records *which*
  external services the product depends on. That is the one place the product
  names belong, so every other doc can refer to "the payment provider" and stay
  true if the provider changes.

Everywhere else — flows, entities, schemas, API contracts, `product.md`,
`architecture.md` — use the noun. A flow that changes when you swap providers
was describing the provider, not the flow.
