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

## `language-bundle` — language + frameworks + package manager

These three only work together, so they generate as **one run** — but with
research and citations kept separable per technology, so a framework's major
bump can be regenerated without churning the language baseline.

- **Axis**: `project` (the package manager contributes the `repo` axis
  facts).
- **Structure** (archetype: the `typescript` plugin, the most mature
  language plugin): a **lean router skill** per language → on-demand
  `references/` (coding standards, testing, build/run), plus one
  paths-scoped doctrine skill or rule per config file the toolchain owns
  (manifest, compiler config, lint/format config). Hooks only from packs
  (e.g. a command normalizer); generation never emits scripts.
- **Scope**: layout, idioms, testing shape, placement. Never API reference
  (Context7 serves that at use time), never the datastore's or cloud's
  judgment.
- **Facts**: per language — `lsp` (how a language server is provided;
  stackgen ships none, so this recommends the mise tool or marketplace
  plugin that does), `mise_tool`, `manifest`.
- **Invocation**: router skill model-invocable; doctrine paths-scoped
  (`**/*.<ext>` plus the config files); rules for one-screen constraints.

## `database` — a datastore the product runs against

- **Axis**: `backing`.
- **Structure**: one paths-scoped doctrine skill (connection/config
  discipline, migration discipline, query-layer conventions, the
  local-stack story) with references as needed; a rule for the migration
  directory when one exists.
- **Scope**: how this store is operated and accessed well — schema
  evolution, transactions/consistency posture, retention and backup notes.
  It realizes the neutral datastore contract; it never restates it, and it
  never reaches into the language bundle's layout.
- **Facts & harness**: the `local_stack` mechanism is fixed by vwf's
  harness contract — Docker-composed service behind a `wait-on` readiness
  gate — so the kind emits that task plus the client tool and healthcheck.
- **Invocation**: doctrine paths-scoped to the data layer and migration
  paths.

## `cloud-provider` — where the product runs and what it uses there

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
the kind's ruling.
