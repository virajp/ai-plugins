# The docs vwf maintains, OKF, and format versioning

The tree the workflow skills write into a product repo, why it is an OKF bundle,
and how the two format stamps work.

Docs the commands maintain live under `docs/blueprint/` (the outcome contract
`product.md` — problem/users/goals/slice-priority + the `/vwf:feedback`-owned
Metric readings appendix + the optional Tiers & entitlements matrix — the
machine-readable registry `registry.yaml` beside its prose view
`architecture.md`, `conventions.md`, the product-wide `design-system.md`, the
per-project env-var/secret catalog `environment.md`; **one flow folder per flow,
grouped by primary registry project and numbered in execution order** —
`flows/<project>/<NNN>-<flow>/index.md` at one uniform depth for UI and non-UI
projects alike — `index.md` holding the **platform-agnostic contract** (trigger,
actors, steps, diagram, jobs, acceptance; no screens) beside one
**`<platform>.md` per implemented platform** (`mobile`/`tablet`/`desktop`/
`web`/`auto`) carrying that platform's Screens (rows coded `<NNN><letter>`,
codes **shared across platform files**, each with its per-screen Components
block); a non-UI flow is `index.md` alone, as is a `cli` project's — the sixth
platform is a terminal surface with no screens, so it takes no platform file and
never reaches the canvas, mockups or the scratchpad, and a cli-only project is
exempt from the standard-flows mandates. Numbers are **designated** — `100` is
always `home`, `010` splash / `020` signin / `030` recover-account / `040`
onboarding, `110`–`890` product flows, `910`–`940` the account screens — on one
number line per project. `flows/index.md` is the catalog (per-project sections,
numeric order, a Platforms column) + inter-service contracts; **one entity
folder per entity** — `entities/<entity>/` holding exactly `index.md` +
`schema.yaml` — with `entities/index.md` the catalog + product-wide erDiagram;
and the API contracts `apis/<project>.openapi.yaml` — one per API-publishing
project, one declaring the `service` platform — plus the frozen `apis/released/`
snapshots, which a `service` with no co-declared screen platform alone gets (a
`[service, webapp]` project's API serves its own UI, so no independent consumer
needs the freeze); the blueprint root holds only the system docs), `docs/plans/`
(`<date>-<time>-<slice>.md`, with `archived/`), and `docs/prompts/`
(`<type>/<project>/<NNN>-<flow>/<platform>.md` — canvas design briefs grouped by
prompt type → registry project → flow, one brief per platform regenerated in
place (the filename carries the platform, mirroring the flows tree exactly),
plus the per-design-project canvas conventions files
`screens/<project>/CLAUDE--<platform>.md`; written by `/vwf:screens prompt`;
committed intent artifacts, not blueprint docs), and `docs/scratchpad/`
(**gitignored, never committed** — the mockup render tree,
`<project>/<NNN>-<flow>/<platform>/<screen-slug>[--<state>].html`, written by
`/vwf:mockups` and blueprint §6a, overwritten in place per flow; vwf auto-adds
the `.gitignore` line when missing). Superseded commands/agents/templates are
archived under `archived/vwf-<date>/` (`vwf-2026-06-19/` from the prior model;
`vwf-2026-07-04/` holds the retired `autopilot` command, whose behavior merged
into `execute`; `vwf-2026-07-07/` the format-8 `integration.md` template,
dissolved into the flow templates).

The `docs/blueprint/` tree is an **OKF bundle** — vwf is an opinionated
*profile* of Google's Open Knowledge Format (OKF) v0.1. Every doc is a typed OKF
concept: mandatory YAML frontmatter (`type` from a fixed vocabulary —
`vwf-product`/`vwf-architecture`/`vwf-conventions`/`vwf-design-system`/
`vwf-environment`/`vwf-flow`/`vwf-flow-platform`/`vwf-integration` (the flow
catalog)/`vwf-entity`/`vwf-entities`/`vwf-plan`/`vwf-gap-report` — plus `title`,
`description`, `status`; optional `timestamp`/`owner`/`resource`/`tags`;
flow/entity docs additionally carry the pipeline-owned `implementation:` build
stamp), and cross-doc relationships are typed markdown links (the OKF edge)
rather than prose. YAML artifacts (`registry.yaml`, `schema.yaml`,
`*.openapi.yaml`) are typed by **path**, not frontmatter (the OpenAPI files
carry only `info.x-vwf.status`). This makes a blueprint portable to any
OKF-aware tool (e.g. the OKF static-HTML visualizer) and ingestable by graphify,
and lets the `blueprint-reviewer` verify frontmatter + that every edge resolves.
The doctrine lives in the blueprint-authoring skill's `frontmatter-and-links`
reference.

**Format versioning.** vwf ships the stamp in `assets/blueprint-format`
(currently **23**). Since vwf 18 the stamps are **drift detectors only** —
nothing selects a migration by them. There is no `N → N+1` delta ladder for the
blueprint format: a stale stamp sends `/vwf:setup` into its `migrate` mode,
which **reconciles the tree against the current format's own sources**
(`assets/templates/`, `assets/examples/blueprint/`, the blueprint-authoring
bars, `assets/vwf-config.md`) rather than replaying steps, resolving retired
spellings through the lineage table in
`skills/setup/references/format-lineage.md` and confirming by MCQ any spelling
that fans out to more than one current one. There is therefore no support
window: any stamp reconciles to the shipped one. **Do not restate the per-format
history here** — what each past format changed is git's job; a second narrative
copy is precisely the drift the density doctrine warns about, and it was 105
lines of this file before format 16. The *current* shape is what this section
describes throughout; the paired `config_format` (currently **16**) is described
under `assets/vwf-config.md`, and its own `N → N+1` deltas do still live there —
state-based reconciliation replaced the **blueprint** ladder only. The two
stamps are separate number lines, which have now drifted apart in both
directions: `14` and `16` shipped without a blueprint bump (the first closed the
stack menu; the second gave each stack axis its `unresolved` state and made
`deploy_template` a list) and `21` shipped without a config bump (it only moved
one config file). `22`/`15` shipped **together**, as `19`/`12` and `20`/`13` did
— the config's `template` pin and `ui:` key both depend on the platform
vocabulary, so a repo on one but not the other is a state neither migration
expects. `23` then shipped alone and purely additively: it lifts the
blueprint-coverage exemption for the `plugin` platform, retires no spelling, and
needs no config key.
