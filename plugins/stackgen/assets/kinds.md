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

## There is no line cap on any artifact

Deliberately, and it is the corollary of the rule above. A skill puts only
its **description** in context; its body loads when it activates, and a
`references/` file only when something reads it. Length is therefore not
what costs — **loading** is what costs, and lazy hanging is what already
pays that bill.

A line cap fixes nothing that structure has not already fixed, and it does
real harm: it caps *depth*, so the pressure it applies is to stop
researching. That is the failure worth preventing, and a cap causes it.

So the rule a large artifact obeys is structural, never numeric: **split it
into references and let them load on demand, one per topic, only the one
the task needs.** An artifact too big to read in one sitting is a router
skill and its references that has not been decomposed yet — and *that* is
the finding to report. Never "too long".

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
   territory, never here. *(workspace half conditional — `n/a` where the
   repo pins a `workspace` bundle, which is the kind that takes it)*
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
  target, as is anything else that fronts the deployment; the rest are
  backing).
- **Structure**: the **topic bar** below, hung per the kind-general rule
  — one artifact per topic behind a lean router skill. Judgment skills
  are reference-shaped, not paths-scoped: there is no file glob that
  means "thinking about the cloud".
- **Scope**: the judgment an SDK reference cannot give. Never the deploy
  mechanics vwf's delivery-pipeline contract owns. Where a pack's own rule
  keeps vendor SDKs out of product code, say so as what that pack buys —
  the observability contract requires replaceability, not a protocol.
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

## `repo-gate` — the gates that run over the whole repo

The output is a **Repo-Gate-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): the `toolchain-gate`
components that apply to a repository as a whole rather than to one
toolchain inside it. It is one of the three kinds rooted at the `repo` axis
— `toolchain-manager` and `workspace` are the others — and like
`toolchain-manager` a polyglot repo materializes this one **once** rather
than per language.

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
researched and cited. Extracted from the curated archetype — the five repo
gates of the `devtools` plugin, which has since dissolved into this one. A
gate the repo has no surface for is recorded `n/a`, never silently absent.

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
   It owns only the claim that each gate *is* reachable at a name; what the
   task library is and what the names are belongs to `toolchain-manager`
   topic 4 below, and this sentence exists in both places so the two cannot
   drift.

The bar maps onto components one-to-one for topics 1–4 — one
`toolchain-gate` component each. **Topic 5 belongs to the hook-runner
component**, because that is where gates are actually wired and where local
and CI are made to run the same command; it is the one topic that is about
the others rather than about a tool of its own. A repo with no hook runner
records topic 5 `n/a` and loses the parity guarantee with it, which is worth
saying out loud rather than discovering later.

## `toolchain-manager` — the repo's tool pins, environment and task library

The output is a **Toolchain-Manager-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): exactly one
`toolchain-manager` component, standing alone. It is the second of the three
kinds rooted at the `repo` axis, and like `repo-gate` a polyglot repo
materializes it **once** — the manager is what makes several toolchains one
command surface.

**Three jobs, one component.** It pins the repo's tools, holds the
environment values they read, and runs the repo's tasks. Alternatives split
those differently — a pinner that runs nothing, a task runner that pins
nothing, an env loader that does neither — so the bar is wide enough for a
combiner and a splitter both, and a component with no surface for a topic
records it `n/a`, never silently absent.

**The seam with `repo-gate` topic 5, stated in both places on purpose.**
That topic asserts each gate *is* reachable as one task name and that CI
runs the same names. Topic 4 below owns **what the task library is and what
the names are**. A gate says "I am reachable at the security task name"; the
manager ships that task and the contract every task in the library follows.
Written once, the two drift the moment only one of them knows about the
other.

- **Axis**: `repo`.
- **Structure**: the **topic bar** below, hung per the kind-general rule —
  a lean router skill plus on-demand `references/` for the
  reference-shaped topics, which is the shape the curated archetype
  already has.
- **Scope**: which layer pins what, what the tasks are called, and how the
  same tasks run in the pipeline. Never what a gate *checks* — that is
  `repo-gate`'s. Never the CI system's workflow syntax — that is
  `ci-system`'s, which installs this manager and then calls its task names.
  Never a language's build commands, which the tasks wrap rather than
  define.
- **Facts & harness**: `harness:` is `n/a` throughout — a toolchain manager
  satisfies no vwf harness capability; it is what the harness tasks are run
  *by*. What it contributes is the `repo`-axis fact that the task names
  exist at all.
