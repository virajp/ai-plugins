---
name: release
description: Cut a release of @askviraj/ai-plugins — the i:release ritual, the
  GitHub Release note format, and the CI facts that make a failed publish
  legible. Run when the user asks to cut, tag, or publish a release.
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash
---

# Release

**Ask the user before running `i:release`.** It is the repo's hard rule, and the
task commits, tags, pushes and triggers a publish.

Releasing via CI is preferred over the local `i:publish`, so every version keeps
the strongest npm trust level (trusted publisher). `v*` is the **installer
CLI's** namespace, matching `package.json` — not a plugin version. Marketplace
plugin versions are not separately tagged; they ride the CLI release that
carries them.

## The procedure

### 1. Cut the tag

```sh
mise run i:release              # patch; --minor / --major to choose the bump
```

It requires a clean tree, runs `i:test`, bumps `package.json`, commits
`ops: release vX.Y.Z`, creates the annotated tag, then — interactively — pushes
the commit and tag and watches the `release.yml` run with
`gh run watch --exit-status`, so the task only succeeds if the publish pipeline
does. It needs `gh` installed and authenticated.

`--ci` stops after the tag, with no push and no watch. `deps-update.yml` passes
it and does its own push and dispatch. Do not pass it by hand.

### 2. Cut the GitHub Release

Every `vX.Y.Z` tag carries one — the tag is the npm-publish trigger, the Release
is the human-readable record beside it. The mapping is **1:1**, so a missing
Release means a missed step.

```sh
gh release create vX.Y.Z --title vX.Y.Z --notes-file <notes> --verify-tag
```

- **Creating a Release never publishes.** `release.yml` triggers on
  `push: tags: v*`; nothing listens for `release` events. `--verify-tag` keeps
  it that way by refusing to invent a tag — which *would* push and publish.
- **`--latest` resolves by publish date**, so a normal forward release is
  correct by default. Pass `--latest=false` when backfilling out of order.

## The note format

Follow `.config/git-conventional-commits.yaml` — the same config the repo
already uses. **Do not invent a second changelog format.**

- Eligible types are `feat`, `fix` and `refactor`, plus breaking changes.
  `includeInvalidCommits: false`, so `ops:` / `docs:` / `blueprint:` / `merge:`
  are excluded. Commits matching `^[wW][iI][pP]\b` are skipped.
- Headlines: **Features**, **Bug Fixes**, **Performance Improvements**,
  **Merges**, **BREAKING CHANGES**.
- Scopes are bolded; each entry links its commit via
  `https://github.com/virajp/ai-plugins/commit/%commit%`.

Shape of the note, in order:

1. An optional `**Plugin versions:**` line — **only** the marketplace entries
   whose version changed since the previous tag.
2. The changelog sections.
3. A `**Full Changelog**` compare link.

A tag with no eligible commits still gets a Release, saying it is a maintenance
release.

## Facts that make a failed publish legible

- **npm allows exactly one Trusted Publisher per package, and it validates the
  entry-point workflow's *filename*** — so it is set to `release.yml` only.
  `workflow_call` therefore does **not** work: the repo shipped it that way for
  two months and both monthly runs died at the publish step with `ENEEDAUTH`,
  because npm saw `deps-update.yml` and matched nothing. `deps-update.yml`
  publishes by **dispatching** `release.yml` on the new tag.
- **Refs pushed with `GITHUB_TOKEN` do not start workflow runs** — but
  `workflow_dispatch` and `repository_dispatch` are explicit exceptions, which
  is why no PAT or GitHub App token is needed. The dispatch is fire-and-forget;
  the `release.yml` run is the publish record.
- **The publish step is idempotent**: it skips (does not fail) if that version
  is already on npm, so tag re-points, dispatch retries and re-runs are safe.
- `release.yml` gates on `osv-scanner` over the lockfile before publishing, so
  an unpatched advisory in a transitive dep blocks the release. The remedy is an
  entry in `pnpm-workspace.yaml`'s `overrides`, not a bypass.
- **Publishing uses the npm CLI; everything else stays pnpm.**
- `release.yml` must keep its trigger surface untouched — that is why plugin
  validation lives in the separate `plugins.yml`, which publishes nothing and
  holds no `id-token` permission.

## Before cutting

Confirm the working tree is clean and that the change being released has its
docs reconciled — `readme.md`, `CLAUDE.md` and `docs/<plugin>.md` ship with the
change, not after it.
