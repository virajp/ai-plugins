# Format Versioning

vwf's blueprint format evolves. `init` records the format a repo conforms to
and, on re-run, migrates the gap.

**The stamp** — `docs/blueprint/.vwf.yml`:

```yaml
blueprint_format: 3
topology: monorepo # or polyrepo
projects: [ api, web, worker ] # by registry name
ui: true # design-system required
integrations: true # environment.md required (external integration / secret exists)
```

**Source of truth (shipped).** The format the installed vwf ships is the integer
in `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`. The workflow commands
self-check the repo stamp against it via
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md` and nudge `/vwf:init` on drift —
this is what reaches each repo, since vwf is installed once at user level and an
upgrade does not re-run per repo.

**Current format = 3.** Format 3 = format 2 **plus** an **Environment &
Secrets** foundation. A format-2 repo is a format-1 repo whose every
`docs/blueprint/` doc is a well-formed **OKF concept** (vwf is an opinionated
profile of Google's Open Knowledge Format — see the blueprint-authoring skill's
frontmatter-and-links reference). Concretely, format 2 = format 1 **plus**:

- Every blueprint doc opens with **YAML frontmatter** carrying the mandatory
  `type`, `title`, `description`, `status` (optional standardized `timestamp` /
  `owner` / `resource` / `tags`). `type` is from the vwf vocabulary
  (`vwf-architecture`, `vwf-conventions`, `vwf-design-system`,
  `vwf-environment`, `vwf-integration`, `vwf-entity`, `vwf-plan`,
  `vwf-gap-report`; `vwf-environment` arrives with format 3 below).
- Cross-doc relationships are **typed markdown links** (the OKF edge), not
  prose: an entity's **Relationships** rows link the related entity's doc, and
  **References** link `conventions.md` anchors / `design-system.md`.

And format 3 adds one artifact + one type:

- `docs/blueprint/environment.md` (type **`vwf-environment`**) — the
  product-wide per-project inventory of env vars and secrets (no values), a
  foundation alongside `conventions.md`. **Required once `integrations: true`**
  — i.e. the architecture registry's `cross_cutting.integrations` is non-empty
  or `config` selects a secrets manager. `conventions.md#config` keeps only the
  injection *mechanism* (the decision); the per-variable catalog lives in
  `environment.md`.

A format-3 repo therefore also has (unchanged from formats 1–2):

- `docs/blueprint/architecture.md` (registry) and `conventions.md`
- `design-system.md` **if** `ui: true`
- `environment.md` **if** `integrations: true`
- `integration.md` once cross-entity flows exist
- entity docs with **Relationships**, **Concurrency & Consistency**, and
  **Screens** that reference `design-system.md`. Each entity is **either** a
  single file `docs/blueprint/<entity>.md` **or** a folder
  `docs/blueprint/<entity>/` (`index.md` + `data.md` / `api.md` / `jobs.md` /
  `screens.md`) — both conform; the folder form is **not** drift and must not be
  collapsed to a single file on migration.
- `docs/plans/` with `archived/`

**Drift → migration map.** On re-run, compare the stamp's `blueprint_format` to
the current format and apply the delta:

- **no stamp / legacy `docs/specs/`** → migrate `docs/specs/` →
  `docs/blueprint/` (rename), add the format-1 artifacts, then apply the `1 → 2`
  delta below, write the stamp.
- **`1 → 2`** → for every existing `docs/blueprint/` doc: (a) prepend the OKF
  frontmatter block — infer `type` from the doc's role, `title` from the H1,
  `description` from its purpose line, and set `status: reviewed` for docs
  already in use (else `draft`); leave the optional
  `timestamp`/`owner`/`resource`/`tags` out unless useful (git already tracks
  edit time in-repo). (b) Rewrite each entity's **Relationships** "Related
  entity" cell and its **References** as markdown links to the target doc
  (`[Customer](./customer.md)`, or `../customer/index.md` from a folder surface
  file). Content is otherwise unchanged. Then bump the stamp to `2`.
- **`2 → 3`** → add the **Environment & Secrets** foundation **when the registry
  declares integrations or a secrets-manager `config`** (else no-op — a repo
  with no external integration/secret does not need it, and its absence is not
  drift). Scaffold `docs/blueprint/environment.md` from the environment template
  (type `vwf-environment`). Populate its per-project rows from the repo's
  **existing** env-var/secret usage — config schemas, `.env`/`.env.example`
  files, mise env values, CI secrets/variables — one row per variable (name,
  purpose, issuer, used-by, required, classification), **never the values**. If
  a prior `conventions.md#config` (or any doc) held a secrets/env-var *catalog*,
  move those rows into `environment.md` and leave `#config` with only the
  injection *mechanism*, linking `environment.md`. Add `integrations: true` to
  the stamp. Then bump the stamp to `3`.
- **future bumps** → add an `N → N+1` entry here describing exactly what to add
  or change, so a re-run is a mechanical, reviewable migration.

Bump `blueprint_format` whenever a vwf change requires restructuring an existing
repo: increment `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`, add the `N→N+1`
delta here so `init` can carry it out, and the workflow commands will start
nudging stale repos automatically.