- **Invocation**: paths-scoped to the manager's config files and its task
  tree, and **not** user-invocable — doctrine the model applies while
  editing a config or a task file, never a command someone runs.

### The topic bar

A closed list of five topics, one artifact per topic, each individually
researched and cited. Extracted from the curated archetype — the mise skill
and its two references from the `devtools` plugin, which has since dissolved
into this one. A topic the manager has no surface for is recorded `n/a`,
never silently absent.

1. **Tool pinning & the config split** — which config layer holds which
   tool (the runtime the product needs, the development-only tools, the
   CI-only ones), how the active layer is selected, and the rule that
   nothing is duplicated across layers: a tool pinned twice is a version
   that can disagree with itself, and the disagreement surfaces on someone
   else's machine.
2. **Environment values** — variable names shared across layers with the
   *values* split per layer, so development and production override the
   same names rather than each inventing their own. Names here, values
   never, aligned with `environment.md`.
3. **The task library contract** — file-based tasks over inline ones, the
   directory-to-name mapping that makes a task's path its name, the header
   metadata each task file declares, the shared helpers library the tasks
   source rather than each restating, and the discipline for a slot the
   consuming repo must fill in — marked, so an unfilled slot is visible
   rather than silently a task that does nothing.
4. **The mandatory task set** — the task names every repo ships regardless
   of language, which is the vocabulary the rest of the toolkit invokes:
   the gate-running names and the bootstrap names. A name here is a
   contract, not a convention — renaming one breaks every caller that never
   read this file.
5. **Bootstrap & CI parity** — how a fresh checkout and a fresh worktree
   reach a working toolchain, how the pipeline runs the *identical* task
   names, how the layer is selected there, and the per-runtime workarounds
   a CI runner needs that a laptop does not.

## `workspace` — the repo's members and what crosses between them

The output is a **Workspace-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): the `package-manager`
component that installs and locks the repo's members, plus a
`build-orchestrator` component where the repo has one. It is the third kind
rooted at the `repo` axis, and the only one of the three a user **picks**:
`repo.stack.template` in `.config/vwf.yaml` is the elicited
workspace-and-package-manager pin, and the bundles of this kind are what it
selects from. The other two repo-axis kinds are `unconditional:` baselines
nobody chooses.

**A single-package repo pins nothing here**, and that is the kind's edge
rather than a gap. Flutter's own bundle says it out loud — mobile apps are
never monorepos. Where no workspace bundle is pinned, everything below is
carried by `language-bundle` topic 8 alone.

**The seam with `language-bundle` topic 8, which is why that topic's
workspace half is marked conditional.** Lockfile discipline, registry
pinning, the release-age cooldown, the postinstall allowlist and the
ecosystem's own audit tooling are **per-ecosystem** and stay topic 8: a
single-package repo needs every one of them and pins no workspace. What this
kind takes is only the **multi-member** half — who the members are, how work
crosses them, and what they inherit. Where a `workspace` bundle is pinned,
topic 8's workspace half is `n/a`, because it is this kind.

A `package-manager` component therefore appears in two kinds' compositions,
the way `toolchain-gate` does. Its `kind:` names `language-bundle`, where it
carries topics 7–8; this kind composes the same component for the half a
workspace adds. That is the seam working, not a mis-declared pack.

- **Axis**: `repo`.
- **Structure**: the **topic bar** below — **no router skill**, as with
  `repo-gate`: one paths-scoped doctrine skill per config file the workspace
  owns (the workspace manifest, the orchestrator config), plus topic 1 as a
  model-invocable reference beside them. Reference-shaped because there is
  no file glob that means "choosing a workspace shape", and five short
  topics do not earn a router.
- **Scope**: who the members are, how work crosses them, and what they
  inherit. Never a member's own internal layout — that is the language
  bundle's. Never the task library, which is `toolchain-manager`'s: an
  orchestrator runs *beneath* the manager, and this kind states which
  orchestrator exists, never what the repo's task names are. Never what a
  gate checks. Never the built artifact, which is the deploy axis's even
  when every member shares one build file.
- **Facts & harness**: `harness:` is `n/a` — a workspace satisfies no vwf
  harness capability. What it contributes is the `repo`-axis facts of the
  package-manager token and the manifest and lockfile names, which is what
  `/vwf:setup` detects the repo's manager by.
