# CI & Releases

## mise environments

The mise config is split by `MISE_ENV` (all under `.config/`, where mise
resolves env variants):

- `.config/mise.toml` — **generic**, loaded everywhere: the common `node` +
  `pnpm` runtime plus settings/env/`tasks.init`.
- `.config/mise.dev.toml` — loaded when `MISE_ENV=dev` (the maintainer's machine
  has this exported): the full dev toolchain (doppler, pre-commit, dprint,
  taplo, gitleaks, grype, jq, opencode, python, uv) + shell aliases.
- `.config/mise.ci.toml` — loaded when `MISE_ENV=ci` (the workflows set this):
  CI-only tools/settings. Currently sets `node.gpg_verify = false` to work
  around a mise-on-Linux bug where its bundled Node release-key import fails on
  the CI runner's gpg with "no valid OpenPGP data found" (the Node tarball is
  still SHA256-checksum verified). Same mise version verifies fine on macOS; see
  jdx/mise discussion #10553.

Keep common tools in `mise.toml` (don't duplicate across dev/ci); put
environment-specific tools in the matching env file.

## The branch model, and the three tag families

**`develop` takes the work; `main` is what users read.** Claude resolves
`claude plugin marketplace add virajp/claude-plugins` against the repo's
**default branch**, so `main` stays the default and PRs target `develop`.

**`main` is merge-only, enforced in two places.** Locally, pre-commit's
`no-commit-to-branch` blocks a commit on `main` — it does *not* block merges,
since git runs `pre-merge-commit` for those and only that hook type is
uninstalled here; the exception is a merge that stops on a **conflict**, whose
resolution ends in a real commit. Remotely, the `protected-branches` ruleset
blocks force-push and deletion on both branches, and `release-tags` does the
same for `refs/tags/*-v*`. Neither requires a PR or a green check, so
`plugins:release`, `i:release`, `site:release` and `deps-update.yml` all still
push directly.

That is why **no release task commits**: `i:release`, `plugins:release` and
`site:release` all tag what has already landed on `main`, and the version bump
is an ordinary `develop` commit (`i:version` for the installer, `site:version`
for the website, the plugin manifest by hand). A release task that commits has
to be trusted to commit the right thing; one that only tags can be checked
against what is already reviewed.

The branch alone would not hold anything back, though, because a merge to `main`
is what publishes. What decouples the two is that **every plugin is pinned to
its own tag** in the marketplace manifest, so shipping is a deliberate act:

```text
bump plugins/<name>/.claude-plugin/plugin.json version   (on develop)
mise run plugins:marketplace                             → the ref renames itself
merge develop → main
mise run plugins:release                                 → creates + pushes the tags
```

The tracked version is always plain `X.Y.Z` — `plugins:check` fails a manifest
carrying build metadata. The `X.Y.Z+N` the authoring machine runs between
releases lives only in the gitignored staged copies `plugins:local` writes
(`dev-marketplace.md`), so no iteration touches git.

`plugins:release` tags **only** the plugins whose ref has no tag yet, which is
what makes releases per-plugin: a plugin whose version did not move already has
its tag and is skipped, so its entry stays byte-identical and
`claude plugin update` sees nothing for it. It refuses to run off `main`, on a
dirty tree, or against a stale manifest — a tag cut anywhere else would publish
content `main` never carried.

**The cost of that discipline, and what pays it.** Between the bump and the tag,
the manifest names a ref that does not exist — normal on `develop`, and harmless
for users, who resolve against `main`. It is *not* harmless for anyone who
registered the marketplace from a local checkout of `develop`: their manifest is
live, so a plugin update fetches a missing tag and a plugin deleted from the
manifest disappears from their machine on the merge. That is what
`.dev-marketplace/` exists for — the authoring machine registers **it** instead,
gets repo-relative sources with no tags in the picture at all, and this section
stops applying to it. Nothing here changes: the tags, the release task and what
users get are exactly as described. See
[`dev-marketplace.md`](dev-marketplace.md).

**Three tag families, all namespaced**, and the namespacing is load-bearing
rather than tidiness:

| Tag                    | Releases                     | Triggers                       |
| ---------------------- | ---------------------------- | ------------------------------ |
| `<name>-v<version>`    | one plugin                   | nothing — refs resolve to it   |
| `installer-v<version>` | `@virajp.dev/claude-plugins` | `release.yml` → npm publish    |
| `site-v<version>`      | the website                  | `site.yml` → `wrangler deploy` |

The installer's tags were bare `v*` until 2026-08-30. GitHub's tag globs match
any character **except** `/`, so `v*` matched `vwf-v19.9.0` — every vwf release
would have fired `release.yml`, failing closed at its version check but failing
every time. Renaming the installer family was preferred over narrowing the glob
because it removes the whole collision class rather than this one instance: no
future plugin name can collide, whatever letter it starts with. It is safe
against the npm constraint — the Trusted Publisher binds to `release.yml`'s
**filename**, not to which tags reach it. The `installer-v*` family belongs to
`@virajp.dev/claude-plugins` alone and starts at `installer-v1.0.0`; the old
package's tags were removed, so nothing in this repo names it any more.

**Dogfooding unreleased plugin work does not go through an install.** A
`git-subdir` source is self-contained, so it fetches from GitHub at the tag even
when the marketplace is registered as a local `directory` — which is how this
checkout is registered. Use `claude --plugin-dir plugins/<name>` instead: it
loads the working tree for that session, no install and no cache.

## Workflows (`.github/workflows/`)

- **`plugins.yml`** — validates the plugin toolkit on every push to `main` or
  `develop` and every PR: `plugins:marketplace --check`, then
  `plugins:inventory --check`, then `plugins:check`, then the vitest suites,
  then `plugins:npm-normalize-test`, then `tsc --noEmit` per project. The order
  matters — proving the two committed generated files are what their sources
  generate *before* validating anything means a stale one fails as staleness
  rather than as some confusing downstream assertion. On `main` only it adds one
  more gate: **every `source.ref` names a tag that exists**. That one is
  deliberately *not* part of `plugins:marketplace --check`, which must stay
  offline and fresh-clone-safe; this asks the remote a question. It goes red in
  exactly one state — merged to `main` without running `plugins:release` — which
  is a marketplace whose installs fail for every user, so red is correct.
  Deliberately a **separate file** from `release.yml`: npm allows one Trusted
  Publisher and validates the entry-point workflow's filename, so that file's
  trigger surface stays untouched. This workflow publishes nothing and holds no
  `id-token` permission.
- **`release.yml`** — publishes `@virajp.dev/claude-plugins` to npm via **OIDC
  trusted publishing** (no stored token, provenance automatic). Triggered two
  ways: a pushed `installer-v*` tag, or `workflow_dispatch` — which is also how
  `deps-update.yml` publishes. Plugin tags never reach it; see The branch model
  above. **Every publish path must enter through this file** (see below). It
  sets up mise (`MISE_ENV=ci`), checks out the triggering ref, verifies the tag
  matches `package.json` (whenever that ref is a tag),
  `pnpm install --frozen-lockfile`, **osv-scans** the lockfile, **runs the
  tests** (`mise run i:test`), verifies the package (`mise run i:build`), then
  `npm publish`. The publish step is **idempotent** — it skips (does not fail)
  if that version is already on npm, so tag re-points, dispatch retries, and
  re-runs are safe. **Publishing uses the npm CLI; everything else stays pnpm.**
  The local `i:publish` task mirrors the gates + `npm publish`.
- **`deps-update.yml`** — monthly cron (+ manual dispatch): `pnpm update`
  (bounded by the cooldown below); if anything changed, `osv-scanner` gates on
  any known-vulnerable package, then it cuts a **patch release** — committing
  the refresh and the `i:version` bump to **`develop`**, merging to `main`, then
  tagging with `mise run i:release --ci` (tests + tag, no push/watch) and
  pushing. It takes the same merge-only route a human does, because `i:release`
  no longer bumps or commits. It then **delegates the npm publish by dispatching
  `release.yml` on the new tag** (`gh workflow run release.yml
  --ref <tag>`,
  using the built-in `GITHUB_TOKEN` and the job's `actions: write` grant) rather
  than publishing inline.

  **Why a dispatch and not `workflow_call`.** npm allows only **one Trusted
  Publisher per package**, and it validates the **entry-point** workflow's
  filename — not the workflow that actually runs `npm publish`. `workflow_call`
  therefore does *not* work: this repo shipped it that way for two months and
  both monthly runs died at the publish step with `ENEEDAUTH`, because npm saw
  `deps-update.yml` and matched nothing. A dispatch makes `release.yml` the
  entry point, so the single Trusted Publisher authorizes it. The tag push alone
  cannot trigger `release.yml` — refs pushed with `GITHUB_TOKEN` don't start
  workflow runs — but **`workflow_dispatch` and `repository_dispatch` are
  explicit exceptions to that rule**, so no PAT or GitHub App token is needed.
  The dispatch is fire-and-forget: the `release.yml` run is the publish record.
- **`site.yml`** — builds and deploys the website at
  `claude-plugins.virajp.dev`, the Astro site under `site/`, served from
  Cloudflare Workers Static Assets. Two jobs. **`build`** is the gate: it runs
  `mise run site:check` (type-check, build, search index, link check) on every
  PR and every push to `main` or `develop` that touches `site/**` or the
  workflow itself, and on every `site-v*` tag; on a tag only, it uploads
  `site/dist` as an artifact so `deploy` ships exactly the tree the gate
  checked. **`deploy`** runs only on a pushed `site-v*` tag, after `build`, and
  only once the tag is proven to match `site/package.json`'s version and to be
  reachable from `main` — the same two verifications `release.yml` makes, so a
  merge to `main` ships nothing until `mise run site:release` cuts the tag. It
  sets up mise and installs the workspace first, so the `wrangler` pinned in
  `site/package.json` is the one that deploys, then runs
  `cloudflare/wrangler-action` (pinned by commit) with the repository secrets
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Superseded branch and PR
  runs are cancelled; a tag's deploy never is. It is deliberately a **separate
  file** from `release.yml` for the same reason `plugins.yml` is — it publishes
  nothing to npm and holds no `id-token` permission — and `plugins.yml` is
  untouched by it: the site's gate runs here alone. The tag glob is namespaced
  because a bare `v*` would fire it on every plugin and installer release.

## Supply-chain settings

`pnpm-workspace.yaml` sets **`minimumReleaseAge`** (a publish cooldown, in
minutes) so neither installs nor the monthly update adopt brand-new —
potentially compromised — releases.

## One-time manual setup (not automatable here)

On **npmjs.com**, add this repo + `release.yml` as the **Trusted Publisher** for
`@virajp.dev/claude-plugins` (enables OIDC). A package name that has never been
published cannot be configured at all, so the first version under a new name is
published **by hand** (`mise run i:build && mise run i:publish` under the user's
npm login) and the publisher is added afterwards. The workflow-filename field
takes a **single file** and a package has **exactly one** Trusted Publisher —
set it to `release.yml` only (not a comma-separated list, and not
`deps-update.yml`, which publishes by *dispatching* `release.yml`). A mismatch
surfaces only at publish time as `ENEEDAUTH`. Until configured, `release.yml`
cannot publish.

**The sunset stub is a one-time hand publish too.** `@askviraj/ai-plugins`, the
package's former name, ships once more as `7.0.0` from `sunset/` — a standalone
package, not a workspace member, never built — and every version including it is
deprecated. The stub exists because a deprecation alone is not enough: `npx`
prints the notice only on the first, uncached run, and `pnpx` never prints it,
so a user with the old name cached gets no hint at all. `7.0.0` resolves as
`latest` and prints the pointer itself, exiting non-zero. Both commands are run
by hand, in this order, and need the interactive npm login:

```sh
cd sunset && npm publish --access public
npm deprecate "@askviraj/ai-plugins@*" "Moved to @virajp.dev/claude-plugins"
```

No task and no workflow touch the old name, and `release.yml` has nothing to do
with it.

## Cutting a release

Three rituals now, for the three things this repo ships.

**The plugins**: bump the version in each changed plugin's manifest on
`develop`, `mise run plugins:marketplace`, merge to `main`, then
`mise run plugins:release` (`--dry-run` first). No npm, no GitHub Release — the
tag *is* the release, and users move on
`claude plugin marketplace update virajp-plugins`.

**The installer**: `mise run i:version` on `develop` (`--minor`/`--major` to
choose the bump), commit, merge to `main`, then `mise run i:release` there — it
tags, pushes `main` before the tag (`release.yml` checks reachability), and
watches the publish. Then a GitHub Release for the tag: every `installer-vX.Y.Z`
tag carries one, so a missing Release means a missed step. Prefer releasing via
CI over the local `i:publish`, so every version keeps the strongest npm trust
level.

**The website**: `mise run site:version` on `develop`, commit, merge to `main`,
then `mise run site:release` there — it runs the site gate, tags, pushes `main`
before the tag (`site.yml` checks reachability the same way `release.yml` does),
and watches the deploy run. Then a GitHub Release for the tag, as for the
installer. When plugins, installer and site release together, cut them from the
same `main` merge in that order — plugins, installer, site — each with its own
note.

**Ask the user before running any of them.**

> The full ritual, the release-note format, and the CI facts that make a failed
> publish legible are in `.claude/skills/release/` — run `/release`.
