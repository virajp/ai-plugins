# Format Versioning

vwf's blueprint format evolves. `init` records the format a repo conforms to
and, on re-run, migrates the gap.

**The stamp** — `docs/blueprint/.vwf.yml`:

```yaml
blueprint_format: 1
topology: monorepo # or polyrepo
projects: [ api, web, worker ] # by registry name
ui: true # design-system required
```

**Source of truth (shipped).** The format the installed vwf ships is the integer
in `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`. The workflow commands
self-check the repo stamp against it via
`${CLAUDE_PLUGIN_ROOT}/assets/format-check.md` and nudge `/vwf:init` on drift —
this is what reaches each repo, since vwf is installed once at user level and an
upgrade does not re-run per repo.

**Current format = 1.** A format-1 repo has:

- `docs/blueprint/architecture.md` (registry) and `conventions.md`
- `design-system.md` **if** `ui: true`
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
  `docs/blueprint/` (rename), add the format-1 artifacts, write the stamp.
- **future bumps** → add a `1 → 2:` entry here describing exactly what to add or
  change, so a re-run is a mechanical, reviewable migration.

Bump `blueprint_format` whenever a vwf change requires restructuring an existing
repo: increment `${CLAUDE_PLUGIN_ROOT}/assets/blueprint-format`, add the `N→N+1`
delta here so `init` can carry it out, and the workflow commands will start
nudging stale repos automatically.
