# Change Logs

Every mobile app maintains a **public change log** that feeds the store release
notes. Cross-cutting token: `changelog: keepachangelog-fastlane`.

## Default contract

- **Source of truth**: a `CHANGELOG.md` in the app repo following
  [Keep a Changelog](https://keepachangelog.com) — an `[Unreleased]` section
  accumulating entries, versioned sections cut at release.
- **Store metadata**: per-locale release notes under `fastlane/metadata/`
  (`android/<locale>/changelogs/` and `ios`-side release notes) — the format
  both stores consume — **generated from `CHANGELOG.md` at release time**, not
  hand-written twice. Localized via the app's existing locale set.
- **Execute drafts, release finalizes.** When an executed plan changes
  user-visible app behavior in a `frontend` project, execute's docs-sync step
  appends a draft entry to `[Unreleased]` (user-facing language, not commit
  prose). At release, the human reviews/edits the accumulated drafts, cuts the
  version section, and the store metadata is derived from it. Nothing
  user-facing ships undocumented; nothing reaches the store unreviewed.
- Entries describe **user-visible behavior** (features, fixes, changes a user
  would notice) — internal refactors, dependency bumps, and backend-only changes
  don't get entries.
- Server-side projects do not keep changelogs by default — git history and the
  archived plans are their record; elicit if the product wants an API changelog.

## Elicit per product

- The locales store notes are published in (usually a subset of the app's locale
  set).
- Whether a legacy convention exists to migrate (e.g. a flat
  `release-notes.txt`) — fold its history into `CHANGELOG.md`, don't run two.
- Release automation (fastlane lanes driving the actual store upload) — a
  harness concern to record; vwf never deploys/publishes.

## Blueprint expansion

- `conventions.md#changelog` records the contract (file, format, generation
  path, who drafts/finalizes). No per-entity surface — the hook is execute's
  docs-sync (see `assets/docs-sync.md`) and the release process. Realization
  notes live in the `frontend` reference-stack doc.
