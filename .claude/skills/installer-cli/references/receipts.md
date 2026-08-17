# Receipts

A receipt records what an install touched **and what was there before it**, so
`revert` restores rather than guesses. The invariant it exists to make testable:
**install then remove leaves the tree and every touched config byte-identical.**

The old installer inferred what it must have written and deleted the keys it
knew it set. That is safe only while the inference stays true, and it silently
is not whenever a user edits a value the installer later removes wholesale.

## The five kinds

**Every kind is still read; only three are still written.**

| Kind        | On revert                         | Written today | Safe because                                                      |
| ----------- | --------------------------------- | ------------- | ----------------------------------------------------------------- |
| `file`      | restores `previous`, else deletes | yes           | `previous` absent means we created it                             |
| `dir`       | removes **only if empty**         | yes           | the user shares it — `~/.claude/scripts`                          |
| `configKey` | restores the key, else deletes it | yes           | `previous` absent is the signal to delete, not to write a default |
| `tree`      | removes **recursively**           | **no**        | only ever pointed at a directory nothing but this tool wrote to   |
| `command`   | runs the recorded undo command    | **no**        | the tool owns bookkeeping we must not edit                        |

`tree` and `command` were the four plugin adapters' — a copied render tree, a
`claude plugin install` paired with its uninstall. Those adapters are gone, and
`ReceiptBuilder` accordingly has **no** `tree`, `command` or `ownedDir` method:
a builder method with no caller is dead weight.

But `revert` still handles them, deliberately. `uninstall.ts` reads the receipts
an older multi-target install left behind, which is the whole reason a machine
carrying an OpenCode bundle or an Oh-My-Pi bar can be **cleaned rather than
orphaned**. Dropping the kinds from `revert` would turn those receipts into
files nothing can undo. When the legacy window closes, they go together —
`uninstall.ts` names the set.

## The unconditional rule

`file` (when it creates), `dir` and the retired `tree`/`ownedDir` are recorded
**unconditionally** — recording is not gated on what is currently at the path.
Removal stays conditional; the *claim* does not.

This is the same invariant as the SKILL.md's, seen from the receipt side. Every
guarded form asks the wrong question, because on run 2 what is sitting at the
path is run 1's own output. The claim must be computed against what run 1 saw,
and the only way to do that is to ask **who owns the path**, never **what is at
it**.

The strongest form of the ownership test reconstructs the file *without* our
entries and compares — so it answers "would our merge produce exactly this?"
rather than "does something exist here?". Copy that shape.

`cli/src/statusline.ts` still keys its `configKey` records on `existed`, and is
covered by the receipt merge below rather than by its own test. That holds, but
it means its claims are correct only in combination — a known soft spot.

## Receipts merge

`writeReceipt` **merges with whatever is already at the path**. A receipt
describes an install, not a run: overwriting it wholesale is what let a second
run record less than the first.

The **older** entry wins a collision, since run 2 read a machine run 1 had
already changed. Merging in the one place every writer passes through is
deliberate — this bug class recurred across every adapter precisely because each
site decided for itself.

## Uninstall asks the receipt, not the flags

The statusline had a second defect that hid the first: a plain `--uninstall`
never reverted it at all, because the tri-state `--statusline` deferred to
`--all` when unset and there was no `--all` on the way out. A user who installed
with `--all` had to know to pass `--statusline` to remove a bar they never
separately asked for.

The rule that fixed it survives the interactive rewrite and is now structural:
**uninstall undoes what this tool did, and the receipt is the record of that.**
`enumerate` finds the statusline *by its receipt*, which is why a bar this tool
did not install is never listed. `--no-statusline` still refuses.

## Directories nobody claimed

Four real-install verifications all found the same thing: **empty directories
this tool created survived every uninstall**, because only the leaf was ever
recorded. A `tree` entry says nothing about the parents `cpSync` made on the way
down. The fix was to record containers **outermost first** — revert replays
backwards, so the payload comes out before its containers are asked whether they
are empty.

The receipt directory is the one case an entry cannot cover, since no receipt
can record the directory holding itself. `revert` removes it after the last
receipt is consumed, and removes its parent **only when that parent is our own
`ai-plugins/`** — walking up blindly would target whatever happens to hold the
receipt dir, which under a test is `/tmp`.

What is deliberately *not* claimed: another tool's config directory. An empty
`<config>/opencode/` surviving an uninstall is the right trade — removing a
directory OpenCode owns is a worse failure than leaving an empty one. Same
ownership question as everywhere else in this file; it just answers "no" here.

## When a legacy `command` entry has an undo

Read-only knowledge now, but it explains what you will meet in an old receipt.

An undo was recorded when the command **changed something**, *or when the
resulting state was provably this tool's* — ownership, not activity. Gating on
activity alone broke the moment a receipt mixed activity-gated entries with
unconditional ones: a no-op re-install recorded the payload and nothing else,
and the uninstall that followed deleted the payload while leaving the
registration pointing at it.

A pin outside this tool's own directories was **never re-pointed and never got
an undo**, so uninstall cannot remove a marketplace the user registered
themselves. `enumerate` keeps that rule for the live path.

## Versioning

`RECEIPT_VERSION` is **3** (2 added `command`, 3 added `tree`). `readReceipt`
refuses only a **future** version, so older receipts still revert — which is
exactly what the legacy reader depends on.

Bump it only when an older CLI would *mis-handle* a new entry; adding a field an
old CLI ignores harmlessly is deliberately not a bump. The failure worth
preventing is a half-revert reported as a clean uninstall.
