# WS2: the user-facing docs

Prose only, but the largest edit by volume: about 60 references across six
files, most of them narrating a removal that is now two versions old.

The house rule from `CLAUDE.md` applies to this workstream's own output — **docs
ship with the change**, so WS1 and WS2 land in the same commit. The reason these
are separate workstream docs is reviewability, not separate commits.

`CLAUDE.md`, `readme.md` and `docs/**/*.md` are **all dprint-formatted**
(`dprint.json` excludes only `plugins/**/*.md`). Re-wrap after editing rather
than by hand, and expect a widened table cell to re-pad every row.

## Delegation

**Wave B, first**: `docs-reconciler`, once wave A has landed. It is this repo's
own agent for exactly this — it reads `CLAUDE.md` (~132 KB), `readme.md` and the
`docs/` surfaces so the orchestrator does not have to, and returns stale
passages with `file:line`. It **writes nothing**.

Give it the wave A diff (`git diff cli/`) and the do-not-touch list. Ask it to
scope its survey to `CLAUDE.md`, `readme.md` and `docs/cli/**` — its default
surface table also covers `docs/plugins/<plugin>.md`, which this change must not
touch.

**Wave C: three `general-purpose` agents in parallel.** Their file sets are
disjoint, which is what makes the parallelism safe:

| Agent | Owns                                                          | Why grouped this way                                                                                                                                                      |
| ----- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ①     | `docs/cli/index.md`, `usage.md`, `targets.md`, `internals.md` | These four are **one narrative**. Split them and you get a seam — a sentence in `usage.md` pointing at a section `targets.md` no longer has. One agent, reading all four. |
| ②     | `CLAUDE.md`                                                   | Large, and the edits are scattered across four distant sections. Its own context.                                                                                         |
| ③     | `readme.md`                                                   | Small and independent; parallel because there is no reason not to be.                                                                                                     |

Give each agent **only the reconciler findings for its own files**, plus the
matching section of this document and the do-not-touch list. Agent ① also gets
the wave A + wave B diffs, since `internals.md` is a source map and must match
what actually landed.

**Sequencing note for agent ①.** `internals.md`'s `i:test` paragraph (line ~104)
describes a file wave B rewrites. Wave B must be green before wave C starts, or
that paragraph is written against a guess.

## The shape to aim for

The statusline is gone and has been for two versions. What a reader needs is
**one sentence saying where it went**, wherever they might reasonably look for
it — not the removal's history, not the receipt mechanics, not the rationale for
what was left on disk.

Every "why we did it this way" paragraph about statusline cleanup is now
describing code that does not exist. Delete rather than rewrite.

## `CLAUDE.md` — 17 references

| Where                                         | Do                                                                                                                                                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Line ~18, *What This Repo Is*                 | Drop "It used to ship a statusline too … the receipt reader that uninstalls it". Replace with nothing; the CLI's three jobs are described a paragraph later.                                                |
| Lines ~78–103, *Installing, and the receipts* | Delete the debris-cleanup paragraph and the ownership-split paragraph entirely. Keep the "nothing writes a receipt" opening and the legacy-reader paragraph, re-pointed at the four render-target receipts. |
| Line ~709, *The installer CLI*                | Delete "It shipped a statusline until 6.0.0 …". Keep one line: the bar is `@askviraj/claude-status`, and it provides the caps hook `/vwf:execute` depends on.                                               |
| Line ~722                                     | Retired-flag list: drop `--statusline`, `--no-statusline`; keep `--force` and its sentence.                                                                                                                 |
| Lines ~745–752                                | Delete the whole "`statusline.json` joining `LEGACY_RECEIPTS` is load-bearing" paragraph. **It is also factually wrong** — see `index.md`.                                                                  |
| Line ~765                                     | "4 files, down from 7 with the statusline" — keep the count, drop the comparison.                                                                                                                           |
| Line ~958, *Installation*                     | Keep. The parenthetical telling users the statusline is a separate package is exactly the one-sentence pointer this workstream preserves.                                                                   |

The `cli/src/**` path table at line ~770 needs no change — no file leaves.

## `readme.md` — 10 references

- Lines ~115–120: keep. This is the pointer in the CLI's own section.
- Lines ~323–345, the whole `## Statusline` section: **cut to three lines** —
  what it is, that it installs with `pnpx @askviraj/claude-status --install`,
  and that `/vwf:execute`'s pause needs it. Delete the retired-flag list and the
  "restores whatever statusline you had before it" promise, which stops being
  true with WS1.
- Line ~390: the uninstall description listing "this toolkit's statusline, the
  discontinued OpenCode and Oh-My-Pi surfaces". Drop the first clause.

Check the table of contents if the `## Statusline` heading is renamed; keep the
heading if anything links to it.

## `docs/cli/index.md` — 4 references

Lines ~31–41, the `## The statusline has moved` section. Reduce to two
sentences. Delete the retired-flag list (covered in `usage.md`) and the
"restores the statusline you had before it" claim.

## `docs/cli/usage.md` — 17 references

The heaviest.

- Line ~40: retired-flag paragraph. Drop the two statusline flags.
- Lines ~111–126, `## The statusline has moved`: reduce to two sentences. The
  paragraph at ~124 explaining that an older `--uninstall` left `statusLine`
  dangling describes behaviour WS1 removes — delete it.
- Lines ~145–146: the legacy-receipt list. Drop "this toolkit's statusline" and
  "the OpenCode and Oh-My-Pi statuslines"; keep the render-target receipts.
- Line ~160: "so the statusline you had before this toolkit's comes back" —
  **this becomes false**. Re-word to describe what a receipt revert does
  generally.
- Lines ~176–190, *what is deliberately left behind*: delete the two statusline
  config tiers and the `~/.claude/usage/` entry. Nothing in this CLI writes or
  reasons about them any more, so listing them as deliberate restraint is
  describing a decision that no longer has code behind it.

## `docs/cli/targets.md` — 5 references

- Lines ~67–75, `## The statusline no longer lands here`: **delete the
  section.** This document is *what lands where*, and after WS1 nothing
  statusline-shaped lands or unlands. A section explaining an absence belongs in
  `index.md`, where it already is.
- Line ~90: the `statusline.json` row in the receipt table. Delete the row.
- Line ~95: "the two per-target statusline receipts". Re-word.

## `docs/cli/internals.md` — 10 references

This is the source map, so it must match WS1 exactly.

- Line ~20: drop the statusline clause from the history sentence.
- Line ~33: retired-flag list — drop the two.
- Lines ~55–63: the `statuslineItems` paragraph. **Delete entirely** — the
  function is gone.
- Lines ~104–106: the `i:test` description naming the v5.2.0 receipt E2E.
  Rewrite against whatever WS1 leaves in that file. **Do this last**, after WS1
  is green, so it describes what is actually there.
- Line ~120: the file-count history. Drop the statusline comparison.

## Do not touch

- `docs/plugins/vwf.md` (6 refs) — all six are the caps-hook contract and the
  `@askviraj/claude-status` link. Forward references, not residue.
- `docs/how-to/greenfield/single-repo.md:259` and
  `docs/how-to/operate/sessions-and-handoff.md:137` — same.
- `docs/memory/**`, `docs/plans/2026-08-17-claude-first.md`,
  `docs/plans/plugin-support/**`, `archived/**` — records.

## Gates

```sh
dprint fmt
dprint check
```

Then read `docs/cli/index.md`, `usage.md`, `targets.md` and `internals.md`
straight through in order. They are written as one narrative and the risk of
this workstream is a seam — a sentence in `usage.md` referring to a section
`targets.md` no longer has.
