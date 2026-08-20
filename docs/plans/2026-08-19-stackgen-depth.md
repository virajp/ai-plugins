# Plan: stackgen depth — topic bars, framework ruling, coverage gate

**Status: executed 2026-08-20 — steps 1–7 complete on branch
`worktree-stackgen`; the Rust proof regenerated at full depth (see Depth proof
below).**

Companion to [the stackgen plan](2026-08-19-stackgen.md) (Phases 1–4 executed
and revised to `.claude/`-direct on branch `worktree-stackgen`). The Rust
revision proof exposed the gap this plan closes: **generated output was
structurally valid but shallow** — four thin references where the curated
archetype (`typescript`) carries a dozen dense topics at 60–130 lines each.
Nothing told generation how deep to go, research was unbounded downward, and the
reviewer's checks catch padding but not thinness.

## Resolutions (settled 2026-08-19, before this plan)

1. **Where existing stacks live once plugins retire: packs.** Curated
   **judgment** (conventions, doctrine, templates) folds into pack assets under
   `plugins/stackgen/stacks/<axis>/<slug>/` per `pack-format.md`, copied into
   repos on pin, upgraded only via the explicit sync diff. Curated **machinery**
   (LSP declarations, hooks, the Claude Design MCP server) cannot be a pack —
   the output vocabulary excludes MCP/LSP — so it merges into **stackgen's own
   plugin manifest** at Wave A (a per-language `lspServers` registry, inert
   until matching files exist).
2. **End-state plugin roster: `vwf` + `stackgen`, exactly two** (Wave D
   unchanged). design-tools' adapter + MCP server, devtools' scaffold and repo
   gates, and all LSP declarations are Wave A machinery merges; every
   language/cloud/capability plugin becomes packs in Waves B/C.
3. **stackgen stays a separate plugin — dependency, not merger.** vwf's
   checker-enforced technology-free guard forbids vwf naming technologies; packs
   are nothing but technology names, so a merge would break or gut the guard.
   stackgen also has standalone value without vwf's weight, and the adapter seam
   keeps vwf's contract uniform. Coupling is handled at Wave A: vwf's single
   dependency flips `devtools` → `stackgen`; the catalog handover stays the one
   seam.
4. **Packs are component-granular; bundles are compositions** (settled
   2026-08-20 — see The component model below). Resolution 1's judgment/
   machinery split stands; this refines *what a pack is*.

## The component model (settled 2026-08-20)

Two layers, cleanly separated:

- **Components** are the atoms — `typescript`, `pnpm`, `axum`, `postgres`,
  `kafka`, `cloud-run` — each a pack directory declaring three metadata fields:
  **type** (language, package-manager, framework, toolchain-gate,
  cloud-provider, cloud-service, datastore, queue, cdn, …), **category** (the
  finer taxonomy: frameworks → webserver / orm / otel-sdk / testing /
  meta-framework; cloud services → compute / sql / queue / object-storage / cdn;
  datastores → sql / document / graph / vector / key-value / in-memory), and the
  **capability** token it realizes, where one applies.
- **Bundles** are recorded compositions, not directories: a Language-Bundle is
  the composition rooted at a language component (language + package-manager +
  framework components + toolchain gates); a Cloud-Bundle is provider + service
  components; a Datastore-Bundle is category-level doctrine + an instance
  component.

**Taxonomy ownership splits at the existing seam**: capability tokens stay vwf's
(`capability-vocabulary.md`, blueprint-neutral); the finer category taxonomy is
stackgen's, as a closed `assets/taxonomy.md` extended deliberately. vwf never
learns what an ORM is; stackgen never redefines a capability. Category-level
doctrine (e.g. the sql-datastore contract) is written once as stackgen curated
knowledge at Wave B; instance components cite it and stay thin.

