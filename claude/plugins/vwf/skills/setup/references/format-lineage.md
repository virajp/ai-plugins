# Format Lineage

Every spelling vwf has retired, and what it is called now. Read this while
reconciling a repo authored against an older format: such a tree usually names
things *correctly for the format it was written in* and wrongly for this one,
and that difference is a rename to recognise, not a gap to fill.

This file replaces the per-format delta ladder. Reconciliation is
**state-based** — diff the tree against the current format's definition sources
(`${CLAUDE_PLUGIN_ROOT}/assets/templates/`,
`${CLAUDE_PLUGIN_ROOT}/assets/examples/blueprint/`, the blueprint-authoring bars, and
`${CLAUDE_PLUGIN_ROOT}/assets/vwf-config.md`) and fix what differs. The table below
exists only so a retired spelling resolves to the thing it became rather than
registering as something unknown.

## What the stamps mean now

`blueprint_format` (**22**) and `config_format` (**15**) are **drift
detectors** and nothing else. `${CLAUDE_PLUGIN_ROOT}/assets/format-check.md` compares
a repo's stamps against the shipped integers and nudges
`/vwf:setup`. Nothing selects a migration path by them any more,
and there is no support window: a repo stamped `2` and a repo stamped `21`
reconcile against the same current format, by the same algorithm, in one pass.

Two blueprint integers were never issued — **13** and **17**. A repo whose
`blueprint_format` reads 13 is treated as 12, and one reading 17 as 16. The two
stamps are separate number lines and never comparable: `config_format` 13 is
real.

## The lineage table

A **fan-out** row maps one retired token onto more than one current spelling and
must go through the rule below. Every other row is mechanical.

