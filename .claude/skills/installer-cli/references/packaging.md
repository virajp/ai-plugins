# Packaging & distribution

## The bundle

`tsup.config.ts`: one entry, `outDir: bin`, ESM, `target: node18`,
`clean: true`. The hashbang on `cli/src/index.ts` is not decoration — tsup
copies it through and marks the output executable, which is what lets `bin`
point straight at the bundle.

**tsup treats `dependencies` as external and inlines everything else.** So a
runtime import that is only a `devDependency` gets **silently bundled**: it
works, and it hides that package from `osv-scanner`, which reads the lockfile.
Runtime deps are whatever the bundle leaves external. **Argument parsing is not
among them**: it was `citty` until that turned out to be unable to express a
repeatable flag, and `node:util`'s `parseArgs` replaced it rather than another
package.

**The package `type` stays `commonjs`.** The bundle is ESM by its `.mjs`
extension, while the standalone `tools/statusline/` scripts — run outside this
package, with no `package.json` beside them — must remain CommonJS. The ESM/CJS
split is carried per file, not by a package-wide `type: module`.

## The tarball

`files` is **`bin` + `tools`**. Seven files, ~41 KB.

It was ~12 MB until the Claude-first cutover, because the four rendered plugin
trees, `plugins.json` and both root marketplace manifests all shipped inside it
— that was the cost of the committed-render guarantee, since every adapter read
`<target>/` at install time through `context.sourceRoot`.

None of that is read any more. **What the package reads from its own root at
runtime is exactly three files**, all under `tools/statusline/`:

| File              | Read for                                    |
| ----------------- | ------------------------------------------- |
| `statusline`      | copied to `~/.claude/scripts/statusline`    |
| `context-caps.js` | copied to `~/.claude/hooks/context-caps.js` |
| `statusline.json` | parsed, to seed `~/.config/statusline.json` |

Nothing else in the CLI touches `packageRoot()`. Before widening `files`, check
that the thing being added is genuinely read at runtime — and before narrowing
it, check against that table, because a missing bundled asset throws at install
time with a path the user cannot act on.

## Resolving the package root

`cli/src/index.ts` resolves it by **walking up for a `package.json` whose name
matches**, never by counting `..` segments — it runs from two depths (`cli/src/`
in the repo, `bin/` once bundled), and a fixed offset would be right in one and
silently wrong in the other. `AI_PLUGINS_SOURCE_DIR` is the escape hatch, and is
how the tests point it at a fixture.

## `--version`

Three lines, from three different places, and the distinction matters:

- **This CLI** — the running package's own version. Under `pnpx` that is
  whatever was just downloaded.
- **The statusline on disk** — obtained by running the *installed* script with
  `--version`. It reports a hardcoded constant that `i:version` stamps at bump
  time. This exists because the CLI used to print its own version for the
  statusline line and annotate it "bundled with the CLI", which under `pnpx`
  never described what the user actually had. An install predating the flag
  degrades to `unknown (predates self-reporting)` rather than being guessed at.
- **The plugins** — the local marketplace manifest against the one on `main`,
  since `main` is what a user installs from.

A plugin present locally but not on `main` is labelled `(not on main yet)`
rather than left bare, which read as a failed lookup. The "latest" side is
fetched from raw GitHub and can be **CDN-cached for a few minutes** after a
push; re-run before diagnosing a stale-looking report.

That GitHub call sends `$GITHUB_API_TOKEN` when the variable is set, because
GitHub's anonymous limit is per source IP and shared egress exhausts it between
users. The hint to set one appears **only** for a real rate limit — `429`, or
`403` with `x-ratelimit-remaining: 0`. A plain `403` is an authorization failure
a read-only token would not fix. The npm registry call is not GitHub and stays
tokenless; see `cli/src/github.ts`.

## Distribution: npm for the statusline, GitHub for the plugins

`pnpx @askviraj/ai-plugins`, which needs Node. There is deliberately no
standalone binary, no Homebrew tap and no Scoop bucket — every non-npm channel
would be a per-platform archive plus a per-release checksum plus an
extract-and-symlink installer, a second distribution system delivering what npm
already delivers.

The plugins go the other way entirely:
`claude plugin marketplace add
virajp/ai-plugins` reads this repo's `main`
directly. The committed-tree-validated-by-CI guarantee survives with a new
channel — what users install is `main`, and `plugins.yml` validates `main` on
every push. The residual risk is the window between a bad merge and the red
build, which is the same risk any git-served marketplace carries.
