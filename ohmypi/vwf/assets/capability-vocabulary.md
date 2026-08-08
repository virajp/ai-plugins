# Capability Vocabulary

Shared by `/skill:architecture` (the registry elicitation offers these tokens as
MCQ options) and the `architecture-writer` agent (which records them). Keep this
list the single source of truth; both surfaces read it rather than carrying
their own copy.

Capabilities are stack-agnostic feature flags — the gates that decide which
deep, stack-specific questions `blueprint` asks. Pick all that apply per
project; add Other for anything not listed. Extensible — add new capabilities as
the system grows.

- **Data & storage:** `document-datastore`, `relational-datastore`,
  `object-file-storage`, `cache-layer`, `search-index`
- **Async & messaging:** `durable-workflows`, `message-queue`, `pub-sub`,
  `scheduled-jobs`
- **Realtime & comms:** `realtime-sync`, `realtime-location`,
  `push-notifications`, `email`, `sms`, `voice-audio`
- **Auth & identity:** `third-party-auth`, `custom-claims-rbac`, `operator-rbac`
- **Commerce:** `payments-subscriptions`
- **Geo:** `maps-navigation`
- **Web rendering:** `ssr`, `ssg`, `cms-content`, `seo`
- **Mobile:** `offline-first`, `deep-linking`, `device-permissions`
- **Observability & governance:** `distributed-tracing`, `audit-log`,
  `rate-limiting`, `runtime-settings`

## Prose nouns — how blueprint docs name these

A capability token answers *which* gate is open. Blueprint **prose** needs a
noun for the same thing, and that noun must be as stack-agnostic as the token:
the blueprint states that an order is written to **the datastore**, never to
Firestore or Postgres.

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
