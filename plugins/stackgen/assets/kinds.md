# Kinds — the Vocabulary of What Can Be Generated

Every pack and every generation run declares a **kind**, and the kind — not
the run — decides the output's structure and scope. That is what keeps
generated output deterministic in *shape* while only its content varies, and
it gives the `stackgen-skill-reviewer` a structural checklist per kind on
top of catalog fidelity.

A kind defines four things:

1. **Structure** — which artifacts it produces
   (`${CLAUDE_PLUGIN_ROOT}/assets/output-tree.md` vocabulary: skills,
   agents, hooks, rules) and their internal shape.
2. **Scope** — what its prose owns and what it must not touch.
3. **Facts** — what the template payload emits for `/vwf:doctor`.
4. **Invocation mode** — how each produced skill is wired (paths-scoped
   auto-apply vs model-invocable reference), because a wrong mode fails
   silently.

The seam between kinds is vwf's **capability vocabulary**: a language bundle
says "the datastore", never a database by name; a database kind never names
a framework. Generating two kinds together must not weld them — each stays
independently re-syncable.

One structural rule is kind-general: **one artifact per topic, loaded only
on demand**. Each bar topic lands as its own artifact, and every artifact
hangs lazily — a reference behind a **lean router skill**, or paths-scoped
to the files it governs — so nothing enters a session until the work at
hand needs it. The bar decides what must exist; this rule decides how it
hangs.

## `language-bundle` — the composition rooted at a `language` component

