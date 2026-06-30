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

**Current format = 1.** A format-1 repo has:

- `docs/blueprint/architecture.md` (registry) and `conventions.md`
- `design-system.md` **if** `ui: true`
- `integration.md` once cross-entity flows exist
- entity docs with **Relationships**, **Concurrency & Consistency**, and
  **Screens** that reference `design-system.md`
- `docs/plans/` with `archived/`

**Drift → migration map.** On re-run, compare the stamp's `blueprint_format` to
the current format and apply the delta:

- **no stamp / legacy `docs/specs/`** → migrate `docs/specs/` →
  `docs/blueprint/` (rename), add the format-1 artifacts, write the stamp.
- **future bumps** → add a `1 → 2:` entry here describing exactly what to add or
  change, so a re-run is a mechanical, reviewable migration.

Bump `blueprint_format` whenever a vwf change requires restructuring an existing
repo, and document the delta here so `init` can carry it out.
