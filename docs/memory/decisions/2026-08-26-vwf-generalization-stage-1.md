# Decisions — generalization Stage 1: the three menu gaps, settled

**Date** 2026-08-26 · **Branch** `main` (worked in place, per the plan's
constraint) · **Plan**
`docs/plans/archived/2026-08-26-vwf-generalization/index.md` Stage 1 · **Ships
in** vwf 19.1.0

Mirrors the mempalace drawer (wing `ai-plugins`, room `decisions`); both stores
written together, per `plugins/vwf/assets/memory.md`. The boundary against the
stackgen plan was fixed first, in
[its own drawer](2026-08-26-generalization-vs-stackgen-wave-c-boundary.md).

Five decisions, not three: walking 1c surfaced a consequence the plan had not
found, and it had to be settled before 1c could be implemented.

## 1c — `cli` joins the `system` role's platform list

Chosen over a `delivers:` registry field (`vwf_registry: 3`, blueprint format
24, a migrate pass — for a distinction nothing branches on) and over prose-only.

**It cost less than the plan estimated, and the plan's blast-radius table was
wrong in both directions.** Every gate keys on the **platform token**, not the
role — Terminal UX, the screens/mockups exemption, the `deploy/npm-package` pin
— so no consumer changed. But three sites said "a `cli` **frontend**" and had to
be decoupled, none of them listed: `architecture/references/platforms.md`,
`architecture/references/stack-menu.md`, and `assets/vwf-config.md:333`.

**`vwf-config.md:333` was deliberately left alone.** It sits inside a historical
`config_format` migration delta, and a repo still on that format could only have
had a `frontend` CLI — `cli` was frontend-only when that migration was written.
Correcting it would falsify the record.

**No blueprint-format bump.** Nothing retires a spelling, existing registries
stay valid, and re-typing an installer is a judgment call rather than a
mechanical migration. Contrast format 23, which genuinely *lifted* `plugin`'s
coverage exemption.

**Which role to pick** is now an elicited question rather than a default: a CLI
end users run is `frontend`; one that builds, scaffolds, installs or delivers
something else is `system`. Recorded in `architecture/references/platforms.md`
along with the fact that **nothing downstream keys on the answer** — picking
wrong misdescribes the project, it does not misconfigure it.

## 1c tail — `cli` is excepted from the blueprint-coverage exemption

**The consequence the plan missed, and it would have been silent.**
`blueprint-surveyor.md` exempts "projects whose platforms are all exempt (`iac`,
and every `data`/`system` platform)". That list is phrased **by role**, so
moving `cli` into `system` would have swept every CLI project out of blueprint
coverage — including this repo's `installer`, which is covered today.

`cli` is now excepted alongside `plugin`, at both sites
(`agents/blueprint-surveyor.md`, `skills/architecture/SKILL.md`). Coverage is
**preserved, not lifted**, which is why no format bump follows.

Rejected: re-phrasing the exemption by explicit token list at both sites. It
fixes the class rather than the instance and is genuinely more robust — worth
reconsidering if a second platform ever moves roles.

Not at risk, and worth not confusing with it: the **screenless** exemption
already names `cli` separately from "every data/system platform"
(`standard-flows.md:101`, `blueprint/references/platforms.md:13`). Two different
exemptions; only the coverage one was role-phrased.

## 1b — a `cli` project's `doc_unit` is `module`, as a stated row

It stops being a fall-through. The decision turns on one thing: a `schema.yaml`
reading `N/A — <reason>` counts as present **only** on a `module` doc unit
(`blueprint-surveyor.md:51`). A CLI's contract is commands, flags and exit codes
— no data shape — so under the old `entity` fall-through every one of them had
to invent a schema to pass the surveyor.

No new token. `command` was rejected: it costs a vocabulary addition everywhere
`doc_unit` is read for behaviour identical to `module`.

Note this composes with 1c for free — `doc_unit` follows platforms, not roles,
so the answer is the same whichever role the CLI carries.

## 1a.1 — a kind marker per token; the domain grouping stays

The nine subject-domain groups are unchanged, because they are what the
`/vwf:architecture` MCQ reads out and domain is the axis someone picking
capabilities thinks along. Each token additionally carries **`B`** (backing
service), **`F`** (product foundation) or **`P`** (project-axis fact).

Rejected: regrouping by kind (costs the elicitation its domain menu) and a
two-axis table (rewrites the whole section so the MCQ must reconstruct groups
from a column).

Three classifications carry their reasoning in the asset, because each looks
like the neighbouring kind:

- **`third-party-auth` is `B` but `custom-claims-rbac`/`operator-rbac` are `F`**
  — an identity provider does not decide your roles.
- **`cms-content` is `B`, alone in Web rendering** — `ssr`/`ssg`/`seo` are
  rendering strategies the project template settles.
- **`distributed-tracing` is `B`** — the sink is a backing service even though
  the instrumentation is the product's own code.

`cms-content` was **not classified in the plan at all**; the plan's token
inventory missed it.

## 1a.2 — the missing-provider check is a finding, never blocking

`/vwf:doctor` §5 now reports a **`B`** token a project declares that none of its
`backing_template` pins provides, and stays silent on `F` and `P`, which have
nothing to pin. This closes the hole the plan called *arguably the actual 1a*: a
product could declare `document-datastore`, pin nothing, and pass every gate.

**Non-blocking, and the reason is about vwf, not the user.** Nine `B` tokens
have no template offering them anywhere in the installed plugins —
`search-index`, `pub-sub`, `realtime-location`, `email`, `sms`, `voice-audio`,
`operator-rbac`, `payments-subscriptions`, `maps-navigation`. Blocking would
halt `setup` and `execute` over a gap in the **template library**. The finding
is written to be promotable to blocking after Wave C without re-deciding its
shape.

The check also honours **consumers follow the publisher** — a capability this
project only consumes is the publisher's pin, so a consumer with
`backing_template: []` is correct rather than drift.

## 1a.3 — deferred, and binding

Already settled in the boundary drawer: **no backing template is authored by
this plan.** If a non-cloud document store is genuinely needed it is a Wave C
item, and this repo re-declares its capability meanwhile — the live reading
being that `docs/memory/` plus a Qdrant index is closer to `search-index` than
to `document-datastore`.

## Still open

Stage 3 (hand off to WS2) and Stage 4 (the stale
`docs/design/language-plugins-and-product-templates.md`) have not run.
