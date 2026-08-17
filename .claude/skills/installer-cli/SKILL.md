---
name: installer-cli
description: Authoring discipline for the @askviraj/ai-plugins CLI and the
  statusline it ships — the receipt-completeness invariant, the interactive
  uninstall, packaging, and the flag surface. Auto-applies when editing cli/,
  tools/ or tsup.config.ts.
user-invocable: false
allowed-tools: Read Grep Glob Edit Write Bash
paths:
  - "cli/**"
  - "tools/**"
  - "tsup.config.ts"
---

# Installer CLI

`cli/src/` is the source; `bin/ai-plugins.mjs` is the tsup bundle, is
**gitignored**, and is what npm publishes. Shipping `cli/src/*.ts` directly
would raise `engines.node` from `>=18` to `>=22.18`, which is the whole reason
the bundle exists.

**This CLI does three things**: installs the Claude statusline, wires graphify,
and removes what the toolkit put on a machine. It installs **no plugins** — that
is `claude plugin marketplace add virajp-plugins` + `claude plugin install`,
served from this repo's `main`. If you find yourself adding a plugin code path,
you are re-growing something that was deliberately cut.

## The invariant that keeps breaking

**A write must be recorded by who owns the path, never by what is currently at
it.** Every guarded form — skip it if it exists, capture it as prior state if it
exists — asks the wrong question, because on the second run what is sitting
there is *the first run's own output*. Run 2's receipt then claims less than run
1's, and since every run overwrites the receipt, the uninstall after it leaves
that path behind.

**It was found in all four retired plugin adapters and in the statusline**,
which is why this is stated as a rule rather than a list of bugs. The adapters
are gone; the rule is not, because the statusline still writes four paths and
`--uninstall`'s new enumeration now depends on those records being complete.

The fix is always the same shape: compare what is on disk against what this
tool's own merge **would** produce — identical means an earlier run of ours
wrote it, whatever `existsSync` says. The strongest form, and the one to copy,
reconstructs the file *without* our entries, so the claim is computed against
what run 1 actually saw and every run records the same thing.

`cli/src/statusline.ts` still keys its `configKey` records on `existed`. It is
covered by the receipt merge below rather than by its own ownership test — which
holds, but means its claims are correct only in combination. That is a known
soft spot, not a design.

**And one fix underneath all of them**: a receipt **merges with whatever is
already at its path**, in `writeReceipt`. A receipt describes an install, not a
run — overwriting it wholesale is what let a second run record less than the
first. Merging in the one place every writer passes through is deliberate: this
bug recurred all week precisely because each site decided for itself. The
**older** entry wins a collision, since run 2 read a machine run 1 had already
changed.

**A single install passes either way; only a repeat run shows it.** `i:test`
therefore installs **over a foreign statusline**, installs again, and asserts
the receipt still records the foreign bar — not merely that the files exist.
Preserve that shape, and preserve that it compares file *contents*, not
filenames: the version this replaced compared `find` output and would have
passed while bytes changed underneath it.

Before adding or changing any write path, read
[receipts.md](references/receipts.md).

## `--uninstall` is interactive

Enumerate → present all-selected → remove through each piece's owner. Three
rules:

- **Enumeration is a pure read** returning plain data with no closures in it, so
  the list is testable against a fixture directory rather than only by
  performing it. Removal is a separate switch.
- **Removal goes through the owner.** `claude plugin uninstall`, never an edit
  to `enabledPlugins` — Claude keeps bookkeeping beside that key and
  hand-editing strands the two apart. The statusline leaves by **restoring its
  receipt**, so the user gets their own bar back; a bare delete would leave them
  with none.
- **No TTY refuses rather than guesses** — but only once there is something to
  remove. A run that finds nothing has nothing to ask about, and failing it for
  want of a terminal would make the flag unusable in a script that is checking
  whether anything is left. `--dry-run` is the non-interactive path, and is what
  `i:test` drives.

