# WS1: the CLI

Removes the executing code. This is the only workstream that can change
behaviour; WS2 and WS3 are prose.

Read [`index.md`](./index.md) first — in particular *What is not in scope*,
which names the legacy-receipt reader this workstream must leave standing, and
*Execution: who does what*, which assigns the waves below.

## Delegation

**Sections 1–4 are wave A: the orchestrator does them itself, serially.** They
are one type-coupled edit — deleting `statuslineItems` breaks `Removal`, which
breaks `removeItem`, which breaks four test blocks — and `tsc` failures have to
be read against the deletion that caused them. A subagent boundary in the middle
of that costs more than it saves.

**Section 5 is wave B, delegated** to a `general-purpose` agent. The file is
self-contained shell, its gate (`mise run i:test`) is independent of `tsc`, and
it is the single largest mechanical rewrite in the plan.

- **Owns:** `.config/mise/tasks/i/test` and nothing else.
- **Give it:** this document's section 5 verbatim, plus the wave A diff
  (`git diff .config/mise/tasks/i/test cli/src`) so it can see which assertions
  reference code that no longer exists.
- **Must report:** whether the stubbed `claude` binary and `E2E_HOME`
  scaffolding survived, and what the re-pointed `--dry-run` assertion now
  asserts against.

Run it **in parallel with the `docs-reconciler` survey**, which is the other
half of wave B — the reconciler is read-only and their file sets do not
intersect.

## 1. `cli/src/uninstall.ts` (~1035 lines → ~800)

### Delete outright

- The whole **"The statusline's leftovers"** section, lines ~305–500:
  `statuslineItems`, `orphanedStatuslineFiles`, `statuslineSettingsItem`,
  `receiptedKeys`, `isBarKey`, `isOurBar`, `capsHookEntries`, `describeWiring`,
  and the constants `STATUSLINE_SCRIPT`, `CAPS_HOOK`, `USAGE_ENV_KEY`.
- The `settings-edits` arm of the `Removal` union (~line 149) and its doc
  comment.
- `editSettings` (~line 828) and the `settings-edits` case in `removeItem`.
- The `"statusline.json"` entry in `LEGACY_RECEIPTS`, plus
  `"statusline-ohmypi.json"` and `"statusline-opencode.json"` if present.
- The `items.push(...statuslineItems(...))` call in `userItems` (~line 300).

### Rewrite

- The module doc comment, lines ~35–60. It currently narrates the statusline as
  the reason the legacy reader exists. The reader now exists for the four
  render-target receipts alone — say that, and **delete the drop-condition
  paragraph at line ~56**, which this change resolves.
- The `Removal` union's `receipt` arm comment (~line 128) mentions "the
  statusline's holds only files and config keys" as an example. Re-word around
  `claude.json`.

### Signature fallout

`userItems(context, receiptDir)` no longer needs `receiptDir` — it was passed
solely for `statuslineItems`. Drop the parameter and update `enumerate`. Check
whether `context` is still used (it is: `userSettingsFile`).

### Imports that go dead

Verify each before deleting; `tsc --noEmit` will not catch an unused import that
lint allows.

- `removeFromJsonArray` from `./config/json.ts` — its only non-test caller is
  `editSettings:854`.
- `getPath` — used at lines 413, 418, 483, 857, **all four inside the deleted
  block**. It becomes unused in this file. Keep the export in `config/json.ts`:
  `claude-settings.ts` and `context.ts` both use it.
- `writeFileAtomic` — **keep**. `editSettings` uses it, but so does the receipt
  revert path; confirm with a grep before removing anything.
- `existsSync`, `readFileSync` — used elsewhere in the file. Confirm, do not
  assume.

`removeFromJsonArray` itself stays exported in `config/json.ts` with its
`config.test.ts` coverage — it is a general JSON utility, and deleting a tested
helper because its last caller left is a wider change than this one.

## 2. `cli/src/receipt.ts`

Prose only. Three comments reference the statusline as the writer of the `file`,
`dir` and `configKey` kinds (lines 18, 52, 57). The kinds themselves stay — the
four surviving receipts use them. Re-word to name the receipts rather than the
bar.

**Do not touch** the `tree` and `command` entry kinds. See *What is not in
scope*.

