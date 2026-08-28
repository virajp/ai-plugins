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

The output is a **Cloud-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): one `cloud-provider`
component plus one `cloud-service` component per service the product
uses. The bar splits the same way — four provider topics carried once by
the provider component, five service topics carried by **every**
`cloud-service` component, plus a three-topic extension where the
service's category is `compute`. The seam between the halves is
citation: a service topic **cites the provider doctrine, never restates
it**.

- **Axis**: `backing` + `deploy` (a `compute` service is a deploy
  target; the rest are backing).
- **Structure**: the **topic bar** below, hung per the kind-general rule
  — one artifact per topic behind a lean router skill. Judgment skills
  are reference-shaped, not paths-scoped: there is no file glob that
  means "thinking about the cloud".
- **Scope**: the judgment an SDK reference cannot give. Never the deploy
  mechanics vwf's delivery-pipeline contract owns, never a vendor SDK in
  product code (the observability rule: OTLP out, sinks not SDKs).
- **Facts**: provider CLI presence, the auth/project check doctor can run,
  emulator availability per service used.
- **Invocation**: everything model-invocable; nothing paths-scoped.

### The topic bar

One artifact per topic, each individually researched and cited.
Extracted from the curated archetype — the `gcp` plugin: its
provider-wide judgment skills and its service and deploy templates.

**Provider-component topics** — four, the provider-wide judgment that
spans services:

1. **Cost doctrine** — the provider's billing-model principle, the
   day-one guardrails (budget alerts, environment attribution, labels),
   a cost review checklist; never dollar figures.
2. **Identity & IAM** — the workload identity shape (one identity per
   workload, never the default), keyless auth, the roles broader than
   they look, a privilege review checklist.
3. **Local development map** — which services have emulators,
   substitutions where none exists, the fidelity trap, wiring via env
   vars.
4. **Networking & private plane** — invisible-to-the-internet rather
   than merely authenticated, internal ingress, the provider's
   mechanisms. Provider-wide by ruling: compute services cite it rather
   than each restating it.

**Cloud-service-component topics** — five, for every `cloud-service`
component in the bundle:

1. **Pick & trade** — when this service is the answer, and when it
   stops being it.
2. **Service doctrine** — the service's own usage rules; where it
   realizes a blueprint capability, clause-by-clause contract
   satisfaction citing the category doctrine.
3. **Cost shape** — this service's billing model and its trap, citing
   the provider cost doctrine, never restating it.
4. **Identity shape** — the least-privilege grants this service needs,
   citing the provider IAM doctrine.
5. **Local dev** — this service's emulator, or its substitution where
   none exists.

**Compute-category extension** — a `cloud-service` in category
`compute` is a deploy target and carries three more:

6. **Artifact** — the image contract: one multi-stage Dockerfile, the
   same digest promoted across environments.
7. **Pipeline** — release wiring behind mise tasks, satisfying vwf's
   delivery-pipeline contract.
8. **Health** — readiness/liveness wiring against vwf's `health`
   harness capability.

### Depth

The `language-bundle` band applies unchanged: each topic's artifact is
**60–130 dense lines of judgment**.

## `repo-gate` — the gates that run over the whole repo

The output is a **Repo-Gate-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): the `toolchain-gate`
components that apply to a repository as a whole rather than to one
toolchain inside it. It is the only kind rooted at the `repo` axis, and the
only one a polyglot repo materializes **once** rather than per language.

**The seam with `language-bundle` topics 9–10, which is the whole reason
this kind exists.** A gate whose config is meaningful only for one toolchain
— a JavaScript linter, a Rust clippy table — is topic 10 of *that
language's* bundle and never appears here. A gate that runs over every file
regardless of what language wrote it belongs here. Getting this backwards is
how a polyglot repo ends up with three secret scanners, one per language
bundle, each with its own allowlist.

- **Axis**: `repo`.
- **Structure**: the **topic bar** below — but **no router skill**. Each
  gate is one self-contained paths-scoped skill bound to its own config
  file, which is how the curated archetype ships them; there is no
  on-demand reference tier to route to, because a gate's doctrine is one
  screen of judgment and its config is one file.
- **Scope**: what each gate must catch, what it must not scan, and how a
  finding is answered. Never the language's lint rules — those are the
  language bundle's. Never CI system syntax — that is the reserved
  `ci-system` kind's.
- **Facts & harness**: gates satisfy no vwf harness capability, so
  `harness:` is `n/a` throughout. What they contribute is the `repo`-axis
  fact of **one task name per gate**, which is what topic 5 exists to pin.
- **Invocation**: every gate skill paths-scoped to its config file and
  **not** user-invocable — a gate the model applies while editing the file
  it governs, never a command someone runs.

### The topic bar

A closed list of five topics, one artifact per topic, each individually
researched and cited. Extracted from the curated archetype — the `devtools`
plugin's five repo gates. A gate the repo has no surface for is recorded
`n/a`, never silently absent.

1. **Format authority** — one formatter for the repo, one root config,
   plugins pinned by version, generated trees excluded, and the escape
   hatch for languages the formatter has no plugin for. Formatting only:
   correctness belongs to the linter, and saying so is part of the topic.
2. **Secret scanning** — the working tree on every commit and the history
   once; allowlist by fingerprint rather than by rule; and the rule that a
   hit is a credential to **rotate**, never a line to silence.
3. **Dependency vulnerability scanning** — the source tree per commit and
   the built artifact before release; the severity threshold that fails a
   run; and time-boxed ignore rules, since an ignore with no expiry is a
   permanent silence nobody re-reads.
4. **Hook running** — the local gate: hooks that call the repo's task
   library so the identical command runs locally and in CI, revs pinned and
   updated deliberately, and `files:` scoping so a hook fires only for what
   it validates.
5. **Gate wiring & CI parity** — every gate reachable as one task name, the
   same task names run in CI, cheap gates ordered before expensive ones,
   and the exclusion set stated **once** rather than drifting per gate.
   This topic is what makes the gates a bundle rather than unrelated tools.

The bar maps onto components one-to-one for topics 1–4 — one
`toolchain-gate` component each. **Topic 5 belongs to the hook-runner
component**, because that is where gates are actually wired and where local
and CI are made to run the same command; it is the one topic that is about
the others rather than about a tool of its own. A repo with no hook runner
records topic 5 `n/a` and loses the parity guarantee with it, which is worth
saying out loud rather than discovering later.

### Depth

The `language-bundle` band applies unchanged: each topic's artifact is
**60–130 dense lines of judgment**. The curated archetype's five gate skills
sit at 73–90 lines, which is the band's evidence.

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
the kind's ruling. For all four kinds the structural checklist **is the
topic bar** — every non-`n/a` topic covered by the composition, each
artifact inside the depth sizing. For `database` the composition is the
instance component alone, and citing rather than restating the category
doctrine is part of the bar. For `cloud-provider` the composition
supplies the bar in halves — the provider topics by the `cloud-provider`
component, the service topics by each `cloud-service` component, the
extension by category — and the cite-not-restate seam between service
topics and provider doctrine is part of the bar. For `repo-gate` the
composition is the gate components together, and one check carries the
kind: a **language-specific** linter or formatter appearing here is a gap,
because it belongs to topic 10 of its language bundle.
