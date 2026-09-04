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
`writeReceipt` and `mergeReceipts` went with the last writer this CLI had.

What is left is `readReceipt` and `revert`, for the receipts **older versions**
left on disk. Everything below the next two sections is therefore knowledge
about what you will *meet*, not rules for what you will write — until something
writes again, at which point the write-path sections become live and are the
first thing to re-read.

## The five kinds

**Every kind is still read; none are written.**

| Kind        | On revert                            | Where you meet it                                           |
| ----------- | ------------------------------------ | ----------------------------------------------------------- |
| `file`      | restores `previous`, else deletes    | any legacy install that placed a file                       |
| `dir`       | removes **only if empty**            | a parent a file-placing install created on the way down     |
| `configKey` | restores the key, else deletes it    | every retired adapter, and the render targets' own receipts |
| `tree`      | removes **recursively**              | the four plugin adapters — `claude.json`'s copied payload   |
| `command`   | **skipped** — no `runUndo` is passed | the Oh-My-Pi and Cursor adapters                            |

**`revert` must keep handling all five.** `uninstall.ts` reads the receipts
older installs left behind, which is the whole reason a machine carrying a
copied marketplace payload or a discontinued target's bundle can be **cleaned
rather than orphaned**. Dropping a kind turns those receipts into files nothing
can undo — and the half-revert reports as a clean uninstall, which is the
failure worth preventing. There is **no scheduled end** for any of this: the
drop condition `uninstall.ts` used to carry was tied to a removal that has since
happened, and the reader outlived it. These kinds go when the reader does, and
nothing currently proposes retiring either.

**`command` is now inert, and that is a deliberate narrowing rather than a
regression.** Its `runUndo` hook was only ever supplied for `omp`, and only the
Oh-My-Pi receipts held one. Only Claude Code is supported now, so nothing passes
a program to run an undo against, and `revert` skips the entry rather than
guessing one. `LEGACY_RECEIPTS` names exactly one receipt, `claude.json`, and it
is `filesOnly` — its `command` entries claim the marketplace registration and
the plugin installs, which the live enumeration already covers by reading
Claude's settings directly. Replaying them too would uninstall one plugin twice
and report the second, failing, call as a broken uninstall. The kind stays
reachable in the type because a receipt on disk may still carry one; it simply
no longer runs.

`configKey` is the one that matters most in practice, because it is what gives a
user their own setting back rather than an empty one. The shape `i:test` seeds
is the worked example: a `cursor.json` receipt records `~/.cursor/settings.json`
→ `virajp`, with the value that was there before that install as `previous`.
Reverting writes that value back; it deletes the key only when `hadKey` says
there was none to begin with, which is why `hadKey` is separate from a
`previous` of literal `undefined`. `restoreJsonKey` in
`installer/src/config/json.ts` is the hook that performs it — a generic JSONC
key-writer, since every config any adapter ever touched is that format.

## If a write path ever returns

These are the rules that governed every writer this CLI had, and the bug class
they exist for was rediscovered **five** times — in all four plugin adapters,
and once more in the last write path to be added. Do not re-derive them.

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

## Uninstall asks the receipt, not the machine

**Uninstall undoes what this tool did, and the receipt is the record of that.**
`enumerate` finds a legacy piece *by its receipt*, never by scanning the machine
for state that resembles ours — so a file or a config key this tool did not
write is never listed, and never offered for removal. That is also why there is
no debris cleanup anywhere in this CLI: a path with no receipt and no owning
tool is not ours to touch.

**`LEGACY_RECEIPTS` is a label lookup, not an allowlist.** `legacyItems`
enumerates every readable `*.json` in the receipt directory with no exclusion
and reverts each the same way; a name absent from the map still gets a row,
under the generic `an install recorded in <name>`. Adding or removing an entry
changes a display label and the `filesOnly` flag, and nothing else. Do not
reason about that map as if membership decided whether a receipt is found — it
does not, and the mistaken version of that claim was written down three times
before it was checked against `legacyItems`.

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
