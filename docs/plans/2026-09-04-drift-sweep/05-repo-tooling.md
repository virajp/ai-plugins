# U5 — repo tooling: pre-commit order, task headers, dead comments

- **Wave:** 1
- **Depends on:** —
- **Owns:** `.config/pre-commit-config.yaml`, `.config/mise/tasks/setup/ai`,
  `.config/mise/tasks/plugins/marketplace`,
  `.config/mise/tasks/plugins/release`, `.gitignore`, `vitest.config.mts`
- **Model:** inherit
- **Read first:** every owned file top to bottom.
- **Lazy-load:** `scripts/src/marketplace.ts:360-410` (what the task actually
  does with a symlink), `package.json` (the `files` list),
  `.claude/docs/dev-marketplace.md:100-110` (the symlink retirement record;
  read-only).

## Ruling

Quoted from index.md:

> 12 — Gate order: `plugins-marketplace` and `plugins-inventory` move above
> `plugins-check` in pre-commit; docs say vitest and tsc are CI-only.

> 19 — `setup/ai` task: Runs `pnpx @virajp.dev/claude-plugins --all` only.

> 11 — Counts in prose: structural ones corrected ("the other entry").

## Edits

1. **`.config/pre-commit-config.yaml`** — move the `plugins-marketplace` hook
   block (line 42 onward) and the `plugins-inventory` block (line 53 onward)
   above the `plugins-check` block (line 27), preserving each block byte for
   byte, so local order matches `plugins.yml`: freshness, then validity.
2. **`.config/mise/tasks/setup/ai`** — line 12: drop
   `--project typescript --project cicd`; the line becomes
   `pnpx @virajp.dev/claude-plugins --all`.
3. **`.config/mise/tasks/plugins/marketplace`** — header comment, lines 13-20,
   24, 42-44: every description of `.dev-marketplace/plugins` as a symlink
   becomes "a staging directory of copies"; state that `--check` fails if the
   path is the retired symlink, which is what the code does.
4. **`.config/mise/tasks/plugins/release`** — line 13: "leaves the other six
   entries byte-identical" becomes "leaves the other entry byte-identical".
5. **`.gitignore`** — line 18: the comment saying the npm tarball's `files` list
   is `bin` + `tools` becomes `bin` alone, matching `package.json`.
6. **`vitest.config.mts`** — lines 7-9: the comment citing "the OpenCode bundle
   alone is 500+ files" from the deleted render trees is rewritten to state the
   current reason for the setting without naming a tree that no longer exists.
   If the setting itself is no longer needed, say so as a `GAP:` and leave the
   setting.

## Verification

- `mise x -- pre-commit run --all-files` runs and lists `plugins-marketplace`,
  `plugins-inventory`, then `plugins-check`, all passing.
- `mise run plugins:marketplace --check` and
  `mise run plugins:inventory
  --check` pass (the task scripts still parse).
- `bash -n .config/mise/tasks/setup/ai` and the same for the two plugins task
  scripts pass.
- `pnpm vitest run` still discovers 14 test files.
- `mise run code:format` reports nothing.

## Guardrails

- Do not edit any hook's `entry`, `files` or `pass_filenames` — this is a
  reorder, not a rewrite.
- Do not touch `.config/mise/tasks/plugins/check`, `local` or `inventory`.
- Do not touch `.github/workflows/**`.
- `.config/mise/tasks/*` are executable scripts — preserve the mode bits
  (`plugins:check` asserts the bit).
- Byte-copy, never retype, any line you are not changing.

## Commit

`chore(tooling): freshness before validity in pre-commit, fix the setup:ai
task, retire the symlink and render-tree comments`
— written by the orchestrator after the wave gate, not by the unit.