- **Invocation**: the config doctrine paths-scoped to the workspace manifest
  and the orchestrator config, and **not** user-invocable. Topic 1's
  reference model-invocable.

### The topic bar

A closed list of five topics, one artifact per topic, each individually
researched and cited. Extracted from the three curated workspace bundles —
`pnpm-workspace`, `pnpm-turbo` and `bun` — whose bodies already agree on
this shape. A topic the ecosystem has no surface for is recorded `n/a`,
never silently absent.

1. **Pick & trade** — what this workspace shape buys and what it costs, and
   the conditions under which it stops being the answer. This is the topic
   the three curated bundles spend their opening paragraphs on, because
   picking between a workspace with an orchestrator and one without is the
   whole decision `repo.stack.template` records.
2. **Membership & layout** — which directories are members and how
   membership is declared: named explicitly, or globbed by a convention. A
   repo with three members naming all three is a different posture from one
   that globs `packages/*`, and the difference is what happens to a
   directory someone adds. This topic also names the committed **lockfile**,
   which is what identifies the package manager where the manifest key does
   not — the reason `/vwf:setup` detects by lockfile rather than by
   `workspaces`.
3. **Cross-member orchestration** — whether a `build-orchestrator` exists at
   all, and the consequence either way. With one: the task graph, the
   dependency edges and what is cached against what a stale cache costs.
   Without one: the ruling that a member whose build depends on another's
   output states that ordering **in the task itself**, because nothing is
   computing it. "No orchestrator" is a decision with consequences, never an
   absence, and a bundle that leaves it unstated has made it by accident.
4. **The internal dependency graph** — how one member depends on another:
   the workspace protocol or path reference, whether a member consumes its
   neighbour's **source** or its **build output**, and the internal path
   alias. Whichever answer, it is the one that decides whether a change in
   one member is visible in another without a build.
5. **Root-inherited configuration** — the rule that a repo-wide config is
   declared **once** at the root and inherited by members rather than
   restated per member, and the mechanism the ecosystem inherits it by
   (an `extends` key, a symlink, a path). Only the inheritance is this
   kind's: what the config *says* belongs to the kind that owns the tool —
   the compiler config to `language-bundle` topic 9, the formatter's to
   `repo-gate` topic 1.

The bar maps onto components as follows: topics 1, 2, 4 and 5 belong to the
**`package-manager`** component. **Topic 3 belongs to the
`build-orchestrator` component** where the bundle has one, and to the
`package-manager` component where it does not — the one topic whose owner
depends on the answer, which is what makes stating it mandatory.

## `capability-provider` — the flavour half of a capability

The output is a **Capability-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): the category-level doctrine —
the neutral capability contract under `assets/contracts/` — plus one
**instance component** (`type: capability-provider`) that realizes it. Same
two halves as `database`, for the capabilities that are neither a datastore
nor one cloud's service: an identity issuer, a telemetry sink, a workflow
engine, a secrets manager.

All six bar topics belong to the instance component. The contract is what
the instance **cites, never restates** — that seam is what lets two
providers in a category be judged against the same clauses.

- **Axis**: `backing`.
- **Structure**: the **topic bar** below, hung per the kind-general rule —
  one artifact per topic behind a lean router skill.
- **Scope**: when this provider is the answer, how it satisfies the
  contract, and what it forces on the product that a neighbour would not.
  It never reaches into the language bundle's layout, and it never restates
  the contract it cites.
- **Facts & harness**: the `local_stack` mechanism is fixed by vwf's harness
  contract — a Docker-composed service behind a `wait-on` readiness gate —
  so the kind emits that task plus whatever client tool and healthcheck the
  provider needs. A hosted-only provider emits a seam plus a fake, and says
  which.
- **Invocation**: the router paths-scoped to the integration surface — the
  middleware, the instrumentation setup, the worker definitions — with its
  references loading on demand.

### The topic bar

A closed list of six topics, one artifact per topic, each individually
researched and cited. Extracted from the curated archetypes — the `identity`,
`observability` and `orchestration` plugins' contracts and their `oidc`,
`otel-lgtm` and `temporal` templates, whose sections already agree on this
shape.

1. **Pick & trade** — when this provider is the answer, and when it stops
   being one. The topic the curated templates omit, and the one a reader
   choosing between two providers needs first.