**The legacy-receipt reader is deliberately temporary.** Every receipt other
than the statusline's records an install by a multi-target version of this CLI —
a copied OpenCode tree, the OpenCode TUI bar, Oh-My-Pi's `omp config` keys, a
Cursor `settings.json` entry. Those surfaces are discontinued, and without this
reader a machine carrying them is orphaned rather than cleaned, because nothing
else knows those paths. `uninstall.ts` states the drop condition and names
exactly what to delete when it comes.

## Testing

- `mise run i:test` bundles first and smoke-tests **`bin/ai-plugins.mjs`, not
  `cli/src/index.ts`** — a packaging mistake only shows up in the built
  artifact, because in the repo everything resolves through the workspace. It
  ends with a real install → install again → the two non-interactive uninstall
  paths, against a throwaway `HOME` (plus `XDG_CONFIG_HOME` and `XDG_DATA_HOME`,
  or a "hermetic" run writes into your own config).
- It also asserts **`tools/statusline/statusline --version` equals
  `package.json`'s version**. That is what makes the hand-synced second copy
  safe: `i:version` stamps the constant at bump time, and nothing else ever
  compares them, so a bump that missed the script would ship a bar lying about
  itself.
- **`vitest.config.mts` restricts collection to
  `{cli,scripts}/src/**/*.test.ts`.** A test file anywhere else is silently
  never run rather than failing — which is why the statusline *script* tests
  live at `cli/src/statusline-script.test.ts` even though what they exercise is
  `tools/statusline/`.
- `claude` is stubbed in `i:test` only because the statusline install needs it
  to *exist*; nothing shells out to it. Do not stub a tool to exercise its
  command sequence end to end — that tests this tool against our own fiction of
  its CLI.

## The flag surface

| Flag           | Notes                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `--statusline` | **tri-state**: explicit asks, `--no-statusline` refuses, unset defers. Explicit is also the **only** consent to replace a foreign bar |
| `--uninstall`  | enumerate → deselect → remove. Interactive; no TTY refuses once there is something to remove                                          |
| `--dry-run`    | writes nothing, diff to stdout, progress to stderr. The scriptable half of `--uninstall`                                              |
| `--force`      | acts although Claude Code is not on `PATH`                                                                                            |
| `--version`    | this CLI, the statusline **installed on disk**, and the plugins available on `main`; exits 1 when the network is unreachable          |
| `-h, --help`   | usage on stdout, exit 0 — **declared**, since `strict` rejects anything undeclared                                                    |

**The parser is `node:util`'s `parseArgs`, in `args.ts`, and it must stay
repeat-capable.** It was `citty` until `--user vwf --user devtools` was found to
install only `devtools`: citty's `ArgType` has no array kind, so a repeated flag
cannot be expressed and the last occurrence silently wins. No flag is repeatable
*today* — the ones that were are retired — but the constraint is kept, because
the failure mode was silent and a future repeatable flag must not reintroduce
it. `parseArgs` also **removed** a runtime dependency rather than swapping one
in.

Two things the platform does not do, both handled in `args.ts`: boolean negation
(`--no-statusline` is its own flag, folded back into the tri-state) and usage
rendering. `strict` is on, so a retired flag reports itself by name rather than
being the silent no-op citty gave — which is how `--platform`, `--all`, `--user`
and `--upgrade` now answer.

**There is no `--upgrade` and no `--all`, and adding either back would be a
mistake.** `--upgrade` replayed a receipt to do what naming the plugins again
did, and plugin content no longer ships in the package at all. `--all` named a
`defaultInstall` list that lived in a file this repo deleted; installing `vwf`
pulls `devtools` through Claude's own native dependency resolution, which is
where that belongs.

**An invocation that installs nothing prints the help and exits 1.**

## References

| Reference                                 | Covers                                                                        |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| [receipts.md](references/receipts.md)     | entry kinds, the unconditional three, undo recording, `RECEIPT_VERSION`       |
| [statusline.md](references/statusline.md) | the Claude surface, the consent rule, the four files to keep in sync          |
| [packaging.md](references/packaging.md)   | tsup externals, the CJS/ESM split, the tarball, `packageRoot()`, distribution |

## Documentation

Behaviour changes here must reconcile `readme.md`, `CLAUDE.md` and
`docs/plugins/statusline.md` in the same commit. Delegate that sweep to the
`docs-reconciler` agent.
