# gcp plugin

The `gcp` plugin is a **vwf stack adapter for Google Cloud**. It supplies the
judgment an SDK reference cannot: which service to reach for and when it stops
being the answer, how each one bills and the trap that multiplies it, which
services have a local emulator (and where the emulator lies), and the
least-privilege shape of an identity.

It carries **no API surface**. `gcloud` flags, client-library setup and role
catalogues are what Context7 is for; everything here is a decision you would
otherwise make badly once and pay for later.

Two rules hold across every file in the plugin:

- **Observability is OpenTelemetry only.** The product emits **OTLP** and a GCP
  service terminates it. GCP's observability services appear as *sinks*, never
  as vendor SDKs, so the product's instrumentation stays portable even though
  its backing is not.
- **The project axis is not ours.** GCP hosts code; it does not decide the
  language or framework a project is written in. No `gcp` template carries a
  `role`, and no menu entry from here competes with a language plugin's.

## Install

```sh
pnpx @askviraj/ai-plugins --user gcp
```

`gcp` is **opt-in** — it is excluded from `--all` and installed by name, because
most products are not on GCP and a cloud you do not use is noise in the menu.

Then list it in the product's adapter roster so vwf knows to ask it:

```yaml
# .config/vwf.yaml
stacks: [ typescript, gcp ]
```

The roster is product-wide; the per-project selections are not. One product can
run its site on one cloud and its API on another while both draw from the same
installed plugins — see the `stack` block in [vwf's config doctrine](./vwf.md).

## Skills

Five skills, all `invocation: both`. The two adapter skills are reached by vwf
through delegation, at the exact names the stack-adapter contract fixes; the
three judgment skills are also yours to invoke directly when you are choosing a
service, reviewing a design, or diagnosing a bill.

| Skill                | Answers                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gcp-stack-menu`     | Which templates this plugin offers on the `backing` and `deploy` axes, as a vwf menu payload — the payload and nothing else. The list is exhaustive; an absent composition is one `gcp` does not offer. |
| `gcp-stack-template` | One template as a vwf template payload: its axis fields, the per-capability `harness` block, and the template's prose as `conventions`.                                                                 |
| `gcp-cost`           | How each service bills and the design choice that multiplies it. **No dollar figures** — prices change and a stale number is worse than none. Billing *models* and their traps are stable for years.    |
| `gcp-iam`            | Least-privilege identity: one service account per workload, never a JSON key, the roles that are quietly over-broad, and why Firebase security rules are not IAM.                                       |
| `gcp-local-stack`    | Which services have a first-class emulator, which have none, and what the four fidelity gaps are that survive a green local run.                                                                        |

The two adapter skills must stay `invocation: both` — a `user` skill is removed
from the model's context entirely and cannot be delegated to, so vwf would get
an **empty menu** rather than an error. `mise run plugins:check` enforces it.

`gcp` ships **no `-ux-gate` skill**, and vwf never calls one on it. Rendering
screens belongs to the plugin owning a project's *project*-axis stack, not to
the cloud underneath.

## Backing templates

Two, and the choice between them is a data-model decision rather than a cloud
one.

| Slug        | What it composes                                                                                           | Local stack             |
| ----------- | ---------------------------------------------------------------------------------------------------------- | ----------------------- |
| `firebase`  | Firestore, Cloud Storage for Firebase, Firebase Auth / Identity Platform, FCM, Firestore listeners or RTDB | Firebase Emulator Suite |
| `cloud-sql` | Cloud SQL for PostgreSQL, Cloud Storage, Identity Platform, Memorystore, Pub/Sub + Cloud Tasks             | Docker Compose          |

**`firebase`** is the fastest path to a working product and the only option here
where *every* service has a first-class emulator — so tests run offline, with no
billing account and no shared-environment contention. It satisfies vwf's
`local_stack` capability **without Docker**, which is a legitimate answer and
not a gap to paper over with a compose file. Its cost shape is dominated by
per-document reads, so what a screen displays belongs in the document that
screen loads.

**`cloud-sql`** is the answer when the data model has real relationships, when
reporting queries matter, or when the product must stay portable off GCP —
Postgres, object storage and OIDC all have equivalents everywhere, and Firestore
does not. It bills for **provisioned capacity, not consumption**, which inverts
the instinct the rest of the plugin builds. Its template also carries the
connection trap that catches every serverless Postgres product, and the three
design decisions that prevent it.

Both route server access through a services layer rather than importing a vendor
SDK per project, and both terminate OTLP rather than instrumenting against an
observability SDK.

## Deploy templates

Two, both producing the same artifact — a container image in Artifact Registry,
promoted **by digest** across environments so the tested artifact is the
released one.

| Slug        | Take it when                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| `cloud-run` | The default for a `service` or `fullstack` project: serverless containers, scale to zero, no cluster to operate. |
| `gke`       | Workloads Cloud Run cannot host — long-lived stateful processes, sidecars, custom networking, operators.         |

`cloud-run` stays the right answer for longer than most teams expect. `gke`
carries a larger operational surface and a per-cluster cost floor that, below a
certain scale, exceeds the entire Cloud Run bill for the same workload; take it
deliberately, and take Autopilot unless you need node-level control.

Both templates obey **vwf's delivery-pipeline contract** — tag-triggered only,
`<project>-<env>-v<semver>`, branch-validated, tests gated — and both keep the
release behind a mise `release:*` task, which is what keeps the target
swappable. Writing the pipeline itself belongs to the [`cicd`](./cicd.md)
plugin; Cloud Build is deliberately not part of either stack, so there is
exactly one place a pipeline is defined.

Each template also names its **private plane** — internal-only ingress plus IAP
for `cloud-run`, a private cluster behind an internal load balancer for `gke` —
for a project that must be invisible to the public internet rather than merely
authenticated. [`cloudflare`](./cloudflare.md)'s Zero Trust Access is the
cloud-independent alternative, and composes with either.

A `frontend` project does not deploy here at all: it ships through its
platform's store or update channel and pins `deploy_template: n/a`.

## Capability flavours

`gcp` is where the **managed** flavour of a capability lives. The neutral
contract for each one belongs to its capability plugin —
[`datastore`](./datastore.md), [`identity`](./identity.md),
[`observability`](./observability.md), [`orchestration`](./orchestration.md),
[`object-storage`](./object-storage.md) — and the capability states the
requirement while the provider states the mechanism, one level down from the
stack-adapter contract itself.

`object-storage` is the case that makes the split visible: it ships no provider
of its own, because every object store is a cloud's. Cloud Storage is the
flavour this plugin supplies.

**Consumers follow the publisher.** If a project publishing a capability runs on
GCP, a project consuming it uses GCP's flavour even when its own cloud differs.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and full plugin
  list.
- [vwf](./vwf.md) — the workflow this plugin adapts, and the stack-adapter
  contract it implements.
- [cloudflare](./cloudflare.md) — the other cloud plugin, parked at Zero Trust
  Access.
- [cicd](./cicd.md) — writes the delivery pipeline these deploy templates
  describe.
- [devtools](./devtools.md) — Docker and the provider-neutral
  `container-generic` deploy template.
