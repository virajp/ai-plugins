---
name: installer-cli
description: Authoring discipline for the @askviraj/ai-plugins installer CLI and
  the statusline it ships — the receipt-completeness invariant, the adapter
  split, packaging, and the flag surface. Auto-applies when editing cli/, tools/
  or tsup.config.ts.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "cli/**"
  - "tools/**"
  - "tsup.config.ts"
---

# Installer CLI

`cli/src/` is the source; `bin/ai-plugins.mjs` is the tsup bundle, is
**gitignored**, and is what npm publishes. Note the asymmetry with the rendered
plugin trees, which are committed: a rendered tree is meant to be diffed in
review, a bundle diff is noise.

The split is load-bearing, not stylistic. `@ai-plugins/schema` is a private
workspace package that would not resolve from an installed tarball (every import
of it is `import type`, so the bundle erases it), and shipping `cli/src/*.ts`
directly would raise `engines.node` from `>=18` to `>=22.18`.

## The invariant that keeps breaking

**A write must be recorded by who owns the path, never by what is currently at
it.** Every guarded form — skip it if it exists, capture it as prior state if it
exists — asks the wrong question, because on the second run what is sitting
there is *the first run's own output*. Run 2's receipt then claims less than run
1's, and since every run overwrites the receipt, the uninstall after it leaves
that path behind.

**It has now been found in every adapter**, which is why this is stated as a
rule rather than a list of bugs. Three instances needed a new receipt kind —
`createdFile`, `tree`, and `ownedDir`, where `dir` skipped the already-existing
bundle root so `virajp-plugins/` survived as an empty directory. The rest needed
only the ownership *test*, and each failed differently, which is why finding one
never found the next:

| Where                      | Run 2 did this                                            | So uninstall left                     |
| -------------------------- | --------------------------------------------------------- | ------------------------------------- |
| `opencode.jsonc`           | *downgraded* the claim to a key restore of our own value  | a `skills.paths` to a deleted bundle  |
| `tui.json`                 | hit the already-registered early return, recorded nothing | the config, pointing at the plugin    |
| Cursor `settings.json`     | recorded **an empty receipt**, overwriting the full one   | the entire install, reporting success |
| Oh-My-Pi `marketplace add` | skipped the undo, since this run did not add it           | the marketplace, at a removed path    |

Each is fixed by comparing what is on disk against what this tool's own merge
would produce — identical means an earlier run of ours wrote it, whatever
`existsSync` says. Cursor's `withoutOwnEntries` is the strongest form and the
one to copy: it reconstructs the file **without** our entries, so the claim is
computed against what run 1 actually saw and every run records the same thing.

`cli/src/statusline.ts` (the Claude bar) still keys its `configKey` records on
`existed` and was never separately fixed. It is covered by the merge below
rather than by its own ownership test — which holds, but means its claims are
correct only in combination.

**And one fix underneath all of them**: a receipt now **merges with whatever is
already at its path**, in `writeReceipt`. A receipt describes an install, not a
run — overwriting it wholesale is what let a second run record less than the
first, and it is also why installing `identity` after `datastore` produced a
receipt naming only `identity`. Merging in the one place every writer passes
through is deliberate: this bug recurred all week precisely because each site
decided for itself. The **older** entry wins a collision, since run 2 read a
machine run 1 had already changed. That closes `statusline-ohmypi`, which could
not use the file-comparison test at all — `config.yml` is `omp`'s own YAML and
this CLI ships no YAML parser.

**A single install passes either way; only a repeat run shows it**, which is why
`i:test` installs twice before uninstalling. Preserve that.

Before adding or changing any write path, read
[receipts.md](references/receipts.md).

## Testing

- `mise run i:test` bundles first and smoke-tests **`bin/ai-plugins.mjs`, not
  `cli/src/index.ts`** — a packaging mistake only shows up in the built
  artifact, because in the repo everything resolves through the workspace. It
  ends with a real install → install again → uninstall against a throwaway
  `HOME` (plus `XDG_CONFIG_HOME` and `XDG_DATA_HOME`, or a "hermetic" run writes
  into your own config). It drives **OpenCode**, whose adapter shells out to
  nothing, and installs `datastore`, the plugin with no `requires:`, so the run
  reaches the adapter instead of stopping at the dependency gate.
- **`vitest.config.mts` restricts collection to
  `{schema,build,cli}/src/**/*.test.ts`.** A test file anywhere else is silently
  never run rather than failing — which is why the statusline *script* tests
  live at `cli/src/statusline-script.test.ts` even though what they exercise is
  `tools/statusline/`.
- Never stub `claude` or `omp` to exercise an adapter end to end: that tests
  this tool against our own fiction of their CLIs. Their command sequences are
  covered by the adapter suites with fakes; for a real run use the
  `target-verifier` agent.

## The flag surface

| Flag                          | Notes                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `--all`                       | every **user-scoped, non-opt-in** plugin, at user scope                                                                           |
| `--user` / `--project <name>` | repeatable; bare names validated against `plugins.json`                                                                           |
| `--platform <target>`         | repeatable; omitted, every tool detected on `PATH`. A selected target whose tool is absent is **skipped with a note**, not failed |
| `--statusline`                | **tri-state**: explicit asks, `--no-statusline` refuses, unset defers to `--all`                                                  |
| `--force`                     | acts on a target whose CLI is missing. Does **not** override the `requires:` gate                                                 |
| `--version` / `--upgrade`     | installing is already upgrading; `--upgrade` replays each target's receipt                                                        |
| `--uninstall` / `--dry-run`   | uninstall reverts from the receipt; dry run writes nothing, diff to stdout, progress to stderr                                    |

Every derived set (`--all` membership, project-scoped, opt-in, user-only,
dependencies, `requires`) comes from `plugin.yaml` via `plugins.json` — there is
no second copy to disagree, and the old hardcoded constants are gone.

## References

| Reference                                 | Covers                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| [receipts.md](references/receipts.md)     | entry kinds, the unconditional three, undo recording, `RECEIPT_VERSION`       |
| [adapters.md](references/adapters.md)     | copy vs marketplace, pruning, where the payload lives, scope fallback         |
| [statusline.md](references/statusline.md) | the three surfaces, per-tool verified facts, the four files to keep in sync   |
| [packaging.md](references/packaging.md)   | tsup externals, the CJS/ESM split, the tarball, `packageRoot()`, distribution |

## Documentation

Behaviour changes here must reconcile `readme.md`, `CLAUDE.md` and
`docs/statusline.md` in the same commit. Delegate that sweep to the
`docs-reconciler` agent.
