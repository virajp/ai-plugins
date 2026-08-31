---
name: zero-trust-access
version: 0.1.0
category: development
description: >-
  Cloudflare Zero Trust Access as this product's private plane — when a
  project belongs behind an identity-aware proxy and when it does not, the
  policy shape least privilege demands, what the fronted project must
  expose and verify, seat-shaped cost, and what health and pre-production
  have to decide because the proxy sits in front of them.
license: MIT
allowed-tools: Read Grep Glob Edit Write Bash
---

# Cloudflare Zero Trust Access

An identity-aware proxy in front of a project that must not be publicly
reachable. This skill carries the judgment; policy-expression syntax,
connector flags and the API's current shape belong to Context7 at use
time.

Read the reference that matches what you are doing — one, not all of them.

| Doing | Read |
| --- | --- |
| Deciding whether a project belongs behind it | [Pick & trade](references/pick-and-trade.md) |
| Shaping the policy, or what the project must expose | [Service doctrine](references/service-doctrine.md) |
| Sizing, or explaining, the bill | [Cost shape](references/cost-shape.md) |
| Granting a group, or issuing a credential to automation | [Identity shape](references/identity-shape.md) |
| Running or testing the project on a laptop | [Local dev](references/local-dev.md) |

**Three rules that do not wait for a reference.** The policy allows a
**named group**, never an email domain. The project **verifies** the
identity assertion rather than trusting the header that carries it. And
where the project runs is not this stack's business — it fronts a service,
it does not host one.

The rule this skill leans on hardest is the provider's, not its own: an
origin reachable without the proxy makes the whole arrangement decorative.
That is the `cloudflare` skill's networking and private plane reference,
cited throughout here and restated nowhere.