**Dispatch runs per component.** This is the payoff that makes the vast
framework space tractable: a TypeScript + Next.js repo copies the curated
`typescript`, `pnpm` and lint-gate component packs and generates *only* the
uncovered Next.js component. Curated coverage grows one component at a time;
sync diffs and regenerates per component; one framework's major bump never
churns the rest of the bundle. Categories also make cloud services and
standalone components substitutable answers to one blueprint capability
(`pubsub` and `kafka` both answer *queue*), which is what lets stack menus
become category-filtered queries instead of per-plugin lists.

Config continuity: the per-project `stack` block already records `languages` /
`frameworks` / `dependencies`, so the pin's recorded composition is an evolution
of existing fields, not a new shape.

## Decisions

| Decision              | Ruling                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Depth bar             | Each kind carries a **topic bar**: a closed list of topics the output must cover, one artifact per topic, each sized like the curated archetype's references (60–130 dense lines of judgment)                                                                                                                                                                                 |
| Research              | **Context7 MCP is the primary and preferred research channel** — one research pass per bar topic, minimum. Supplementary sources are allowed only where Context7 coverage is thin, and every supplement is disclosed in the citations file. Context7 unreachable still halts                                                                                                  |
| Framework opinion     | **Selection-neutral, usage-opinionated.** Generation never opines on which framework (the pin and the packs own selection; minimalism owns whether-at-all); it is strongly opinionated on usage, every opinion tracing to a source (below)                                                                                                                                    |
| Opinion sources       | Precedence: (1) **detection** — the repo's settled pattern wins; (2) the framework's **own documented recommendation**, cited; (3) a **catalog entry** instantiated, cited. A genuinely split ecosystem choice with no detection signal is presented as an **open decision** with real options — never fake consensus — and recorded when the user settles it                 |
| Framework materiality | One judgment reference per `frameworks:` entry (written-against; removal = rewrite); **dependencies get no reference** — a line in manifest doctrine at most, Context7 at use time. Each framework reference owns its own seam and names neighbors only through the capability vocabulary; cross-framework integration judgment lives in standards, never per-pair references |
| Security tooling      | Ecosystem-specific supply-chain tooling (`cargo audit`/`deny` class) folds into the **package-manager topic**; repo-generic scanners remain repo-gate territory (devtools today, Wave A machinery later)                                                                                                                                                                      |
| Observability topic   | Kept, **narrowly scoped**: the language's idiomatic emission hook only (e.g. `tracing`), never the pipeline contract — that stays the observability capability's domain                                                                                                                                                                                                       |
| Coverage gate         | Reviewer **check 8 — coverage**: a bar topic missing from the artifact set is a gap, unless the detected stack makes it inapplicable (stated `n/a` with why) or research was disclosed thin for that topic                                                                                                                                                                    |
| Pack granularity      | **Component-granular** (2026-08-20): one pack per component with `type` + `category` + capability metadata; a bundle is a recorded composition of component refs in the template payload, and the dispatch rule (pack-first, generate the uncovered) runs **per component**                                                                                                   |
| Taxonomy              | Capability tokens stay vwf's; the finer **category taxonomy is stackgen's** — a closed `assets/taxonomy.md`, extended deliberately. Category-level doctrine is curated once; instance components cite it                                                                                                                                                                      |

## The `language-bundle` topic bar (settled)

Each topic is one artifact — reference, skill, or rule — individually researched
and cited. Conditional topics marked:

1. **Standards** — module split, naming, placement, composition root, type
   discipline.
2. **Framework doctrine** — one reference per detected `frameworks:` entry,
   under the framework ruling above. *(conditional on detection)*
3. **Error handling** — the language's error model applied; the one-mapping-home
   rule; panic/exception policy.
4. **Async/concurrency model** — runtime, blocking rules, cancellation.
   *(conditional — `n/a` where the stack has none)*
5. **Testing** — unit/integration/e2e placement, in-process idioms, coverage
   stance.
6. **Build & run** — dev loop, release builds/profiles, task wiring.
7. **Manifest discipline** — paths-scoped skill or rule on the manifest:
   dependency hygiene, feature flags, versioning.
