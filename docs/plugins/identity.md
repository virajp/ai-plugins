# identity plugin

The `identity` plugin is a **capability plugin** for vwf. A capability plugin
holds the neutral contract — what *any* provider must be able to do to serve a
vwf product — and the concrete provider lives with whoever owns it. That is the
same shape as vwf's stack-adapter contract, one level down: **the capability
states the requirement, the provider states the mechanism.**

So this plugin ships two things and no more: the identity contract, and the one
provider that belongs to no cloud — any **OIDC** issuer, self-hosted or managed.
Firebase Auth, Identity Platform and every other managed flavour come from the
project's own cloud plugin, and vwf renders the union of both menus.

It realizes the `third-party-auth`, `custom-claims-rbac` and `operator-rbac`
capability tokens. Blueprint prose calls the provider **the identity provider**
— never a product name.

## Install

```sh
pnpx @askviraj/ai-plugins --user identity
```

The plugin is opt-in, so it is excluded from `--all` and installed by name.

## The contract

`assets/contract.md` states five requirements without naming a provider:

| Requirement                | Why it is in the contract                                                                                                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Issue a verifiable token   | The product's own services verify it in middleware on **every** authenticated route — not once at a gateway and trusted thereafter. Signature, issuer, audience, expiry, in that order. |
| Publish its keys           | Rotation must not require a redeploy, so the verifier fetches and caches signing keys rather than carrying one.                                                                         |
| Revoke                     | A disabled principal stops being able to act within a bounded, stated window. No revocation path forces a per-request status check — a decision to record, not discover.                |
| Carry an account status    | `banned` / `to_be_deleted` and their coded responses, readable by the product.                                                                                                          |
| Support the operator plane | The people who run the product authenticate too, and their authorization is not the end-users' shape.                                                                                   |

### The claims rule

**A token claim carries account status only, never roles.** This is the single
most consequential rule in the contract, and every provider tempts you to break
it. Three reasons, all of which bite in production:

- A per-user claim cannot express per-resource authorization. "Is an editor" is
  not an answer to "may edit *this* document".
- Claims are **stale until the token refreshes** — revoking a role that lives in
  a claim does not revoke it now.
- Claims are size-capped, and the cap is reached exactly when the model is
  already wrong.

Authorization is therefore read per request, from the datastore, against the
resource being acted on. **The token answers *who*; the product answers *may*.**

The access rule follows: a project reaches the provider only through the shared
services layer, and no project imports a vendor SDK directly. Client-side
sign-in is the one allowed exception — the sign-in surface talks to the issuer,
and every server route re-verifies regardless of what the client claims to have
done.

Out of scope by design: which provider (the user's pick), the authorization
model (a blueprint contract, authored per product against its entities), and the
verification library (the project's language plugin).

## Self-hosted provider

One backing template, `oidc` — *OIDC issuer*.

Identity as an **open protocol** rather than a product: any issuer speaking
OpenID Connect. Pick it when the product must stay portable across providers,
when an enterprise customer will bring their own issuer, or when the operator
plane needs a directory the product does not own. The trade against a cloud's
managed identity is stated plainly: no bundled client SDK, no pre-wired console
and no emulator — you get a protocol and its guarantees, and everything above
them is yours.

What the template pins down:

- **How it satisfies the contract** — JWT signature, `iss`, `aud` and `exp`
  validated on every authenticated route, against JWKS keys discovered through
  `/.well-known/openid-configuration` and cached by `kid` so rotation needs no
  redeploy. Account status is read from the datastore keyed on `sub`, the only
  durable identifier the protocol guarantees.
- **Revocation is the protocol, not a misconfiguration.** An access token stays
  valid until it expires, so lifetimes stay short and the refresh path is the
  revocation point; revoke-now means a per-request status check.
- **The traps that actually bite.** Never treat the ID token as an API
  credential. **Validate `aud`** — a signature-only check accepts a valid token
  minted for a different application at the same issuer, and it is the most
  common real hole. Cache discovery, or it is a network call in the request
  path. Multi-issuer is a design decision: accept more than one and the
  principal key becomes `(iss, sub)` everywhere, including every foreign key.
- **Cost shape.** Self-hosted, the cost is operational — an issuer is on the
  critical path of every request. Managed, it is almost always per monthly
  active user, which grows with reach rather than with usage.
- **Local stack.** A docker-composed issuer behind a `wait-on` readiness gate,
  seeded with the test principals the acceptance suite needs. Where running a
  real issuer locally is not worth it, verification stays behind a seam with an
  injected fake — but the template says to *say so*, because a product whose
  tests never verify a real token has never tested `aud`.
- **Secrets.** Client secrets and issuer credentials are injected as environment
  variables and catalogued by name in `docs/blueprint/environment.md`. Public
  clients hold no secret at all and use PKCE.

## Cloud flavours

A managed identity service is **not** here, by design. The project's cloud
plugin supplies it and vwf asks that plugin separately:

| Plugin                        | Flavours                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| [gcp](./gcp.md)               | Firebase Auth via the `firebase` template; Identity Platform via the `cloud-sql` template |
| [cloudflare](./cloudflare.md) | none today — that plugin is parked at Zero Trust Access                                   |

The menu skill never lists another plugin's template, and never fills a gap from
general auth knowledge: if a provider is not in the list, this plugin does not
offer it. Since `config_format` 14 there is no `template: custom` fallback — vwf
halts and names the two ways forward: install a plugin that ships it, or write
one.

The cross-project rule lives in vwf's `capability-vocabulary.md` rather than
here: **consumers follow the publisher.** If project A publishes a capability
backed by one cloud and project B consumes it, B uses A's flavour even when B's
own cloud differs. For identity this is the common case — one issuer, many
projects verifying against it.

## Skills

Two skills, both the vwf **stack adapter**. Neither auto-applies; both are
invoked by `/vwf:architecture` and `/vwf:setup` when `identity` is listed in the
product's `stacks:`.

| Skill                     | What it returns                                                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `identity-stack-menu`     | The template above as a vwf menu payload — slug, axis, name, one-line summary — plus a `note` on every answer saying managed flavours come from the cloud plugin         |
| `identity-stack-template` | One template as a vwf template payload: axis fields, the capability tokens it realizes, per-capability harness mechanisms, and the conventions `plan` and `execute` read |

Both are `invocation: both`, and that is load-bearing rather than stylistic: a
`user` skill is removed from the model's context entirely and **cannot be
invoked by vwf**. The failure is silent — vwf does not get an error, it gets an
empty menu.

An unknown slug is an **error**, not a guess: the template skill names the slugs
that do exist and adds that a managed identity service comes from the cloud
plugin.

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the full
  plugin list.
- [vwf plugin](./vwf.md) — the workflow that asks for a stack menu, and the
  stack-adapter contract this plugin implements.
- [gcp plugin](./gcp.md) — where the managed identity flavours come from.
- [datastore](./datastore.md) — where authorization is actually read from, per
  the claims rule.
- [observability](./observability.md), [orchestration](./orchestration.md),
  [object-storage](./object-storage.md) — the other capability plugins, same
  shape.
