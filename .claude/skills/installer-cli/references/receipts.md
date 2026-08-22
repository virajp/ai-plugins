# Receipts

A receipt records what an install touched **and what was there before it**, so
`revert` restores rather than guesses. The invariant it exists to make testable:
**install then remove leaves the tree and every touched config byte-identical.**

The old installer inferred what it must have written and deleted the keys it
knew it set. That is safe only while the inference stays true, and it silently
is not whenever a user edits a value the installer later removes wholesale.

## This module is read-only

**Nothing this version installs writes a receipt.** Plugins go in through
`claude plugin install` and graphify through its own CLI; both tools keep their
own records, which is what `--uninstall` reads live. `ReceiptBuilder`,
`writeReceipt` and `mergeReceipts` are gone with the statusline, the last
writer.

What is left is `readReceipt` and `revert`, for the receipts **older versions**
left on disk. Everything below the next two sections is therefore knowledge
about what you will *meet*, not rules for what you will write — until something
writes again, at which point the write-path sections become live and are the
first thing to re-read.

## The five kinds

**Every kind is still read; none are written.**

| Kind        | On revert                            | Was written by                            |
| ----------- | ------------------------------------ | ----------------------------------------- |
| `file`      | restores `previous`, else deletes    | the statusline                            |
| `dir`       | removes **only if empty**            | the statusline (`~/.claude/scripts`)      |
| `configKey` | restores the key, else deletes it    | the statusline, and every retired adapter |
| `tree`      | removes **recursively**              | the four plugin adapters                  |
| `command`   | **skipped** — no `runUndo` is passed | the Oh-My-Pi and Cursor adapters          |

**`revert` must keep handling all five.** `uninstall.ts` reads the receipts
older installs left behind, which is the whole reason a machine carrying this
toolkit's statusline, a copied marketplace payload or a discontinued target's
bundle can be **cleaned rather than orphaned**. Dropping a kind turns those
receipts into files nothing can undo — and the half-revert reports as a clean
uninstall, which is the failure worth preventing. When the legacy window closes
they go together; `uninstall.ts` names the set.

**`command` is now inert, and that is a deliberate narrowing rather than a
regression.** Its `runUndo` hook was only ever supplied for `omp`, and only
`ohmypi.json` / `statusline-ohmypi.json` held one. Only Claude Code is supported
now, so nothing passes a program to run an undo against, and `revert` skips the
entry rather than guessing one. Both receipts still named in `LEGACY_RECEIPTS`
are Claude Code's, and neither holds a `command` entry — `claude.json` is
`filesOnly`, and the statusline's holds files and config keys. The kind stays
reachable in the type because a receipt on disk may still carry one; it simply
no longer runs.

`configKey` is the one that matters most in practice, because it is what
restores a v5.2.0 machine's own statusline: `settings.json` → `statusLine`, with
the foreign command as `previous`. `restoreJsonKey` in `cli/src/config/json.ts`
is the hook that performs it — it moved there when `statusline.ts` was deleted,
since it is a generic JSONC key-writer and every config any adapter ever touched
is that format.

## If a write path ever returns

These are the rules that governed every writer this CLI had, and the bug class
they exist for was rediscovered **five** times — in all four plugin adapters and
again in the statusline. Do not re-derive them.

**The unconditional rule.** `file` (when it creates), `dir` and `tree` were
recorded **unconditionally** — recording is not gated on what is currently at
the path. Removal stays conditional; the *claim* does not.

Every guarded form asks the wrong question, because on run 2 what is sitting at
the path is run 1's own output. The claim must be computed against what run 1
saw, and the only way to do that is to ask **who owns the path**, never **what
is at it**. The strongest form reconstructs the file *without* our entries and
compares, answering "would our merge produce exactly this?" rather than "does
something exist here?".

**Receipts merge.** `writeReceipt` merged with whatever was already at the path,
because a receipt describes an install, not a run: overwriting it wholesale is
what let a second run record less than the first. The **older** entry won a
collision, since run 2 read a machine run 1 had already changed. Merging in the
one place every writer passed through was deliberate — the bug recurred across
every adapter precisely because each site decided for itself.

**A single install passes either way; only a repeat run shows it.** Any test for
a new writer has to install twice and assert the receipt still records the
*original* prior state, comparing file contents rather than filenames.

## Project scope follows the working directory

Not the config dir, and not `$HOME`. `claude plugin install --scope project`
writes `<cwd>/.claude/settings.json`, so that is where `enumerate` has to look
and where the removal has to run — which is why the project-scope items carry an
explicit `cwd` and the user-scope ones do not.

**The corollary bites during testing.** A `claude plugin uninstall` run from
inside a repo rewrites *that repo's* settings even with `HOME`, every `XDG_*`
var and `CLAUDE_CONFIG_DIR` redirected into a temp dir. Verifying this toolkit
from this checkout emptied the checkout's own `enabledPlugins` exactly once,
that way. Any hermetic run must therefore `cd` somewhere throwaway first, and
check `git status --porcelain` afterwards rather than assuming.

## Uninstall asks the receipt, not the flags

The statusline had a defect worth remembering even though the flag is gone: a
plain `--uninstall` never reverted it at all, because the tri-state
`--statusline` deferred to `--all` when unset and there was no `--all` on the
way out. A user who installed with `--all` had to know to pass `--statusline` to
remove a bar they never separately asked for.

The rule that fixed it is now structural: **uninstall undoes what this tool did,
and the receipt is the record of that.** `enumerate` finds a piece *by its
receipt*, which is why a statusline this tool did not install is never listed —
and why `statusline.json` had to join `LEGACY_RECEIPTS` rather than being
deleted along with the code that wrote it.

## Directories nobody claimed

Four real-install verifications all found the same thing: **empty directories
this tool created survived every uninstall**, because only the leaf was ever
recorded. A `tree` entry says nothing about the parents `cpSync` made on the way
down. The fix was to record containers **outermost first** — revert replays
backwards, so the payload comes out before its containers are asked whether they
are empty.

The receipt directory is the one case an entry cannot cover, since no receipt
can record the directory holding itself. `removeItems` removes it after the last
receipt is consumed, and removes its parent **only when that parent is our own
`ai-plugins/`** — walking up blindly would target whatever happens to hold the
receipt dir, which under a test is `/tmp`.

What is deliberately *not* claimed: another tool's config directory. An empty
`<config>/opencode/` surviving an uninstall is the right trade — removing a
directory another tool owns is a worse failure than leaving an empty one. Same
ownership question as everywhere else in this file; it just answers "no" here.

## When a legacy `command` entry has an undo

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
exactly what the legacy reader depends on, and why the constant stays even
though nothing stamps it any more.

Bump it only when an older CLI would *mis-handle* a new entry; adding a field an
old CLI ignores harmlessly is deliberately not a bump. The failure worth
preventing is a half-revert reported as a clean uninstall.
