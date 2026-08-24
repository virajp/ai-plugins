# WS1: Remove the statusline and context-caps

The statusline has moved to another project. This removes it from the toolkit
without orphaning anyone who already installed it.

**The one behavior that must survive:** a user on v5.2.0 has our bar installed
and a receipt recording the bar they had before it. `--uninstall` must still
find that receipt and restore their own statusline. Everything else here is
deletion; this is the part that needs care.

## Delete outright

| Path                                                    | Note                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `tools/`                                                | `statusline`, `statusline.json`, `context-caps.js` — the whole tree    |
| `cli/src/statusline.ts` + `.test.ts`                    | 57 + 47 statusline references                                          |
| `cli/src/statusline-script.test.ts`                     | tests the deleted shell script                                         |
| `cli/src/statusline-consent.ts` + `.test.ts`            | consent is statusline-only                                             |
| `cli/src/config/merge.ts` + `merge.test.ts`             | its own header names one consumer: seeding `~/.config/statusline.json` |
| `schemas/statusline.schema.json`                        |                                                                        |
| `.config/statusline.json`                               | this repo's own bar config                                             |
| `docs/plugins/statusline.md`                            | 23 KB user doc                                                         |
| `docs/cli/statusline.md`                                |                                                                        |
| `.claude/skills/installer-cli/references/statusline.md` |                                                                        |

**Keep** `cli/src/config/json.ts` — `claude-settings.ts` and `context.ts` still
use it. **Keep** `write-file-atomic` — `receipt.ts` imports it and `revert`
still restores file contents.

## Source edits

### `cli/src/args.ts`

Drop `--statusline`, `--no-statusline`, `--force`, the `statuslineFlag` helper
and the `statusline` field on `Args`. The module header is mostly the
boolean-negation rationale for the `--statusline`/`--no-statusline` pair —
rewrite it rather than leaving a doc comment about a flag that no longer exists.
`renderUsage`'s first line ("Install the virajp-plugins plugins and
statusline…") and the `OPTIONS` table both change.

`strict: true` means the three retired flags now error *naming themselves*,
which is the intended legible retirement — the same way `--platform` and
`--upgrade` answer today.

### `cli/src/index.ts`

Remove `resolveStatuslineConsent`, the consent block before the install, the
statusline `outcomes.push`, and the statusline half of the `hasBin("claude")`
guard — keep the plugins half; `--force` existed only for the statusline. The
"nothing to do" message loses `--statusline`. The four-jobs sentence in the
module header becomes three.

### `cli/src/uninstall.ts` — the load-bearing edit

- Move `statusline.json` into `LEGACY_RECEIPTS`, beside `statusline-ohmypi.json`
  and `statusline-opencode.json`.
- Drop the `statusline` `Item` kind.
- Drop the `revertStatuslineInstall` / `statuslineReceiptPath` imports from the
  deleted module. The generic receipt-revert path those legacy entries already
  use covers it, and `revert` restoring `settings.json`'s `statusLine` key is
  exactly the behavior that must survive.
- Update the module header, which currently explains the statusline as a live
  surface, and the `legacyItems` doc comment that reads "every receipt **other
  than the statusline's**."

### `cli/src/receipt.ts`

After this, **nothing writes a receipt**. `statusline.ts` held the only
`new ReceiptBuilder()` and the only `writeReceipt` call.

Delete `ReceiptBuilder` and `writeReceipt`. **Keep** `readReceipt`, `revert` and
every `Entry` kind — the legacy reader meets all of them, and dropping a kind
from `revert` turns an old receipt into a file nothing can undo. Rewrite the
module header, which opens by describing what the statusline records.

### Comment-only edits

`cli/src/context.ts` (3), `report.ts` (3), `graphify.ts` (1), `install.ts` (2).

### `package.json`

- `files` becomes `["bin"]`.
- Rewrite `description` — it currently leads with the statusline.
- Drop the `statusline` and `powerline` keywords.

> **Flagged, not assumed:** `smol-toml` has **zero importers** anywhere in
> `cli/` or `scripts/` — it was already dead before this change, left over from
> the renderer. Removing it is a one-line win, but it is not this change's
> business; say the word.

## Tasks

### `.config/mise/tasks/i/version`

Delete the entire stamping half. The task becomes
`pnpm version <level> --no-git-tag-version` plus the closing print. The "the
number lives in two places and this is where they are kept equal" comment goes
with it.

### `.config/mise/tasks/i/test`

The larger surgery. **Remove**: the version-parity assertion and the whole
install-twice-then-uninstall E2E, which is statusline end to end.

**Survives**: `--help`, no-flags-exits-non-zero, retired-flag rejection,
`--user vwf --dry-run` describing the claude commands and writing nothing, and
the vitest suites.

**Replace the uninstall E2E rather than dropping it**, and make it prove the
migration:

1. Seed the throwaway `HOME` with a **v5.2.0-shaped `statusline.json` receipt**
   plus the files it records, and a foreign `statusLine` command in
   `settings.json` as the `previous` state.
2. Assert `--uninstall --dry-run` lists it and writes nothing.
3. Assert `--uninstall` restores the foreign bar into `settings.json`
   byte-for-byte.

Nothing else covers this, and it is the one thing this workstream can break
silently.

### `.config/mise/tasks/i/release` and `i/build`

Statusline references (2 in `release`) and, from WS2, the bundle path.

## Docs — same commit, per the repo rule

`readme.md` (23 refs), `CLAUDE.md` (20 — the whole "The installer & statusline
CLI" section retitles and loses the consent/ownership paragraphs),
`docs/cli/index.md`, `docs/cli/internals.md` (the path table),
`docs/cli/targets.md`, `docs/cli/usage.md`,
`docs/how-to/greenfield/single-repo.md`,
`docs/how-to/operate/sessions-and-handoff.md`, `mempalace.yaml` (room routing
names `tools/`), `.vscode/settings.json`,
`.claude/skills/installer-cli/SKILL.md` (19) + `references/packaging.md` +
`references/receipts.md`, `.claude/agents/docs-reconciler.md`,
`.claude/agents/target-verifier.md`.

**Leave alone**: `docs/memory/decisions/*` and
`docs/plans/2026-08-17-claude-first.md` — dated records of what was true then.

## Verification

- `mise run i:build` — `pnpm pack --dry-run` lists `bin` only, no `tools/`.
- `mise run i:test` — surviving smoke tests plus the new legacy-receipt E2E.
- `pnpm exec vitest run` and `tsc --noEmit` per project — no dangling imports.
- `grep -ril statusline --exclude-dir=node_modules .` returns only the dated
  records under `docs/memory/` and `docs/plans/`.
- `node bin/installer.mjs --statusline` and `--force` both exit non-zero naming
  the flag.
