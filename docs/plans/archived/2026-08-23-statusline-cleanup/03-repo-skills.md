# WS3: the repo's own skills and agents

The last workstream, and the one most likely to be skipped — these files are not
shipped, so nothing gates them. They are also the files a future session reads
*before* touching `cli/`, which makes stale guidance here more expensive than
stale prose in `docs/`.

`.claude/**/*.md` is dprint-formatted (only `plugins/**/*.md` is excluded).

## Delegation

**Wave D: two `general-purpose` agents in parallel**, then wave E, then wave F.

| Agent | Owns                                                                                           |
| ----- | ---------------------------------------------------------------------------------------------- |
| ①     | `.claude/skills/installer-cli/SKILL.md` + `references/receipts.md` + `references/packaging.md` |
| ②     | `.claude/agents/target-verifier.md` + `docs/plans/plugin-support/index.md`                     |

Agent ① takes all three installer-cli files together: `SKILL.md` points into
both references, and the false "load-bearing" claim is stated across two of
them. Agent ② has two unrelated one-line-ish edits and is parallel only because
it is free.

Give both the wave A diff, this document's matching sections, and the
do-not-touch list. Agent ① additionally needs the wave B result — its `i:test`
description (line ~114) is the second place in the repo describing that file.

**Wave E: `target-verifier`.** This repo's own real-install agent, run once all
editing is done. Its brief:

> The statusline and its debris cleanup have been removed from the installer.
> Prove that `--uninstall` still enumerates and reverts a legacy receipt that is
> not the statusline's, and that nothing statusline-shaped is offered any more.

Concretely, ask it to seed a throwaway `HOME` with a `cursor.json` or
`opencode.json` receipt and confirm it is found, labelled and reverted — and to
seed a `statusline.json` receipt plus a `statusLine` key and confirm the receipt
is still reverted generically while **no** `statusline-settings`,
`statusline-script` or `statusline-caps-hook` row appears.

That second half is the real regression risk of this plan, and it is the one
thing no unit test covers — `uninstall.test.ts` loses exactly those assertions
in WS1.

**Note its step 8 is being rewritten by agent ② in the same wave-D batch.** Run
wave E only after wave D reports, so the verifier reads its updated
instructions.

**Wave F is the orchestrator's**: the final sweep at the bottom of this
document, `dprint fmt`, the full gate list from `index.md`, and the commit. **No
agent commits.**

## `.claude/skills/installer-cli/SKILL.md` — 10 references

This skill auto-applies while editing `cli/`, so every claim in it is read as
current.

- Line ~34: "The statusline was the fourth thing. It has moved to
  `@askviraj/claude-status`" — keep one clause naming the package, drop the
  rest.
- Line ~48: "five independent rediscoveries of the same mistake" — the
  statusline is one of the five. Re-word without dropping the lesson; the count
  is incidental.
- Lines ~78–84, **"A receipt owns its keys; debris cleanup takes the rest"**:
  delete. `statuslineItems` is gone, and this bullet is the doctrine behind it.
  Nothing else in the CLI does debris cleanup.
- Line ~96: the legacy-receipt list. Drop the statusline, keep the marketplace
  payload.
- Lines ~102–108, **"`statusline.json` joining `LEGACY_RECEIPTS` is
  load-bearing"**: delete. It is the second statement of the claim `index.md`
  corrects, and after WS1 there is no `statusline.json` entry at all.
- Line ~114: the description of `i:test`'s E2E section. Rewrite against what WS1
  leaves — **do this after WS1 is green**.
- Lines ~145, ~161: retired-flag list and the `--no-statusline` negation aside.
  Drop the two flags; keep `--force`.

## `.claude/skills/installer-cli/references/receipts.md` — 15 references

The densest file, and mostly a table.

- Lines ~31–33: the entry-kind table's "written by" column names the statusline
  for `file`, `dir` and `configKey`. Re-point at `claude.json` and the render
  targets. **The kinds themselves stay** — see `index.md`, *What is not in
  scope*.
- Line ~16: "`writeReceipt` and `mergeReceipts` are gone with the statusline" —
  keep the fact that they are gone; drop the attribution.
- Lines ~39, ~47, ~51: prose naming the statusline among the receipts read.
  Re-word.
- Lines ~56–58: the worked example is a v5.2.0 statusline restore. **Replace the
  example** with a `cursor.json` or `opencode.json` restore — do not just delete
  it. A reference explaining `configKey` with no example is worse than one with
  a stale example.
- Line ~66: "Do not re-derive them" — keep, re-point.
- Lines ~106–115: the `--statusline`-defaulting defect and the "why
  `statusline.json` had to join `LEGACY_RECEIPTS`" paragraph. **Delete both.**
  The first is about a flag that no longer exists; the second is the third
  statement of the false claim.

## `.claude/skills/installer-cli/references/packaging.md` — 4 references

- Lines ~26–28: the CommonJS-vs-ESM note about `tools/statusline/`. The
  constraint is gone with the directory. Keep one sentence if the ESM rule still
  binds anything; otherwise delete.
- Line ~39: "seven files until the statusline left". Keep the current count,
  drop the comparison.
- Line ~65: "The statusline was the one thing this CLI installed whose on-disk
  version could…" — describes version reporting. Check `cli/src/version.ts`
  after WS1; if nothing on-disk is reported any more, delete the paragraph.

## `.claude/agents/target-verifier.md` — 2 references

- Line ~39: the aside that the statusline "was the one exception, has moved".
  Delete.
- Line ~126, **step 8**: instructs the verifier to check for a `statusline.json`
  receipt in the home it is given. Rewrite against a receipt that still has a
  reader — `cursor.json` or `opencode.json`. **Do not delete the step**: it is
  the only thing verifying the legacy path against a real filesystem, and WS1
  keeps that path.

## `docs/plans/plugin-support/index.md`

One-line fix, unrelated to the statusline but falsified by the same commits.
Status reads **"approved 2026-08-21. Not started."** while
`01-remove-statusline.md` and `02-rename-installer.md` have landed. Update the
status line to reflect what is done.

Do not edit the workstream docs themselves — they are the record of what was
planned.

## Gates

```sh
mise run plugins:check
dprint fmt && dprint check
```

`plugins:check` does not read `.claude/`, so it proves only that this workstream
stayed out of `plugins/`. That is worth having: the statusline references in
`plugins/vwf/skills/execute/SKILL.md` are the ones that must survive, and a
green run with an unchanged `plugins/` diff is the evidence.

## Final check before committing

```sh
git diff --stat
command grep -rn "statusline\|context-caps" --include="*.ts" --include="*.md" \
  cli .claude docs/cli readme.md CLAUDE.md .config/mise/tasks
```

Every surviving hit must be one of:

- a `@askviraj/claude-status` pointer,
- the `/vwf:execute` caps-hook contract,
- a historical record under `docs/memory/` or `docs/plans/`,
- `config.test.ts`'s JSONC fixture keys.

Anything else is a miss.

Then commit per `index.md` — **one commit, no push, no tag, no release.**
