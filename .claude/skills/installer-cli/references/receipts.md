# Receipts

An install returns a **receipt** recording prior state, so uninstall *restores*
rather than guesses. `cli/src/receipt.ts` is authoritative; this is the
reasoning behind it.

## Entry kinds differ by who else writes there

That is the whole distinction, and it decides which kind is correct:

| Kind        | Removal behaviour              | Because                                                          |
| ----------- | ------------------------------ | ---------------------------------------------------------------- |
| `file`      | restores prior contents        | the path is **shared** with the user or tool                     |
| `configKey` | restores the prior value       | same — the file is not ours                                      |
| `dir`       | removes **only when empty**    | same                                                             |
| `tree`      | removes **recursively**        | only ever pointed at a directory nothing but this tool writes to |
| `command`   | runs the recorded undo command | the tool owns bookkeeping we must not edit                       |

`tree` also keeps a bulk payload out of the entry list. Claude's marketplace is
527 files; recording them one by one would be 527 lines of run report for one
logical action, with an uninstall that still had to trust the list was complete.
**OpenCode records its bundles the same way** — one `tree` per plugin rather
than per file, which took its receipt from 413 entries to 32 and its run report
from 281 changes to 37. The granularity stays *per plugin* because a partial
install must not remove a bundle it was not asked about, and the shared flat
dirs stay per file for the reason in the table. `copyTree` takes a
`record: "files" | "tree"` for exactly that split.

## The three unconditional kinds

`createdFile`, `tree` and `ownedDir` are recorded **unconditionally**, and every
one of them exists because the same bug shipped:

> Their guarded counterparts skip a path that is already there. So run 2's
> receipt omits what run 1 created, and since every run overwrites the receipt,
> the uninstall after it leaves that path behind.

`ownedDir` is the third and newest: `dir` skipped the already-existing bundle
root, so `virajp-plugins/` survived as an empty directory. It differs from
`tree` in what it *removes*, not in what it *claims* — removal stays conditional
on emptiness, which is what makes claiming it unconditionally safe.

**A single install passes either way.** Only a repeat run exposes it, which is
why `i:test` installs twice before uninstalling. Any new write path gets the
same treatment: ask whether the guarded form would skip an existing path, and if
so, record it anyway.

### The same trap on a shared file

A file the user may also own cannot simply be claimed unconditionally, so the
fix there is the ownership *test* rather than a new kind. Both OpenCode config
writers — the adapter's `mergeConfig` on `opencode.jsonc`, and the statusline's
`register` on `tui.json` — decide between `createdFile` and a key-by-key
`configKey` restore by comparing the file on disk against the one their own
merge would produce from empty: identical means an earlier run of ours wrote it,
whatever `existsSync` says.

Keying that on existence alone left both files behind after install → install →
uninstall, each still registering something the same uninstall had just deleted
— the bundle directory in one case, the copied TUI plugin in the other. They
failed differently, which is why finding one did not find the other:
`opencode.jsonc` *downgraded* its claim to a key restore of our own value, while
`tui.json` hit its already-registered early return and recorded nothing at all.

**Cursor's `withoutOwnEntries` is the strongest form of the test, and the one to
copy.** Rather than asking *is this whole file ours*, it reconstructs the file
**without** our entries — a plugin key holding exactly the value we would write
is ours, whichever run wrote it — and computes the claim against that. The
result is what run 1 actually saw, so every run records what run 1 recorded, and
a user's own settings come back byte-identically even after a repeat install.
Parents emptied by the removal go too, so an undo cannot leave an orphaned
`"plugins": {}` behind.

**A residual remains for the OpenCode pair**, which still use the weaker
whole-file test. When the user already had a config, a repeat run cannot tell
which keys it introduced on the first: `opencode.jsonc` records the *current*
value of such a key as its `previous` and restores our own value, while
`tui.json` returns early and records nothing. Either way our entry stays. The
file must survive — it is the user's — so the symptom is a stale entry rather
than a stale file. Porting `withoutOwnEntries` closes both, and would finally
give the long-dead `removeSkillsPath` export a caller.

## Command entries have the same trap