## 3. `cli/src/args.ts`

- Delete the `--no-statusline` aside in the module comment (lines ~19–21).
- Line ~25: `--statusline`, `--no-statusline` and `--force` are still rejected
  by `strict` parsing and that is still worth documenting — but shorten to one
  clause naming all five retired flags without the statusline history.

**No parsing change.** `strict` rejects any undeclared flag; there is nothing to
remove from `OPTIONS`.

## 4. Tests

### `cli/src/uninstall.test.ts` (881 lines)

- Delete the whole `describe("the retired statusline's leftovers")` block, lines
  ~735–885.
- Delete `describe("a v5.2.0 statusline receipt, read as a legacy one")`, lines
  ~493–548, **and its preceding comment block** — which is the third statement
  of the false "load-bearing" claim.
- Line ~212, the `it(...)` asserting a statusline is not offered without a
  receipt to restore from, inside `describe("enumerate")`. Delete.
- Lines ~662, ~671, ~675: `writeReceiptFile("statusline.json", ...)` used as
  generic fixtures in `describe("removeItems")`. **Do not delete these tests** —
  rename the fixture to `cursor.json` or `opencode.json` so they keep asserting
  the legacy path with a receipt that is still real.

### `cli/src/args.test.ts`

Lines 64–68 and 110–111. Keep the retired-flag rejection cases — they assert
`strict`, which is the point — but drop `--statusline` and `--no-statusline`
from the arrays and delete the "Retired with the statusline" comment. Keep
`--force`: it is still retired and still rejected.

### `cli/src/report.test.ts`

Lines ~20, 29, 46: fixture names `legacy:statusline-ohmypi.json` and
`legacy:statusline-opencode.json`. Rename to `legacy:ohmypi.json` /
`legacy:opencode.json`. Pure fixture rename; the assertions are about rendering.

### `cli/src/config/config.test.ts`

**Leave alone.** It uses `statusLine` and `AI_PLUGINS_USAGE_DIR` as JSONC
fixtures. `statusLine` is Claude Code's own key and a realistic test of
format-preserving edits. `AI_PLUGINS_USAGE_DIR` is a plausible nested-env
fixture. Renaming them buys nothing and loses the reason the fixture was chosen.

## 5. `.config/mise/tasks/i/test`

The larger edit. The file is 204 lines; roughly 130 of them are the statusline
E2E.

- Lines ~29–39: drop `--statusline` and `--no-statusline` from the retired-flag
  loop, keep `--platform --upgrade --force`, and rewrite the comment without the
  statusline reference.
- Lines ~41–189: delete the entire seeded-v5.2.0-receipt E2E — the `FOREIGN`
  bar, the `settings.json` heredoc, the receipt heredoc, and all four
  assertions.

**What must survive that deletion**, and this is the trap: two assertions in
that range are not about the statusline.

- *"`--uninstall` refuses without a terminal"* (~line 190) — the no-TTY rule.
- The assertion that `--dry-run` writes nothing (~line 185) is currently phrased
  against `$SETTINGS`, a statusline artifact. **Re-point it**, do not delete it:
  seed the throwaway `HOME` with any file the CLI would otherwise touch and
  assert it is unchanged. Losing it would leave `--dry-run` unproven end to end.

Also check whether the stubbed `claude` binary and the `E2E_HOME` scaffolding
(lines ~56–108) are used by anything after the statusline block. If they are
only used by it, they go too — but read to the end of the file before deciding.

Use `Write` for this file, not a heredoc: `cat > file <<EOF` writes ANSI escapes
through the `bat` alias.

## Gates

```sh
pnpm -C cli exec tsc --noEmit
pnpm -C cli exec vitest run
mise run i:build
mise run i:test
```

`i:test` runs against the **built bundle**, so `i:build` must precede it.

## Verification beyond the gates

Run the real thing against a throwaway home and confirm the two properties that
matter:

```sh
export CLAUDE_CONFIG_DIR="$(mktemp -d)"
node bin/installer.mjs --uninstall --dry-run
```

1. A receipt directory containing `cursor.json` or `opencode.json` is still
   enumerated and still labelled.
2. Nothing in the output mentions a statusline, a caps hook, or `statusLine`.