2. **Contract satisfaction** — clause by clause against the neutral
   capability contract, citing the category doctrine per clause and never
   restating it. A clause the provider cannot satisfy is stated as such:
   an unsatisfied clause is a design constraint on the product, not a
   defect to hide.
3. **The constraint that bites** — the one property that reshapes how the
   product is built around this provider. Determinism for a workflow
   engine, cardinality for a telemetry sink, the revocation window for an
   identity issuer. Every curated template has this section, which is the
   evidence it is a topic rather than an aside.
4. **Integration & access shape** — where the boundary between product and
   provider sits, how the product reaches it, and credentials: env-injected
   names-not-values catalogued in `environment.md`, identity-based auth
   preferred so no secret exists, throwaway local-stack credentials.
5. **Cost shape** — the billing model and the traps that turn a small
   change into a large bill. Never dollar figures, which age badly and are
   wrong per region anyway.
6. **Local stack** — the real engine composed behind a `wait-on` gate where
   one can run locally; a seam plus a fake where the provider is
   hosted-only, with the gap named.

## `ci-system` — the repo's delivery pipeline

The output is a **CI-Bundle** (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`):
the release-trigger contract
(`${CLAUDE_PLUGIN_ROOT}/assets/contracts/release-trigger.md`) plus exactly
**one** `ci-system` component. vwf's delivery-pipeline rules state what a
deploy must guarantee and name no mechanism; the contract is the recommended
mechanism, above any one system; the component is how that system spells it.
**All three layers, and none of them duplicated** — the reason vwf holds no
CI syntax is the same reason the component holds no tag grammar.

**Exactly one.** A repo has one pipeline. Generating for a second system
produces a pipeline nobody runs and nobody updates, which is worse than
none — it is a green check that means nothing.

- **Axis**: `cicd` — one of the two **tool axes**, where the bundle slug is
  the `projects.<name>.cicd` token itself. It was `repo` until Wave D, which
  is why the one CI pack that exists was never offered by any menu: nothing
  on the repo axis could carry it, and a template no menu offers is invisible
  rather than broken.
- **Structure**: the **topic bar** below, hung per the kind-general rule —
  the neutral rules in a lean router skill, one reference per CI system,
  loaded only once the system is resolved. This is the shape the retired
  `cicd` plugin shipped, and adding a system is one reference file.
- **Scope**: workflow layout, triggering, toolchain installation, and the
  release contract. Never the language's build commands — those are the
  language bundle's, reached through the repo's task library. Never the
  cloud's deploy mechanics, which belong to `cloud-provider`.
- **Facts & harness**: the pipeline satisfies no harness capability itself;
  it **invokes** the repo's task names, so `harness:` is `n/a` and the task
  names are what the component must not invent.
- **Invocation**: the router model-invocable, since a pipeline is generated
  on request rather than while editing a file. Its references load on
  demand, one system only.

### The topic bar

A closed list of six topics, one artifact per topic, each individually
researched and cited. Extracted from the `cicd` plugin — its neutral rules
and its one implemented system — which then **dissolved**, this kind being
the whole of what it was.

1. **Resolution & layout** — which system the repo uses (a recorded fact,
   never detection and never a silent default), where its workflow files
   live, and the monorepo-versus-multi-repo structures with the fan-out
   strategies each supports.
2. **Toolchain installation** — the rule that outranks the rest: **the
   pipeline installs the repo's toolchain manager and nothing else.** No
   per-language setup action, no system package installs, no global
   installs. Everything a job needs is declared in the repo's toolchain
   config, and *how* the manager itself is installed is this topic's
   business.
3. **The gate sequence** — what runs on every push and pull request, in what
   order, and what fails the run. Cheap gates first, and the same task names
   the developer runs locally.
4. **Release triggering** — vwf's delivery-pipeline contract in this
   system's vocabulary: the `<project>-<env>-v<semver>` tag shape, branch
   validation before publish, and tested-before-release. Cited from the
   contract, not restated.
5. **Credentials in CI** — federated identity over stored long-lived
   tokens wherever the system offers it, least-privilege scoping per
   workflow, and what must never reach a log. A stored token that never
   expires is the finding this topic exists to prevent.
6. **Pinning & caching** — every third-party building block pinned to an
   explicit version, and what is worth caching against what it costs to
   restore. An unpinned action is remote code executing with the
   pipeline's credentials.

## `app-framework` — the SDK that owns the build and brings its languages

The output is an **App-Bundle** (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`):
an `app-framework` component carrying its languages **as members with a
role**, plus its `package-manager` and `toolchain-gate` components.

