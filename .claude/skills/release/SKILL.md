---
name: release
description: Cut a release — the plugins via plugins:release, the installer
  CLI
  via i:release, the GitHub Release note format, and the CI facts that make a
  failed publish legible. Run when the user asks to cut, tag, or publish a
  release.
allowed-tools: Read Grep Glob Bash
---

# Release

**Ask the user before running `i:release` or `plugins:release`.** It is the
repo's hard rule, and both tasks tag and push.

**There are two independent things to release, and one tag family each.** Ask
which is meant before doing anything; the answer is usually visible in what
changed.

| Releasing           | Tag                    | Task              | Ends at              |
| ------------------- | ---------------------- | ----------------- | -------------------- |
| one or more plugins | `<name>-v<version>`    | `plugins:release` | the pushed tag       |
| the installer CLI   | `installer-v<version>` | `i:release`       | npm + GitHub Release |

The namespaces must both stay prefixed. GitHub's tag globs match any character
except `/`, so a bare `v*` family matched `vwf-v19.9.0` and fired the npm
publish on a plugin release — which is why `release.yml` filters `installer-v*`.
The pre-2026-08-30 `v3.1.0`–`v6.0.0` tags are history; nothing fires on them.

## Releasing plugins

Each entry in `.claude-plugin/marketplace.json` pins its plugin to a
`<name>-v<version>` tag, and that ref is **derived** from the plugin manifest's
`version`. So bumping a version is what declares a release; the task only
materializes the tag the manifest already names.

```sh
# on develop: bump plugins/<name>/.claude-plugin/plugin.json, then
mise run plugins:marketplace     # the ref renames itself
# merge develop → main, then
mise run plugins:release --dry-run
mise run plugins:release
```

`plugins:release` tags only the plugins whose ref has no tag yet, so a plugin
whose version did not move is skipped and its entry stays byte-identical — that
is what makes releases per-plugin. It refuses to run off `main`, on a dirty
tree, or against a stale manifest.

**No GitHub Release and no npm publish.** The tag *is* the release. Users move
with `claude plugin marketplace update virajp-plugins` (re-reads the pins) then
`claude plugin update <name>` (fetches them) — both steps, or nothing moves.

If `plugins.yml` goes red on `main` with *"marketplace.json pins X, which is not
a tag"*, the merge landed and the tags did not. Run `plugins:release`.

## Releasing the installer CLI

Releasing via CI is preferred over the local `i:publish`, so every version keeps
the strongest npm trust level (trusted publisher).

### 1. Bump on develop, merge to main

`main` is merge-only — the `no-commit-to-branch` hook blocks a commit there — so
`i:release` neither bumps nor commits. It is the same shape as
`plugins:release`: tag what has already landed.

```sh
# on develop
mise run i:version              # patch; --minor / --major to choose the bump
git add package.json && mise x -- git commit -m "ops: bump installer to X.Y.Z"
# merge develop → main
```

### 2. Cut the tag

```sh
# on main
mise run i:release
```

It requires a clean tree **and `main`**, refuses if `installer-vX.Y.Z` already
exists (which means `package.json` was never bumped for this release), runs
`i:test`, creates the annotated tag, then — interactively — pushes **`main`
first and the tag second** and watches the `release.yml` run with
`gh run watch --exit-status`, so the task only succeeds if the publish pipeline
does. It needs `gh` installed and authenticated.

The push order is load-bearing: `release.yml` checks the tagged commit is
reachable from `origin/main`, so a tag arriving before the branch fails that
gate. `plugins:release` pushes tags alone because no plugin tag is checked for
reachability.

`--ci` stops after the tag, with no push and no watch. `deps-update.yml` passes
it, having done its own bump, commit and merge first. Do not pass it by hand.

### 3. Cut the GitHub Release

Every `installer-vX.Y.Z` tag carries one — the tag is the npm-publish trigger,
the Release is the human-readable record beside it. The mapping is **1:1**, so a
missing Release means a missed step. Plugin tags get no Release.

```sh
gh release create installer-vX.Y.Z --title installer-vX.Y.Z \
  --notes-file <notes> --verify-tag
```

- **Creating a Release never publishes.** `release.yml` triggers on
  `push: tags: installer-v*`; nothing listens for `release` events.
  `--verify-tag` keeps it that way by refusing to invent a tag — which *would*
  push and publish.
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
   whose version changed since the previous tag. Informational: those plugins
   ship on their own tags, not on this one.
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
- **No publish path may move into another file** — that is why plugin validation
  lives in the separate `plugins.yml`, which publishes nothing and holds no
  `id-token` permission. Narrowing *which tags* reach `release.yml` is a
  different thing and is safe: npm matches the filename, not the trigger. That
  is what let the tag filter become `installer-v*`.

## Before cutting

Confirm the working tree is clean and that the change being released has its
docs reconciled — `readme.md`, `CLAUDE.md` and `docs/plugins/<plugin>.md` ship
with the change, not after it.
