# U3 — Repo tooling for `site/`

- **Wave:** 1
- **Depends on:** —
- **Owns:** `pnpm-workspace.yaml`, `.gitignore`, `.graphifyignore`,
  `dprint.json`, `.config/linter.yaml`, `.config/pre-commit-config.yaml`,
  `.config/mise/tasks/site/dev`, `.config/mise/tasks/site/build`,
  `.config/mise/tasks/site/check`, `.config/mise/tasks/site/version`,
  `.config/mise/tasks/site/release`, `.github/workflows/site.yml`. Touch nothing
  outside this list.
- **Model:** inherit
- **Read first:** every owned file, top to bottom, before editing.
- **Lazy-load:** `.config/mise/tasks/i/version`, `.config/mise/tasks/i/release`
  (the models to mirror), `.config/mise/tasks/_scripts/_helpers` (the shared
  `print_header` / `print_error`), `.github/workflows/release.yml` (the two
  verification steps to mirror), `.github/workflows/plugins.yml` (the checkout
  and mise-action shape), `.config/mise/config.toml` (the `init` task that
  chmods task files).

## Ruling

Decision 2: "The site is a third releasable project. Version in
`site/package.json` (starts `1.0.0`). `mise run site:version [--minor|--major]`
bumps on `develop`, no tag. `mise run site:release [--ci]` mirrors `i:release`:
clean tree, on `main`, refuses an existing tag, runs `mise run site:check`, cuts
annotated `site-v<version>`, pushes `main` then the tag, watches the run.
`.github/workflows/site.yml` has a `build` job on PRs and pushes to
`develop`/`main` touching `site/**`, and a `deploy` job only on
`push.tags: site-v*` that verifies the tag matches `site/package.json` and is an
ancestor of `main`, builds, and runs `wrangler deploy`. A merge to `main` ships
nothing until a tag is cut."

Decision 15: "`.config/mise/tasks/site/{dev,build,check,version,release}`.
`site:build` = `astro build` then `pagefind --site dist`. `site:check` =
`astro check`, `site:build`, then
`pnpm --filter site exec tsx scripts/check-links.ts` (every internal `href` in
`dist/**/*.html` resolves to a built file, every `#fragment` to an `id` in its
target). `site:check` joins the wave gate."

Decision 16: "`**/*.astro` added to `dprint.json` includes; `site/dist/**`,
`site/.astro/**` and `site/**/*.astro` added to `.config/linter.yaml` ignores;
`.gitignore` gains `site/dist/` and `site/.astro/`; `.graphifyignore` gains
`site/dist/`; the pre-commit linter exclude `^docs/assets/` becomes
`^site/public/brand/`. Moved markdown stays dprint-formatted."

Decision 19: "Wave 1 is tooling alone so `pnpm install` in wave 2 sees `site` in
the workspace."

Standing rule (`.claude/docs/ci-and-releases.md:118-120`): `release.yml`'s
trigger surface stays untouched. This unit does not open that file for editing.

## Edits

1. **`pnpm-workspace.yaml`** — add `- site` to `packages:` after `scripts`, with
   a one-line comment in the file's existing voice: the website, built by Astro,
   versioned and tagged on its own (`site-v*`), never published to npm (the root
   `files` list is `bin` alone). Do not touch `allowBuilds`, `minimumReleaseAge`
   or `overrides`.
2. **`.gitignore`** — under the "Node / CLI" build-artifact block, add
   `site/dist/` and `site/.astro/` with a comment matching the neighbours' tone:
   the Astro build output and its generated type cache; `site.yml` rebuilds
   both, and `site-v*` tags deploy from a fresh build, never from a committed
   `dist/`.
3. **`.graphifyignore`** — add `site/dist/`.
4. **`dprint.json`** — add `"**/*.astro"` to `includes` next to `**/*.html`. Add
   `"site/dist/**"` to `excludes` (`**/.astro/` is already excluded). Do not
   change the markdown, json or markup option blocks.
5. **`.config/linter.yaml`** — add `site/dist/**`, `site/.astro/**` and
   `site/**/*.astro` to `ignores`, each with a short comment: build output;
   generated types; `.astro` is dprint's (the markup plugin formats it and the
   linter has no Astro parser).
6. **`.config/pre-commit-config.yaml`** — on the `linter` hook's `exclude`
   (`:129`), replace `^docs/assets/` with `^site/public/brand/` and update the
   rationale comment (`:126-128`) to name the new path; the reason is unchanged
   (SVG, PNG and the social-preview render source the linter's HTML rewrite
   would fight dprint over). Nothing else in the file changes.
7. **`.config/mise/tasks/site/dev`** —
   `#MISE description="Run the website's dev server"`,
   `#MISE dir="{{ config_root }}/site"`, `set -e`, `pnpm exec astro dev "$@"`.
8. **`.config/mise/tasks/site/build`** — description "Build the website and its
   search index into site/dist", `dir` = `site`, `set -e`,
   `pnpm exec astro build`, then `pnpm exec pagefind --site dist`.
