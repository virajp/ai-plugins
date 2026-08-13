# Format & Legacy Reconcile (§3)

Read this at §3, alongside the project-setup skill's `format-versioning`
reference. It lists the deltas to compute and what counts as drift in the
current layout; `format-versioning` is authoritative for how each delta is
performed. A repo already on the shipped format needs neither.

## The migration deltas

Per the project-setup skill (format-versioning), compute the **migration delta**
between the repo's current format and the format this vwf ships — a legacy
`docs/specs/` tree to upgrade, a missing `design-system.md` / `environment.md`,
entity docs lacking Relationships / Concurrency, the **`1 → 2`** delta (docs
missing OKF frontmatter and relationships/references not yet written as markdown
links), the **`2 → 3`** delta (a missing `environment.md` when the registry
declares integrations or a secrets-manager `config`), the **`8 → 9`** delta (the
process-based restructure below), the **`9 → 10`** delta (flows regrouped by
primary project and numbered in execution order — per format-versioning, a
mechanical `git mv` + link rewrite with the ordering elicited), or the
**`10 → 11`** delta (a UI project's flows regrouped under device-type subgroups,
Screens rows gaining their frame Codes, in-car journeys elicited into their own
subset flows — per format-versioning), the **`12 → 14`** delta (those device
subgroups flattened back out, the device moving into the flow's `device:`
frontmatter key — a mechanical `git mv` + link rewrite + config entry rewrite),
the **`19 → 20`** delta (`role: infra` renamed to `role: iac` in every
`registry.yaml`, plus the own-repo rule for `iac` projects — the restructure
proposal §4 carries), or the **`21 → 22`** delta (the seven-token `role`
vocabulary collapsing to four roles plus a per-project `platforms:` list,
`polyrepo` becoming `multi-repo` + `linkage:`, `members:` and the per-member
`.config/vwf-membership.yaml`, the `web` platform splitting into `site` and
`webapp` with its platform files renamed, and the project-axis stack pin losing
its `<role>/` segment — run it with the config's `14 → 15`). Fold in any old or
partial structure.

## What counts as drift in the current layout

Since format 14 the conforming layout is **flows-first and project-grouped**:
every flow, UI or not, under
`docs/blueprint/flows/<project>/<NNN>-<flow>/index.md` at one uniform depth,
with a UI project's flow declaring its device in the `device:` frontmatter key
(`mobile` / `web` plus declared in-car platforms) and numbered in execution
order with gap numbering **per device**, entities under
`docs/blueprint/entities/<entity>/` (`index.md` + `schema.yaml`), API contracts
under `docs/blueprint/apis/`, and the root reserved for the system docs. A root
`integration.md`, an entity folder at the blueprint root, entity surface files
(`data.md`/`api.md`/`jobs.md`/`screens.md`), a flat `<entity>.md`, an
ungrouped/unnumbered `flows/<flow>/` folder, or a UI project's flow sitting
directly under `flows/<project>/` **is** drift — the `8 → 9` delta (per
format-versioning) performs the mechanical scaffold phase with `git mv` (move,
never delete), splits `integration.md` into per-flow docs, extracts Data Model
tables to `schema.yaml` and API tables to OpenAPI stubs, seeds the
`implementation:` stamps, and downgrades coverage to `partial`; the follow-up
`/blueprint` sweep (offered, consent-gated) does the elicited fill. YAML
artifacts the scaffold writes must parse — validate them in step 10.
