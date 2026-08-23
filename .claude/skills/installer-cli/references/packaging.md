# Packaging & distribution

## The bundle

`tsup.config.ts`: one entry, `outDir: bin`, ESM, `target: node18`,
`clean: true`. The hashbang on `cli/src/index.ts` is not decoration — tsup
copies it through and marks the output executable, which is what lets `bin`
point straight at the bundle.

**The entry is named, so the output is `bin/installer.mjs`** rather than
`bin/index.mjs`. That name is the *artifact's*, not the command's:
`package.json`'s `bin` key stays `ai-plugins`, which is what users invoke and
what npm's Trusted Publisher is bound to. Renaming the file is safe; renaming
the key breaks every documented invocation and the publish path with it.

**tsup treats `dependencies` as external and inlines everything else.** So a
runtime import that is only a `devDependency` gets **silently bundled**: it
works, and it hides that package from `osv-scanner`, which reads the lockfile.
Runtime deps are whatever the bundle leaves external — two of them now,
`jsonc-parser` and `write-file-atomic`. **Argument parsing is not among them**:
it was `citty` until that turned out to be unable to express a repeatable flag,
and `node:util`'s `parseArgs` replaced it rather than another package.

**The package `type` stays `commonjs`**, and the bundle is ESM by its `.mjs`
extension — nothing this package ships depends on the `type` either way any
more, and leaving it alone is one less thing to re-verify.

## The tarball

`files` is **`bin`**, and nothing else. Four files.

It was ~12 MB until the Claude-first cutover, because the four rendered plugin
trees, `plugins.json` and both root marketplace manifests all shipped inside it
— that was the cost of the committed-render guarantee, since every adapter read
`<target>/` at install time through `context.sourceRoot`.

**Nothing is read from the package root at runtime now except `package.json`**,
and only for its `version`. There is no bundled asset left to lose, so narrowing
`files` is no longer the hazard it was — but an *addition* now needs its own
justification rather than inheriting one from a table of things already being
read.

## Resolving the package root

`cli/src/index.ts` resolves it by **walking up for a `package.json` whose name
matches**, never by counting `..` segments — it runs from two depths (`cli/src/`
in the repo, `bin/` once bundled), and a fixed offset would be right in one and
silently wrong in the other. `AI_PLUGINS_SOURCE_DIR` is the escape hatch, and is
how the tests point it at a fixture.

## `--version`

Two lines, from two different places:

- **This CLI** — the running package's own version, against the latest on npm.
  Under `pnpx` the running one is whatever was just downloaded.
- **The plugins** — what the marketplace manifest on `main` lists, since `main`
  is what a user installs from.

**It reports no on-disk state**, and that is deliberate rather than an omission.
Everything this CLI installs is installed by Claude or by graphify, each of
which answers for its own version — what a user has is `claude plugin list`.
Parsing Claude's bookkeeping a second time to say the same thing would only be a
second thing to drift. `cli/src/version.ts` says so at the top; keep the two in
agreement if a reader is ever added.

The "latest" side is fetched from raw GitHub and can be **CDN-cached for a few
minutes** after a push; re-run before diagnosing a stale-looking report.

That GitHub call sends `$GITHUB_API_TOKEN` when the variable is set, because
GitHub's anonymous limit is per source IP and shared egress exhausts it between
users. The hint to set one appears **only** for a real rate limit — `429`, or
`403` with `x-ratelimit-remaining: 0`. A plain `403` is an authorization failure
a read-only token would not fix. The npm registry call is not GitHub and stays
tokenless; see `cli/src/github.ts`.

## Distribution: npm for the CLI, GitHub for the plugins

`pnpx @askviraj/ai-plugins`, which needs Node. There is deliberately no
standalone binary, no Homebrew tap and no Scoop bucket — every non-npm channel
would be a per-platform archive plus a per-release checksum plus an
extract-and-symlink installer, a second distribution system delivering what npm
already delivers.

The plugins go the other way entirely:
`claude plugin marketplace add virajp/ai-plugins` reads this repo's `main`
directly. The committed-tree-validated-by-CI guarantee survives with a new
channel — what users install is `main`, and `plugins.yml` validates `main` on
every push. The residual risk is the window between a bad merge and the red
build, which is the same risk any git-served marketplace carries.