**This is the one kind whose root is not a `language`, and the inversion is
the reason it exists.** A `framework` composes *into* a language bundle;
an `app-framework` owns the bundle and the language is what it brought.

The test, verified against Flutter's own documentation:

- **It owns the manifest**, and the manifest reaches into the native
  toolchains — `pubspec.yaml` declares both the Dart and Flutter SDK
  constraints and carries `flutter: config: enable-swift-package-manager`,
  a Dart manifest configuring the iOS package manager.
- **It owns the build.** Flutter's docs: *"Flutter relies on Dart's build
  system and the Pub package manager … Gradle files inside the android
  directory are only used when configuring platform-specific native
  dependencies."*
- **It decides which languages exist** — `flutter create --android-language
  kotlin` makes the native language a flag to the SDK's scaffolder.
- **Its language's own tooling is provisioned through it** — the Dart
  language server is reached through the Flutter SDK, not beside it.

Where all four hold, the SDK is the root. Where they do not, it is an
ordinary `framework` and topic 2 of a language bundle.

- **Axis**: `project`.
- **Structure**: the **topic bar** below, hung per the kind-general rule —
  a lean router skill per language member, references loading on demand.
  The `primary` language's router is the entry point; a `platform-edge`
  language gets its own, scoped to the boundary it serves.
- **Scope**: the app's layout, composition, build and platform boundary.
  Never the backend's, and never a datastore's or cloud's judgment — an app
  reaches those through the capability vocabulary like anything else.
- **Facts**: per language member, each carrying its own `role`. The
  `primary` language's facts route through the SDK where the SDK provides
  them; a `platform-edge` language has its own language server but **no
  manifest of its own**, because its build files are subordinate to the
  SDK's.
- **Invocation**: routers paths-scoped to their language's file
  extensions.

### The topic bar

A closed list of twelve topics, one artifact per topic, each individually
researched and cited. Topic 12 is conditional and repeats per integration.

1. **Pick & trade** — when this SDK is the answer, and when a native or web
   stack is the better one.
2. **Project layout & the generated boundary** — which directories the SDK
   generates and owns versus which the product owns, and what must never be
   edited or committed. Flutter's `.android/` is *"generated for testing
   purposes and will be overwritten whenever you run `flutter pub get`"* —
   the trap this topic exists for, and one no language bar would surface.
3. **Standards & app architecture** — idioms, module split, the composition
   root, and where business logic is not allowed to live.
4. **State management** — the app's chosen approach and its boundaries.
5. **UI composition & theming** — layout idioms, the design-system tokens
   made real, animation, and the anti-patterns that cost frames.
6. **Navigation & routing** — the route model, deep links, and the
   back-stack behaviour each platform expects.
7. **Data & networking** — serialization, the client seam, caching and
   offline behaviour.
8. **Platform interop** — the channel mechanism, its type-safe generator
   where one exists, and the ruling that **edge languages appear only
   here**. Flutter's own framing: it *"does not compile to Android Dalvik
   bytecode or have direct bindings to iOS Objective-C"*, so it is hosted
   inside a native component and reaches the platform through channels.
9. **Build, flavors & signing** — per-platform build configuration,
   environment flavours, entitlements and signing.
10. **Testing & coverage** — the SDK's own test surfaces, including the
    visual and accessibility gates its toolchain provides.
11. **Performance & artifact size** — the SDK's performance model and what
    grows the shipped artifact.
12. **Integration wiring** *(conditional — one artifact per integration)* —
    **setup order, platform configuration and anti-patterns only.** Manifest
    entries, entitlements, permission declarations, emulator wiring: the
    parts a per-package documentation lookup gives only piecemeal. **Never
    API surface** — that is Context7's at use time, and it is the half that
    ages.

## `deploy-target` — where a built artifact lands

The output is a **Deploy-Bundle**
(`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`): exactly one `deploy-target`
component, standing alone. There is no second half — a target that belongs
to a cloud is a `cloud-service` under `cloud-provider`, and this kind is
what remains when the target belongs to no cloud: a package registry, or a
container host that is deliberately any host.

**One component, and that is the whole bundle.** The composition other
kinds get from pairing doctrine with an instance is not available here,
because there is no category above a provider-neutral target to write
doctrine at. What keeps the component honest instead is the scope fence
below: almost everything adjacent to a deploy target belongs to some other
kind, and naming those neighbours is most of this kind's discipline.

