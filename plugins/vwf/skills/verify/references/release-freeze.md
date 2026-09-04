# §5 — Release (production only)

Read this only when §1 established that this run targets the **release
environment** and §§2–3 both came back clean. A staging run, or any run with a
failed probe or a non-`PASS` criterion, skips §5 entirely and goes straight to
the persist step in `SKILL.md`.

Behind an explicit confirmation — never automatic:

> "Record a production release? This freezes each deployed service's API
> contract and every stored entity's schema — later API changes must be
> backward compatible or take a major-version bump, and later non-additive
> entity-schema changes must ship staged (expand → migrate → contract)."

On yes, for each registry `service` project that was deployed & healthy in this
environment and has a living contract
`docs/blueprint/apis/<project>.openapi.yaml`:

1. Read `info.version` — it must be **semver**; otherwise skip that project's
   snapshot and flag it (the blueprint sweep's coherence review requires semver,
   so this means drift).
2. Copy the living contract to
   `docs/blueprint/apis/released/<project>@<info.version>.openapi.yaml`.
   - Same version, **identical** content already there → skip ("already
     released").
   - Same version, **different** content → refuse and flag as a **hard gap**
     (the version must be bumped; the coherence review should have caught this)
     — do not overwrite a released snapshot, ever.
3. **Entity schemas — same copy machinery, same freeze moment.** For every
   entity with a living `docs/blueprint/entities/<entity>/schema.yaml`, copy it
   to `docs/blueprint/apis/released/entities/<entity>@<YYYY-MM-DD>.schema.yaml`
   (today's date; the latest release is the latest date in the filenames —
   entity schemas carry no semver).
   - Latest snapshot for that entity **identical** in content → skip ("already
     released").
   - Same date, **different** content → refuse and flag as a **hard gap** — do
     not overwrite a released snapshot, ever.
   From the first snapshot on, a non-additive change to a released entity
   schema must ship staged per `baseline/expand-contract` (expand → migrate →
   contract); the blueprint sweep's coherence review and `/vwf:plan`'s
   preflight enforce it.
4. Report what was frozen, per project and per entity.

**A `service` with no co-declared screen platform.** A project declaring
`[service, webapp]` owns a contract too, but its API
serves its own UI shipped in the same deployable — there is no independent
consumer for a freeze to protect, so it is never snapshotted and never carries
the additive-only diff. Say so if the user asks why one was skipped.

The snapshot dir **is** the release record — the latest release is the highest
semver in the API filenames (the latest date in the `entities/` filenames);
nothing is written to config. From the first snapshot on, the blueprint sweep's
coherence review and execute's code-review compat dimension enforce
additive-only changes against it.