8. **Package manager & workspace** — lockfile discipline, supply-chain posture
   incl. ecosystem audit tooling. *(workspace half conditional)*
9. **Compiler/toolchain config** — toolchain pinning, profiles, lint tables.
10. **Lint & format gate** — wired as tasks.
11. **Config & env** — names-not-values, aligned with `environment.md`.
12. **Observability wiring** — the idiomatic emission hook only.

Under the component model the bar maps onto component types: topics 1, 3–6 and
11–12 belong to the **language** component; 7–8 to the **package-manager**
component; 9–10 to **toolchain-gate** components; topic 2 is one artifact per
**framework** component. Check 8 verifies the *composition* covers the bar,
whichever components supply each topic.

## Delta — ordered steps

1. **Codify the component model.** New `plugins/stackgen/assets/taxonomy.md`
   (component types + the closed category lists + the capability seam);
   `pack-format.md` reshaped to component granularity (`type`, `category`,
   capability fields; one pack per component); `stackgen-stack-template`
   dispatches **per component** and records the bundle as a composition of
   component refs in the template payload; `stackgen-sync` diffs and offers
   regeneration per component.
2. **Codify the bar.** `plugins/stackgen/assets/kinds.md`: replace the
   language-bundle structure sketch with the 12-topic bar, its
   topic→component-type mapping, the framework ruling (sources, materiality,
   composition), and the depth sizing (archetype-referenced). State that
   `database` and `cloud-provider` bars are **pending elicitation** (step 5) so
   the reviewer does not enforce a bar that was never settled.
3. **Generator: per-topic loop, Context7-first.** The generator reference
   iterates research → write → cite **per bar topic** (not per library), names
   Context7 as the preferred channel with supplements disclosed, and requires
   per-topic thinness disclosure. Add the generation-loop convergence guard
   while in the file: reviewer rounds capped (default 4) with residuals
   reported, mirroring vwf's execute rule.
4. **Reviewer check 8 — coverage** in `stackgen-skill-reviewer`, per the ruling
   above, verified against the composition.
5. **Shape the remaining bars with the user** (one at a time, MCQ where options
   are closed): `database`, then `cloud-provider` — extracted from the datastore
   and gcp plugins' real tables of contents. Codify each into `kinds.md` as
   settled.
6. **Regenerate the Rust proof at full depth** against the settled bar (~10+
   Context7 passes, one artifact per applicable topic across the rust + cargo +
   axum + toolchain-gate components, reviewer with check 8 active, consent gate,
   landing). This is the acceptance test: the output should read like the
   `typescript` plugin's references, a shallow topic should be caught by check
   8, not by the user, and the lockfile/payload should show per-component
   entries a later single-component re-sync could act on.
7. **Docs ship with the change**: `docs/plugins/stackgen.md` (kinds/depth +
   component-model sections), CLAUDE.md rows if touched, and the stackgen plan
   doc's decision table gains a pointer to this plan.

**Depth proof (2026-08-20, Rust regenerated).** Step 6 re-ran the Rust fixture
at full depth against the settled bars: 12 writer subagents, one per bar topic,
across the four components (`language/rust`, `package-manager/cargo`,
`framework/axum`, `toolchain-gate/rust-toolchain`), ~30 Context7 passes. Four
stateless reviewer rounds under the convergence cap (5→2→5→1 gaps) caught —
among others — an off-vocabulary harness key, two rules that had outgrown the
rule form (converted to paths-scoped doctrine skills), two claims softened
because their sources did not support them (clippy default groups; the RUSTFLAGS
fingerprint claim), a vendor leak in capability prose, and an `e2e_staging`
mechanism the bundle's own doctrine contradicted; the round-4 residual was fixed
per the reviewer's own prescription post-cap and disclosed at the consent gate.
The consent gate ran for real (an 18-file landing set approved); landing
verified hash-clean with 17 per-component lockfile entries a single-component
re-sync can act on, every relative link resolving, and the user's own
hand-written skill untouched. All 12 topic artifacts landed at 124–130 dense
lines — inside the band the bar demands. Check 8, not the user, caught the
shallow and dishonest spots — the acceptance the plan named.