A CLI-driven claim fails the same way and needs the same rule. Oh-My-Pi's
`marketplace add` undo was recorded only when *this run* did the adding, so a
repeat install dropped it and the uninstall after it left `virajp-plugins`
registered at the path it had just deleted — after which installing any *other*
plugin from it fails with "Plugin source directory does not exist". The fix is
the ownership question again: the pin names our own managed directory, which
nobody else would have registered, so the undo is recorded whether or not this
run put it there. A pin pointing anywhere else is still left strictly alone.

**`statusline-ohmypi` is the one case the file test cannot reach**, since
`config.yml` is `omp`'s own YAML and this CLI ships no YAML parser. It is fixed
by the merge below instead — the previous receipt *is* the durable ownership
record a CLI-driven installer has.

## A receipt describes an install, not a run

`writeReceipt` merges with whatever is already at the path. Without it, a run
that recorded less than its predecessor replaced the fuller record, and
installing a second plugin discarded the first one's claims entirely — so the
uninstall removed half the install and reported success, and `--upgrade`
replayed half the plan.

Two rules make the merge safe. **The older entry wins a collision**, because two
runs claiming the same path differ only in what they captured as prior state and
run 2 read a machine run 1 had already changed. **Order is preserved
oldest-first**, so revert — which replays backwards — undoes the most recent
claims before the ones underneath them.

It lives in `writeReceipt` rather than at the four call sites on purpose: this
bug class recurred across every adapter precisely because each site decided for
itself.

## Uninstall asks the receipt, not the flags

The statusline surfaces had a second, separate defect that hid the first: a
plain `--uninstall` never reverted them at all. The tri-state `--statusline`
defers to `--all` when unset, and there is no `--all` on the way out — so a user
who installed with `--all` had to know to pass `--statusline` to remove a bar
they never separately asked for. `revertsStatusline` gates on the receipt
instead, the same question `--upgrade` already asks. `--no-statusline` still
refuses, and a run naming one target never strips another's bar.

## Directories nobody claimed

The other thing four real-install verifications all found: **empty directories
this tool created survived every uninstall**, because only the leaf was ever
recorded. `receipt.tree(<data>/virajp/ai-plugins/<target>)` says nothing about
the two parents `cpSync` made on the way down, so `virajp/` and `ai-plugins/`
were left behind. Both are now `ownedDir`, recorded **outermost first** — revert
replays backwards, so the payload comes out before its containers are asked
whether they are empty.

The receipt directory is the one case an entry cannot cover, since no receipt
can record the directory holding itself. `revert` removes it after the last
receipt is consumed, and removes its parent **only when that parent is our own
`ai-plugins/`** — walking up blindly would target whatever happens to hold the
receipt dir, which under a test is `/tmp`.

What is deliberately *not* claimed: another tool's config directory.
`<config>/opencode/` survives an uninstall empty, and that is the right trade —
removing a directory OpenCode owns is a worse failure than leaving an empty one.
The rule is the same ownership question as everywhere else in this file; it just
answers "no" here.

## When a `command` entry gets an undo

An undo is recorded when the command **changed something**, *or when the
resulting state is provably this tool's*. The test is **ownership, not
activity**.

Gating on activity alone broke the moment a receipt mixed activity-gated entries
with unconditional ones: a no-op re-install recorded the payload and nothing
else, and the uninstall that followed deleted the payload while leaving the
registration pointing at it.

A pin outside this tool's own directories is still **never re-pointed and never
gets an undo**, so uninstall cannot remove a marketplace the user registered
themselves.

For CLI-driven targets an entry pairs the command run with the command that
undoes it. Deleting their files directly instead would leave the tool's own
records claiming an install that is gone.

## Versioning

`RECEIPT_VERSION` is **3** (2 added `command`, 3 added `tree`). `readReceipt`
refuses only a **future** version, so older receipts still revert, while an
older CLI refuses a `tree` it would otherwise skip. The failure worth preventing
is a half-revert reported as a clean uninstall.

Bump it only when an older CLI would *mis-handle* a new entry — adding a field
an old CLI ignores harmlessly is deliberately not a bump.