- **Axis**: `deploy`.
- **Structure**: the **topic bar** below, hung per the kind-general rule —
  a router skill per target, plus one paths-scoped doctrine skill or rule
  per artifact-defining file the target owns (a container build file and
  its ignore file; a registry manifest's publish fields). A target with no
  such file ships the router alone.
- **Scope**: what the artifact is, what must not be inside it, and how it
  is promoted. **Never** which cloud runs it — that is `cloud-provider`.
  **Never** the pipeline that drives the release — that is `ci-system`;
  this kind states the task the pipeline calls, not the workflow. **Never**
  the local stack, even where the same runtime provides it — that is the
  harness contract (`assets/contracts/local-stack.md`), and conflating the
  deploy artifact with the local stack is the specific mistake this fence
  exists to prevent. **Never** the language's build commands.
- **Facts & harness**: `health` where the target runs the product — the
  readiness endpoint the host's probes point at. A registry target runs
  nothing, so its `harness:` is `n/a`, and that `n/a` is an answer rather
  than an omission.
- **Invocation**: the router model-invocable, since a deploy target is
  chosen rather than edited into. Artifact-file doctrine paths-scoped, so
  it applies while the build file is being written.

### The topic bar

A closed list of six topics, one artifact per topic, each individually
researched and cited. Topic 6 is conditional; a conditional that does not
apply is recorded `n/a`, never silently absent.

1. **Pick & trade** — what this target is for, what it costs, and the
   conditions under which it stops being the answer. A provider-neutral
   target's trade is usually portability bought with the managed features
   it declines to use; say which ones.
2. **The artifact** — what gets built, from what, and how many. Where a
   repo builds several deployables, whether they share one build
   definition is decided here, and the reasoning is drift: a base bump
   applied to three of five services is a class of failure nothing catches
   until one environment breaks.
3. **Artifact hygiene** — what must not be inside the artifact, treated as
   a correctness concern and not housekeeping. Host build state that
   shadows the artifact's own, and credentials reaching a published layer,
   are the two failures every target in this kind has a version of.
4. **Promotion & release mechanics** — the same artifact promoted between
   environments rather than rebuilt per environment, which is what makes
   the tested artifact the released artifact; the registry it passes
   through; and the release wrapped in the repo's own task so the target
   stays swappable. vwf's delivery-pipeline contract is **cited here, not
   restated** — the tag shape and the branch validation are the
   `ci-system`'s to implement.
5. **Configuration & secrets at run time** — how configuration reaches the
   running artifact, and why none of it is baked in. Names, never values,
   aligned with `environment.md`. A registry target answers this about the
   consumer's environment rather than a host's.
6. **Reachability & health** — the readiness endpoint the `health` harness
   capability requires and what the host probes with it, plus keeping a
   project that must not be publicly reachable off the public network at
   the infrastructure layer rather than by application auth alone.
   *(conditional — `n/a` for a target that runs nothing)*

## `design-tool` — the tool a project's screens are authored in

The output is a **Design-Bundle** (`${CLAUDE_PLUGIN_ROOT}/assets/taxonomy.md`):
one `design-tool` component, standing alone.

This kind exists because vwf **names no design tool** and must not. Its three
import skills define the *payloads*; this kind supplies one tool's
implementation of them, materialized into the repo's own `.claude/` under
**fixed names** vwf invokes — the same seam that dissolved the `-ux-gate` name
construction, and for the same reason: a name assembled from configuration
resolves to nothing silently.

- **Axis**: `design`. The bundle slug **is** the `projects.<name>.design`
  token, so the pin and the config key are one value.
- **Structure**: exactly three model-invocable skills, at the fixed names
  `design-import-screens`, `design-import-design-system` and
  `design-import-conversations`, plus this tool's MCP wiring where it has an
  API. Three because vwf has three import surfaces and each returns a
  different payload; fewer would make one of them silently unavailable.
- **Scope**: how to read this tool's authored designs back, and how to reach
  its API. **Never** what a design *means* — the diffing, the contract deltas
  and every blueprint edit stay vwf's. **Never** the prompt side: design briefs
  are files vwf writes into `docs/prompts/`, and no tool is involved in
  producing them.
- **Facts & harness**: `n/a` throughout. A design tool satisfies no harness
  capability — nothing about it is booted, stood up or probed.
- **Invocation**: all three skills **model-invocable, mandatorily**. A
  user-only skill here is removed from the model's context, so vwf's import
  would return nothing and be indistinguishable from a design nobody authored.
  This is the single most important ruling in the kind.

### The topic bar

A closed list of five topics, one artifact per topic. Topic 5 is conditional.

1. **Screens import** — reading a flow's designed screens back for one
   platform: where pages live, how a screen code is recovered from a name, and
   the rule that a code which cannot be recovered is returned null rather than
   invented, because the code is the join key.
2. **Design-system import** — reading the tokens, typography, spacing, motion
   and component behaviours back as the design-system payload.
3. **Conversations import** — reading the design review discussion back. This
   is the one surface allowed to answer `harvested: n/a`, because a tool may
   genuinely have no review channel; the other two must halt instead, since an
   empty payload there reads as a design nobody made.
4. **Reach & credentials** — how the tool's API is contacted, what
   authentication it needs, and what must never be logged. Where the tool is
   reached over MCP, this topic owns that wiring and the consent it lands
   behind.
5. **Naming contract** — the page and frame naming this tool needs so an
   import can find anything, mirroring what `/vwf:screens prompt` commissions.
   *(conditional — `n/a` for a tool with no canvas)*

## Reserved kinds (defined at their merge wave, not before)

**None outstanding.** Both reservations have been redeemed —
`capability-provider` and `ci-system` are defined above, at Waves B and C
respectively, which is what the reservation was for.

The practice stands for whatever comes next: name a kind here when a wave is
known to need it, and define its structure only when that wave lands.
Defining structures for kinds nothing generates yet is speculation; naming
them is what stops a later wave inventing a shape ad hoc — which is exactly
what `repo-gate` had to be defined from scratch to fix, because nobody
reserved it.

`workspace` is the second of those, and its failure mode was worse than
`repo-gate`'s: the category was already load-bearing — `repo.stack.template`
had been selecting from its three bundles all along — but because no kind
existed, all three declared `kind: language-bundle` as a placeholder and
nothing said otherwise. An unminted kind is not an error anywhere; it is a
field holding a plausible wrong value. The same placeholder hid on the two
deploy bundles until Wave D, which makes three, and the lesson is the one
above: mint the kind when the thing exists, not when a generator needs it.

## What the reviewer checks per kind

Beyond catalog fidelity and citations, the `stackgen-skill-reviewer`
verifies the artifact against its declared kind: every structural element
the kind requires is present (a `database` output without a `local_stack`
mechanism is a gap), nothing outside the kind's scope crept in (a language
bundle naming a database is a gap), and each skill's invocation mode matches
the kind's ruling. For all eleven kinds the structural checklist **is the
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
because it belongs to topic 10 of its language bundle. For
`toolchain-manager` the composition is the one component alone, and two
checks carry the kind: a task name asserted by a `repo-gate` output that the
task library does not ship is a gap on this side of the seam, and a router
skill that is user-invocable is a gap, because this kind's doctrine applies
while a config is edited rather than on request. For `workspace` the
composition is the `package-manager` component plus a `build-orchestrator`
where the bundle has one, and two checks carry the kind: **topic 3 left
unstated is a gap**, because "no orchestrator" is an answer this kind
requires out loud rather than an absence a reader may infer, and
per-ecosystem supply-chain or audit-tooling doctrine appearing here is a gap,
because it belongs to `language-bundle` topic 8 whether or not the repo is a
workspace. For
`capability-provider` the composition is the instance component alone, and —
as with `database` — citing rather than restating the contract is part of
the bar. For `ci-system` the composition is one component and **exactly
one**: a second CI system in the same bundle is a gap, not extra coverage.
For `app-framework` the composition is the SDK plus its language members, and
two checks carry the kind: every language member declares a `role`, and an
**API-surface listing under topic 12 is a gap** — that topic is wiring and
platform configuration only. For `deploy-target` the composition is the one
component alone, and the check that carries the kind is the scope fence:
local-stack mechanism, pipeline workflow syntax, or one cloud's deploy
mechanics appearing here is a gap, because each belongs to a kind that
already owns it. For `design-tool` the composition is the one component, and
two checks carry the kind: all three import skills present (a missing one is
silently unavailable to vwf, not a smaller feature), and every one of them
model-invocable.