## Execution

**Starting point.** This plan's artifacts exist only on branch
`worktree-stackgen`. Enter the existing worktree at `.claude/worktrees/stackgen`
(EnterWorktree with `path`, or work there directly); if that worktree is gone,
recreate it from the `worktree-stackgen` branch — and only if the branch has
already merged, branch fresh from `main`. Verify the baseline before starting:
`mise run plugins:check` and `mise run plugins:marketplace --check` must pass,
and `git log` must show the stackgen commits through
`docs: settle component-granular packs…`.

**Orchestration — subagents by default.** The orchestrator holds the plan and
the gates; the reading and writing runs in subagents so their file loads never
enter the orchestrator's context:

- **Steps 1–4 (doctrine edits)**: one general-purpose subagent per step, given
  the exact files to edit and the relevant plan sections verbatim; the
  orchestrator reviews the diff, runs `mise run plugins:check`, and commits. One
  commit per step, conventional message, never `git add -A`.
- **Step 5 (bar shaping)**: orchestrator-led — this is elicitation with the
  user, one bar at a time, MCQ where options are closed. Ground each draft by
  sending an Explore subagent to extract the real table of contents from
  `plugins/datastore` and `plugins/gcp` first.
- **Step 6 (Rust regeneration)**: fan out **one research+writer subagent per bar
  topic**, component-scoped, each doing its own Context7 passes and returning
  the drafted artifact plus its citation entries; the orchestrator assembles the
  composition. Reviewer rounds are **fresh stateless dispatches** of the
  `stackgen-skill-reviewer` contract (its agent file is the subagent's
  instructions), capped at 4 rounds with residuals reported. The consent gate
  and the landing are the orchestrator's.
- **Step 7 (docs)**: delegate the sweep to the `docs-reconciler` agent; apply
  its findings, same commit as the step that caused them where feasible.

**Gates.** User gates at: step 5's bar elicitation (each bar), step 6's dry-run
consent, and one final review of the whole run before any merge/push (merge only
via the git workflow, behind its own approval). Everything else is autonomous.
If context pressure forces a handoff, commit first — the plan doc plus the
committed worktree is the resume state, and this section is the resume
instruction.

## Backlog

- **Stack-vocabulary coverage audit (requested 2026-08-19).** Once stackgen is
  done (post merge waves), audit `vwf`'s `stack-vocabulary.md` against
  everything stackgen can then express — kinds, packs, `language_facts`, the
  materialized escape, the retired language-plugin contract — so the
  vocabulary's fact shape and axis definitions cover the full generated + pack
  surface with no orphaned concepts from the plugin era. Include the
  **capability-vocabulary gaps the taxonomy exposes** — `cdn` has no capability
  token today, and the category lists will surface more.
- Parked from earlier review, undecided: a `pack.yaml` rule in `plugins:check`
  before the first pack lands; a CI-friendly `stackgen-sync --check` report-only
  mode; a `stackgen-ux-gate` (or generated ux-gate mechanism) before any UI
  stack is generated; doctor or sync asserting `.claude/stackgen/` lockfile↔tree
  integrity.

## Risks

- **Depth costs tokens** — a full bar run is ~10+ research passes plus review
  rounds. Accepted: shallow output is worthless, and generation runs once per
  technology per repo, on an explicit pin.
- **Bars can rot** — the bar is a closed list maintained by hand. The coverage
  audit in the backlog is the periodic correction.
- **Open-decision honesty depends on detection quality** — a weak detection pass
  turns settled repo patterns into "open decisions". The detected block recorded
  in the payload keeps this reviewable.
