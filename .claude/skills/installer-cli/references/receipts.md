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
fix there is the ownership *test* rather than a fourth kind. The OpenCode
adapter's `mergeConfig` decides between `createdFile` and a key-by-key
`configKey` restore by comparing the config on disk against the one its own
merge would produce from empty: identical means an earlier run of ours wrote it,
whatever `existsSync` says. Keying that on existence alone is what left
`opencode.jsonc` behind after install → install → uninstall, still registering
the bundle directory the same uninstall had just deleted.

**A residual remains in the mixed case**, and it is narrower: when the user
already had a config, a repeat run records the *current* value of a key we
introduced on the first run as that key's `previous`, so revert restores our own
value instead of removing it. The file must survive there — it is the user's —
so the symptom is a stale `skills.paths` entry rather than a stale file.
Resolving it needs the run to reconstruct the user's pre-merge config by
un-merging its own contribution, which is also what would finally give the
long-dead `removeSkillsPath` export a caller.

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
