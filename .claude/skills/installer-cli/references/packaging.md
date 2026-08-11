# Packaging & distribution

## The bundle

`tsup.config.ts`: one entry, `outDir: bin`, ESM, `target: node18`,
`clean: true`. The hashbang on `cli/src/index.ts` is not decoration — tsup
copies it through and marks the output executable, which is what lets `bin`
point straight at the bundle.

**tsup treats `dependencies` as external and inlines everything else.** So a
runtime import that is only a `devDependency` gets **silently bundled**: it
works, and it hides that package from `osv-scanner`, which reads the lockfile.
Runtime deps are whatever the bundle leaves external — today `citty`,
`jsonc-parser`, `smol-toml`, `write-file-atomic`.

**The package `type` stays `commonjs`.** The bundle is ESM by its `.mjs`
extension, while the standalone `tools/statusline/` scripts — run outside this
package, with no `package.json` beside them — must remain CommonJS. The ESM/CJS
split is carried per file, not by a package-wide `type: module`.

## The tarball

`files` is `bin` + `tools` + the four rendered trees + `plugins.json` + both
root marketplace manifests. Every adapter reads `<target>/` at install time
through `context.sourceRoot`, and the Claude and Cursor adapters read
`.claude-plugin/marketplace.json` and `.cursor-plugin/marketplace.json` from the
package root.

That makes the package ~12 MB. It is the cost of the committed-render guarantee:
what a user installs is what CI validated.

## Resolving the package root

`cli/src/index.ts` resolves it by **walking up for a `package.json` whose name
matches**, never by counting `..` segments — it runs from two depths (`cli/src/`
in the repo, `bin/` once bundled), and a fixed offset would be right in one and
silently wrong in the other.

## `--version`

`cli/src/version.ts` does **not** ask each tool what it has installed, the way
the old `bin/claude.mjs` asked `claude plugin list --json`; with four targets
that is four bookkeeping formats. A plugin's version *in this build* is what an
install would give you — every target reads `<target>/` from this package, in
place or copied — so comparing the local manifest against the one on `main`
answers it for all four at once.

A plugin present here but not on `main` is labelled `(not on main yet)` rather
than left bare, which read as a failed lookup. Note that the "latest" side is
fetched from raw GitHub and can be **CDN-cached for a few minutes** after a
push; re-run before diagnosing a stale-looking report.

## Distribution: npm only

`pnpx @askviraj/ai-plugins`, which needs Node. There is deliberately no
standalone binary, no Homebrew tap and no Scoop bucket.

A binary here could never be self-contained: Claude and Oh-My-Pi each register a
marketplace whose source is a real rendered directory, so the payload has to
exist on disk as files rather than inside the executable. (Claude copies its
copy to `~/.local/share/virajp/ai-plugins` first, but that only moves *which*
directory it is, not the fact that there has to be one.) Every non-npm channel
would be a per-platform archive plus a per-release checksum file plus an
extract-and-symlink installer — a second distribution system to keep current,
delivering exactly what the npm package already delivers.

So `packageRoot()` resolves from `import.meta.dirname` alone, and Windows users
run the same `pnpx` command everyone else does.