The bundle is a `language` component plus its `package-manager`,
`framework` and `toolchain-gate` components
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`). It lands as **one run**, but
research, citations and versions stay per component, so a framework's
major bump regenerates one component without churning the language
baseline.

- **Axis**: `project` (the package-manager component contributes the
  `repo` axis facts).
- **Structure**: the **topic bar** below — one artifact per topic, hung on
  the archetype shape (the `typescript` plugin, the most mature language
  plugin): a **lean router skill** per language → on-demand `references/`
  for the reference-shaped topics, plus one paths-scoped doctrine skill or
  rule per config file the toolchain owns (manifest, compiler config,
  lint/format config). Hooks only from packs (e.g. a command normalizer);
  generation never emits scripts.
- **Scope**: layout, idioms, testing shape, placement. Never API reference
  (Context7 serves that at use time), never the datastore's or cloud's
  judgment.
- **Facts**: per language — `lsp` (how a language server is provided;
  stackgen ships none, so this recommends the mise tool or marketplace
  plugin that does), `mise_tool`, `manifest`.
- **Invocation**: router skill model-invocable; doctrine paths-scoped
  (`**/*.<ext>` plus the config files); rules for one-screen constraints.

### The topic bar

A closed list of twelve topics the output must cover, one artifact —
reference, skill, or rule — per topic, each individually researched and
cited. Conditional topics are marked; a conditional that does not apply is
recorded `n/a`, never silently absent.

1. **Standards** — module split, naming, placement, composition root, type
   discipline.
2. **Framework doctrine** — one reference per detected `frameworks:`
   entry, under the framework ruling below. *(conditional on detection)*
3. **Error handling** — the language's error model applied; the
   one-mapping-home rule; panic/exception policy.
4. **Async/concurrency model** — runtime, blocking rules, cancellation.
   *(conditional — `n/a` where the stack has none)*
5. **Testing** — unit/integration/e2e placement, in-process idioms,
   coverage stance.
6. **Build & run** — dev loop, release builds/profiles, task wiring.
7. **Manifest discipline** — paths-scoped skill or rule on the manifest:
   dependency hygiene, feature flags, versioning.
8. **Package manager & workspace** — lockfile discipline, supply-chain
   posture including the ecosystem's own audit tooling (the
   `cargo audit`/`deny` class); repo-generic scanners stay repo-gate
   territory, never here. *(workspace half conditional)*
9. **Compiler/toolchain config** — toolchain pinning, profiles, lint
   tables.
10. **Lint & format gate** — wired as tasks.
11. **Config & env** — names-not-values, aligned with `environment.md`.
12. **Observability wiring** — the language's idiomatic emission hook only
    (e.g. `tracing`), never the pipeline contract — that stays the
    observability capability's domain.

The bar maps onto the component types: topics 1, 3–6 and 11–12 belong to
the **`language`** component; 7–8 to the **`package-manager`** component;
9–10 to **`toolchain-gate`** components; topic 2 is one artifact per
**`framework`** component. The reviewer verifies the *composition* covers
the bar, whichever components supply each topic.

### The framework ruling

**Selection-neutral, usage-opinionated.** Generation never opines on which
framework — the pin and the packs own selection; minimalism owns
whether-at-all — but it is strongly opinionated on usage, every opinion
tracing to a source, in precedence order: (1) **detection** — the repo's
settled pattern wins; (2) the framework's **own documented
recommendation**, cited; (3) a **catalog entry** instantiated, cited. A
genuinely split ecosystem choice with no detection signal is presented as
an **open decision** with real options — never fake consensus — and
recorded when the user settles it.

**Materiality**: one judgment reference per `frameworks:` entry —
written-against, so removing the framework means rewriting the reference.
**Dependencies get no reference** — a line in manifest doctrine at most;
Context7 serves their API at use time. Each framework reference owns its
own seam and names neighbors only through the capability vocabulary;
cross-framework integration judgment lives in standards (topic 1), never
in per-pair references.

### Depth

Each artifact is sized like the curated archetype's references — the
`typescript` plugin's router-skill references: **60–130 dense lines of
judgment**. Shorter usually means the research stopped early; longer
usually means API surface crept in.

## `database` — a datastore the product runs against

The output is a **Datastore-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): the category-level doctrine —
the neutral datastore capability contract — plus one **instance component**
(`type: datastore`, or a cloud's `cloud-service` with a datastore
category). All six bar topics belong to the instance component; the
category doctrine is what the instance **cites, never restates**.

- **Axis**: `backing`.
- **Structure**: the **topic bar** below, hung per the kind-general rule —
  one artifact per topic behind a lean router skill, plus a rule for the
  migration directory when one exists.
- **Scope**: when this store is the answer and how it is operated and
  accessed well. It realizes the neutral datastore contract by citation;
  it never restates it, and it never reaches into the language bundle's
  layout.
- **Facts & harness**: the `local_stack` mechanism is fixed by vwf's
  harness contract — Docker-composed service behind a `wait-on` readiness
  gate — so the kind emits that task plus the client tool and healthcheck.
- **Invocation**: the router paths-scoped to the data layer and migration
  paths; its references load on demand.

### The topic bar

A closed list of six topics, one artifact per topic, each individually
researched and cited. Extracted from the curated archetype — the
`datastore` plugin's contract and its `postgres` template.

1. **Pick & trade** — when to pick this datastore, and when it stops
   being the answer.
2. **Data model constraints** — what the store forces on the blueprint's
   entities: denormalization pressure, index limits, the query patterns
   it punishes.
3. **Contract satisfaction** — clause by clause against the neutral
   datastore capability contract (record versioning/optimistic
   concurrency, atomic multi-record writes, server-generated time,
   forward-only migrations), citing the category doctrine per clause,
   never restating it.
4. **Connection & access shape** — pooling as a design decision,
   connection limits, the client-direct exception where it applies, and
   credentials: env-injected names-not-values catalogued in
   `environment.md`, identity-based auth preferred so no password exists,
   throwaway local-stack creds.
5. **Cost shape** — the billing model and its traps, never dollar
   figures.
6. **Local stack** — the real engine composed behind a `wait-on` gate (or
   its emulator), pinned to production's major version; a seam plus a
   fake where the store is hosted-only.

### Depth

The `language-bundle` band applies unchanged: each topic's artifact is
**60–130 dense lines of judgment**.

## `cloud-provider` — where the product runs and what it uses there

**Topic bar pending elicitation.** The structure below is a sketch, not a
settled bar, and the reviewer must not enforce one — a bar that was never
settled would be enforced opinion nobody agreed to.

- **Axis**: `backing` + `deploy`.
- **Structure** (archetype: the `gcp` plugin): a **model-invocable judgment
  skill** — which service to pick and when it stops being the answer, how
  each bills, least-privilege IAM, which services have local emulators —
  plus deploy-template conventions. Judgment skills are reference-shaped,
  not paths-scoped: there is no file glob that means "thinking about the
  cloud".
- **Scope**: the judgment an SDK reference cannot give. Never the deploy
  mechanics vwf's delivery-pipeline contract owns, never a vendor SDK in
  product code (the observability rule: OTLP out, sinks not SDKs).
- **Facts**: provider CLI presence, the auth/project check doctor can run,
  emulator availability per service used.

## Reserved kinds (defined at their merge wave, not before)

- **`ci-system`** — the `cicd` plugin's shape: neutral rules shared, one
  reference per CI system. Arrives when `cicd` merges.
- **`capability-provider`** — the flavour half of the capability plugins
  (an identity issuer, a telemetry sink, a queue/workflow engine). Arrives
  with Wave B.

Naming a kind here is deliberate minimalism: defining structures for kinds
nothing generates yet would be speculation; naming them stops Wave B/C from
inventing shapes ad hoc.

## What the reviewer checks per kind

Beyond catalog fidelity and citations, the `stackgen-skill-reviewer`
verifies the artifact against its declared kind: every structural element
the kind requires is present (a `database` output without a `local_stack`
mechanism is a gap), nothing outside the kind's scope crept in (a language
bundle naming a database is a gap), and each skill's invocation mode matches
the kind's ruling. For `language-bundle` and `database` the structural
checklist **is the topic bar** — every non-`n/a` topic covered by the
composition, each artifact inside the depth sizing. For `database` the
composition is the instance component alone, and citing rather than
restating the category doctrine is part of the bar. For `cloud-provider`
no bar exists yet: the reviewer checks scope, facts and invocation only,
and never invents a structural checklist this file has not settled.