| Retired spelling | Current spelling | Kind | Fan-out |
| --- | --- | --- | --- |
| `workspace`, then `polyrepo` | `multi-repo` plus `linkage: submodule` | topology | |
| a project's `type:` key | `role:` | role | |
| `api`, `service` | `backend` + `platforms: [ service ]` | role | |
| `worker` | `backend` + `[ worker ]` | role | |
| `web` (as a role), `site` | `frontend` + `[ site ]` | role | yes |
| a `site` that publishes its own API contract | `backend` + `[ service, webapp ]` | role | yes |
| `console`, `fullstack` | `backend` + `[ service, webapp ]` + the `operator-rbac` capability | role | |
| `app`, `frontend` on screen platforms | `frontend` + its own platform list | role | |
| `frontend` whose only platform is `cli` | `frontend` + `[ cli ]` | role | |
| `infra`, then `iac` | `system` + `[ iac ]` | role | |
| `library`, `packages` | `[ packages ]` under **any** role — the consumer decides | role | yes |
| `web` (as a platform) | `site` or `webapp` | platform | yes |
| `carplay`, `android-auto` | `auto` | platform | |
| `desktop` on a content-surface project | `web`, then `site` or `webapp` | platform | yes |
| `cli` as a config-only key | a registry `platforms:` token like any other | platform | |
| `assets/stacks/<type>.md` | `assets/stacks/<type>/<slug>.md`, with frontmatter | template-path | |
| `<type>/<slug>`, `console/<slug>` | `project/<slug>` (it passed through `project/fullstack/<slug>`) | template-path | |
| `project/<role>/<slug>` | `project/<slug>` | template-path | |
| `template: custom` | retired — repin from the stack plugin's menu | template-path | yes |
| `docs/specs/` | `docs/blueprint/` | file-location | |
| `docs/blueprint/.vwf.yml` | `.config/vwf.yaml` | file-location | |
| `docs/blueprint/<entity>.md`, or `<entity>/` at the blueprint root | `entities/<entity>/index.md` + `schema.yaml` | file-location | |
| entity `data.md` / `api.md` / `jobs.md` / `screens.md` | `index.md` + `schema.yaml`, `apis/<project>.openapi.yaml`, and the owning flow's Screens and Jobs | file-location | yes |
| a single-file entity's `## Data Model` table | `schema.yaml` — Field/Type/Optional/Default/Validation become `properties`/`required`/`default`, unmappable prose the property's `description` | file-location | |
| a single-file entity's `## API Surface` table | `apis/<project>.openapi.yaml`, one operation per row with a generated `operationId` | file-location | |
| `docs/blueprint/integration.md` | `flows/index.md` plus one `flows/<project>/<NNN>-<flow>/index.md` per flow | file-location | |
| `architecture.md`'s `## Project Registry` and `## Cross-cutting Decisions` | `registry.yaml` (`projects`, `cross_cutting`) | file-location | |
| links to `architecture.md#project-registry` | `./registry.yaml` | file-location | |
| `flows/<flow>/`, `flows/<project>/<device>/<NNN>-<flow>/` | `flows/<project>/<NNN>-<flow>/` | file-location | |
| a flow's `## Screens` section inside `index.md` | `<platform>.md` beside it | file-location | |
| an in-car flow as its own folder | `auto.md` inside the parent flow it is a subset of | file-location | yes |
| `docs/prompts/screens/<project>/<device>/<NNN>-<flow>/<seq>.md` | `docs/prompts/screens/<project>/<NNN>-<flow>/<platform>.md` | file-location | |
| a prompt tree's `carplay.md` / `android-auto.md` | `auto.md` | file-location | |
| `docs/prompts/screens/<project>/<device>/CLAUDE--<platform>.md` | `docs/prompts/screens/<project>/CLAUDE--<platform>.md` | file-location | |
| `docs/handoffs/next.md` | `docs/memory/handoff/next.md` | file-location | |
| a `mempalace.yaml` per repo, or one under `.config/` | exactly one per mined tree, at that tree's root | file-location | |
| an entity's `Serves:` line | `Used by:`, linking the flows that use it (flows keep `Serves:`) | doc-section | |
| `## Consistency boundary`, `## Failure handling`, `## Idempotency`, and links to them | one `## Guarantees` table, anchored `#guarantees` | doc-section | |
| a flow's `device:` frontmatter key | the `Platforms` table plus each `<platform>.md`'s `platform:` | doc-section | |
| the registry's `deviations:` block | the config's `enforcement:` block | doc-section | |
| `stage-*` / `prod-*` tag globs in `conventions.md#pipeline` | `<project>-stage-v<semver>` / `<project>-prod-v<semver>` | doc-section | |
| a secrets or env-var **catalog** under `conventions.md#config` | `docs/blueprint/environment.md`; `#config` keeps only the injection mechanism | doc-section | |
| type `vwf-integration` on a root `integration.md` | the same token, now the type of `flows/index.md` — the spelling never changed, its referent did | doc-section | |
| an entity's `Actors & Actions` section | retired — actors are the owning flow's Trigger & Actors | retirement | |
| ungrouped, unnumbered flow folders | `flows/<project>/<NNN>-<flow>/`, gap-numbered by 10 | numbering | |
| numbers assigned per device subgroup | one number line per project | numbering | |
| any number on a standard flow | its designated number (`010`/`020`/`030`/`040`, `100`, `910`–`940`); everything else into `110`–`890`, existing order preserved | numbering | |
| a screen code carrying the old flow number (`010a`) | re-coded to the new number (`100a`), letters and order kept | numbering | |
| a synonym flow slug (`login`, `dashboard`, …) | the standard slug in `${CLAUDE_PLUGIN_ROOT}/assets/standard-flows.md` | numbering | yes |
| a standard flow's primary screen name (`Dashboard`) | the flow's slug (`home`) | numbering | yes |
| canvas page names `010-signin--mobile`, `--carplay` | `020-signin--mobile`, `--auto` — this targets canvas state, not the repo tree | numbering | |
| `pipeline.autopilot_caps` | `pipeline.execute_caps` | config-key | |
| `mockups:`, `mockups.project_id` | `design:`, `design.project_id` | config-key | |
| `design.project_id`, a flat `design.projects.<project>` | `design.projects.<project>.<platform>` | config-key | yes |
| `design.design_system_id` tied to a mockup project's uuid | the same key, now its own canvas project, one per product — a value equal to one of `design.projects`' uuids is the drift signal | config-key | |
| `design.flows_pushed` | `design.flows_rendered` | config-key | |
| `design.tool` | `projects.<name>.design`, on UI projects only | config-key | |
| product-wide `backing:` / `deploy:` | `projects.<name>.stack.backing_template` (a list) / `deploy_template` | config-key | |
| a project's `stack:` key in the registry | `projects.<name>.stack` in the config — the registry carries no stack at all | config-key | |
| no CI axis anywhere — there was never a product-wide `cicd:` to move down | `projects.<name>.cicd`, detected once from the repo and confirmed | config-key | yes |
| `projects.<name>.platforms` in the config | the registry's `platforms:` — the single source | config-key | yes |
| `ui:` computed from a project's UI **role** | the same key, now true when some project declares a screen platform — recompute it from the registry rather than trusting a stale `true` on a `cli`-only product | config-key | |
| `enforcement.stacks` | retired — `projects.<name>.stack` plus its `note` | config-key | |
| `projects.<name>.stack_reason` | `projects.<name>.stack.note`, carried verbatim | config-key | |
| a flat **list** at `projects.<name>.stack` | the structured block — `template`, `languages`, `frameworks`, `dependencies`, split per `${CLAUDE_PLUGIN_ROOT}/assets/stack-vocabulary.md` | config-key | |
| `enforcement.structure` | retired — `topology` plus `topology_reason` | config-key | |
| a flow id carrying a `<device>` segment, or missing its `<platform>` leaf | `<project>/<NNN>-<flow>/<platform>` | config-key | |
| `environments` keys `dev`, `test`, `stage`, `prod` | `development`, `staging`, `production` — `test` has no single canonical partner; propose, never auto-fix | config-key | yes |
| mempalace rooms `plans`, `decision` | `planning`, `decisions` | config-key | |

Two notes the table cannot carry. **vwf ships no stack templates**: a
`project/<slug>` pin resolves through a stack plugin
(`${CLAUDE_PLUGIN_ROOT}/assets/stack-adapter.md`), so a retired path is repinned from a
menu, never rewritten by hand. And **renaming a mempalace room in the config
does not move drawers already filed under the old name** — report what was found
and let the user decide; a format reconcile never rewrites a live palace.

## The fan-out rule

A retired token that maps to more than one current spelling is **never picked
silently**. Resolve each one in three steps:

1. **Read the evidence.** The recognition tables in `topology-detection.md` say
   what each current spelling looks like on disk. Judge the directory, not the
   name it used to carry.
2. **Propose** the mapping that evidence supports, quoting the evidence that
   supports it.
3. **Confirm by MCQ**, one decision per round per
   `${CLAUDE_PLUGIN_ROOT}/assets/elicitation.md`, with the other candidates offered.

Where no evidence separates the candidates, ask outright rather than defaulting.
Old role `packages` is the case that proves the rule: `packages` is now a
platform available under every role, the role names the package's primary
consumer domain, and nothing about the package's behaviour changes either way —
so a wrong answer here is invisible forever.
