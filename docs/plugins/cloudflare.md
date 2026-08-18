# cloudflare plugin

The `cloudflare` plugin is a **vwf stack adapter for Cloudflare**, and its scope
is **deliberately parked**.

It covers **Zero Trust Access, and nothing else**: putting a project that must
not be publicly reachable behind an identity-aware proxy on its own hostname,
independent of which cloud actually hosts it.

> **Not offered here:** Workers, Pages, R2, D1, KV, Durable Objects, Queues,
> Images and Stream. They arrive under their own dedicated plan. Nothing in this
> plugin will answer for them, and nothing in it will improvise one from general
> Cloudflare knowledge — an unknown slug is an error that names the slugs that
> do exist, not a guess.

**The menu says what it does not cover, on every answer.** That is the point of
parking it in the open rather than shipping a short list: a menu that comes back
quietly short is indistinguishable from a broken adapter, which is the exact
failure mode the stack-adapter contract exists to prevent. The `note` field is
mandatory in the payload, including when the template list is empty.

## Install

Once, if you have not already:

```sh
claude plugin marketplace add virajp/ai-plugins
```

```sh
claude plugin install cloudflare@virajp-plugins
```

Add `--scope project` to either command to scope it to one repo instead of every
repo on your machine. There is no default install set — every plugin here,
`cloudflare` included, is installed by name — so install it when the product
actually needs a private plane in front of a project.

Then list it in the product's adapter roster:

```yaml
# .config/vwf.yaml
stacks: [ typescript, gcp, cloudflare ]
```

Listing it alongside a hosting cloud is the normal arrangement, not a
workaround: Zero Trust Access fronts a service, it does not host one, so it
composes with whichever `deploy` template actually runs the project.

## Skills

Two, both model-invocable, both reached by vwf through delegation at the exact
names the stack-adapter contract fixes. Neither is a general-purpose Cloudflare
skill.

| Skill                       | Answers                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudflare-stack-menu`     | The templates this plugin offers, as a vwf menu payload — **always carrying the parked-scope `note`**, including when the list is empty. |
| `cloudflare-stack-template` | One template as a vwf template payload: its axis fields, the per-capability `harness` block, and the template's prose as `conventions`.  |

Staying model-invocable is load-bearing rather than cosmetic. A skill marked
`disable-model-invocation: true` is removed from the model's context entirely
and cannot be delegated to, so vwf would receive an empty menu rather than an
error — the same silent failure the parked-scope note exists to rule out.
`mise run plugins:check` enforces it.

There is no `-ux-gate` skill: an access proxy owns no UI stack.

## Backing templates

**None.** Cloudflare's backing services — R2, D1, KV, Durable Objects, Queues —
are all inside the parked scope, so this plugin realizes no capability on the
`backing` axis today. Reach for [`gcp`](./gcp.md) or a capability plugin's own
provider instead.

This is stated rather than left blank on purpose; see the note at the top.

## Deploy templates

One.

| Slug                | Axis     | Artifact | What it decides                                                      |
| ------------------- | -------- | -------- | -------------------------------------------------------------------- |
| `zero-trust-access` | `deploy` | `n/a`    | Who can reach a project once its own deploy template has shipped it. |

**It composes with a hosting template rather than replacing one.** It produces
no artifact and runs no code — the project still ships however its own deploy
template says. Pairing the two is vwf's job; the template stays silent on where
the fronted project runs, and any cloud's deploy template composes with it.

What the template pins down:

- **When a project belongs behind it.** Anything whose user population is the
  team, an operator group or a named customer, and anything whose exposure has
  no upside. **Not** the product's public surface — an identity-aware proxy in
  front of a consumer app is a sign-in wall the product already has, plus a
  second identity system to keep in step with the first.
- **The policy shape.** Allow by *named group* membership sourced from the
  organisation's existing identity provider, never by email domain — a domain
  rule silently scopes in every new hire and every departed one. Deny by
  default, with exactly one bypass path: a service credential, for automation.
- **What the fronted project must expose.** Its origin must not be reachable
  except through the proxy — a hostname that answers directly is a private plane
  in name only, and the failure is invisible from the outside. The project
  verifies the proxy's identity assertion rather than trusting a header.
- **The two harness capabilities the proxy changes.** `health` — a probe that
  cannot get past the proxy measures the proxy, so either the readiness path is
  excluded from the policy or the probe presents the service credential; the
  silent version is a green dashboard in front of a dead service. And
  `e2e_staging` — a pre-production environment behind the proxy needs a service
  credential the test run can present, catalogued by name in
  `docs/blueprint/environment.md`, or the staging suite fails at the login page
  and reports it as an application error.
- **Cost shape.** Billing follows **seats**, not traffic — the population
  allowed through, not the requests they make. Cheap for an operator plane, the
  wrong shape for anything customer-facing, which is the scoping rule again from
  the other direction.

Locally the private plane does not exist and should not be simulated: runs reach
the project directly and the identity assertion is injected as a fake, through
the same seam the identity contract already requires.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and full plugin
  list.
- [vwf](./vwf.md) — the workflow this plugin adapts, and the stack-adapter
  contract it implements.
- [gcp](./gcp.md) — the cloud plugin with a full backing and deploy catalogue;
  its `cloud-run` and `gke` templates each name a GCP-native private plane, and
  either composes with Zero Trust Access.
- [identity](./identity.md) — the neutral identity contract, including the seam
  that makes the local fake possible.