9. **`.config/mise/tasks/site/check`** — description "Type-check, build and
   link-check the website (the site gate)", `dir` = `site`, `set -e`,
   `pnpm exec astro check`, then `mise run site:build`, then
   `pnpm exec tsx scripts/check-links.ts`. This is the line the wave gate and
   `site:release` run.
10. **`.config/mise/tasks/site/version`** — a copy of `i/version` with
    `dir="{{ config_root }}/site"`, description "Bump the website version in
    site/package.json (no git tag)", the same `--minor` / `--major` usage flags,
    `pnpm version "${LEVEL}" --no-git-tag-version` run in `site/`, and the final
    message naming `site/package.json`.
11. **`.config/mise/tasks/site/release`** — a copy of `i/release` with these
    substitutions and nothing else changed in structure or comments: `VERSION`
    read from `./site/package.json`; `TAG="site-v${VERSION}"`; the test step is
    `mise run site:check` instead of `mise run i:test`; the workflow watched is
    `site.yml`; every message that says `i:version` says `site:version`; the
    success line reads "Deploy pipeline succeeded —
    https://claude-plugins.virajp.dev is on site-v${VERSION}." Keep the `--ci`
    flag and its early exit, the clean-tree, on-`main`, and tag-exists checks,
    and the push order (`main` before the tag; `site.yml` checks reachability
    exactly as `release.yml` does). Update the namespacing comment to name the
    third family.
12. **`.github/workflows/site.yml`** — a new workflow, header comment in the
    voice of `plugins.yml`/`release.yml` explaining: it is a separate file so
    `release.yml`'s Trusted-Publisher trigger surface stays untouched; `build`
    is the gate, `deploy` is the tag-triggered release.
    - `on:`
      `pull_request: { paths: ["site/**", ".github/workflows/site.yml"] }`,
      `push: { branches: [main, develop], paths: [same] }`,
      `push: { tags: ["site-v*"] }`, `workflow_dispatch: {}`. (Tag pushes ignore
      `paths`; that is intended.)
    - `permissions: { contents: read }`; `concurrency` group
      `site-${{ github.ref }}`, `cancel-in-progress: true` for branches and PRs
      only (`${{ github.ref_type != 'tag' }}`).
    - `env: MISE_ENV: ci`.
    - Job `build`: `actions/checkout@v7` (`fetch-depth: 0`),
      `jdx/mise-action@v4`, `pnpm install --frozen-lockfile`,
      `mise run site:check`, upload `site/dist` as an artifact named `site-dist`
      when `github.ref_type == 'tag'`.
    - Job `deploy`: `needs: build`, `if: github.ref_type == 'tag'`. Steps:
      checkout as above; "Verify the tag matches site/package.json version"
      (strip `site-v`, compare to
      `node -p "require('./site/package.json').version"`, `::error::` and exit 1
      on mismatch — mirror `release.yml:62-74`); "Verify the tag is reachable
      from main" (mirror `release.yml:76-80`); download the `site-dist` artifact
      into `site/dist`; deploy with `cloudflare/wrangler-action` pinned by
      commit (`ebbaa1584979971c8614a24965b4405ff95890e0`, v4.0.0 — verify the
      current v4 SHA with Context7 or the action's releases before writing it)
      with `apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}`,
      `accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}`,
      `workingDirectory: site`, `command: deploy`.
13. Make the five task files executable (`chmod +x`), as `mise run init` would.

## Verification

- `mise tasks` lists `site:dev`, `site:build`, `site:check`, `site:version`,
  `site:release` with the descriptions above.
- `bash -n` on each task file passes.
- `mise run code:format` reports nothing under the owned paths (the YAML, JSON
  and task files are dprint-formatted; task scripts have no extension and are
  outside dprint's includes).
- `git diff --stat -- .github/workflows/release.yml` is empty.
- `pre-commit run --all-files -c .config/pre-commit-config.yaml` is green (the
  `site/` tree does not exist yet in this wave, so the new ignores and excludes
  must not error on a missing path).
- `grep -n 'site-v\*' .github/workflows/site.yml` finds the tag trigger and
  `grep -n "ref_type == 'tag'" .github/workflows/site.yml` finds the deploy
  guard and the artifact upload condition.

## Guardrails

- Do not run `pnpm install`: `pnpm-lock.yaml` is U1's, and the `site` package
  does not exist yet.
- Do not create anything under `site/`; U1 and U2 own that tree.
- Do not touch `plugins.yml`, `release.yml` or `deps-update.yml`.
- `cat` is aliased to `bat` on this machine; write files with the Write tool,
  never a heredoc.
- BSD `sed`; task scripts must stay portable bash like their neighbours.
- Byte-copy `i/version` and `i/release` and then edit; do not retype them.

## Commit

`ops: wire the site/ workspace, its mise tasks and the site.yml gate and deploy`
— written by the orchestrator after the wave gate, not by the unit.
