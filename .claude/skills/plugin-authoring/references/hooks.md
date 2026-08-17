# Hooks

Hooks are authored directly as each plugin's `hooks/hooks.json`, in Claude's own
format, with the scripts beside it. There is no neutral event vocabulary and no
per-target projection any more — what you write is what runs.

## What ships today

- `plugins/typescript/hooks/npm-normalize.sh` — rewrites `npm`/`npx` to the
  repo's package manager, via `PreToolUse` on `Bash` with `updatedInput`.
  Exactly two are allowed for JS/TS, **pnpm** and **bun**, and the hook resolves
  which by walking up from cwd for a lockfile (`bun.lock`/`bun.lockb` → bun,
  `pnpm-lock.yaml` → pnpm), then a `package_manager: bun` line in
  `.config/vwf.yaml`, then defaulting to pnpm. The lockfile is ground truth
  because bun reuses npm's `workspaces` field, so nothing else distinguishes
  them. It lives in the **language** plugin, not vwf: a JS/TS rewrite is a
  TypeScript fact, and vwf names no technology.
- `plugins/vwf/hooks/hooks.json` → `rtk hook claude`, vwf's only `Bash` hook and
  **optional**. The entry is guarded
  (`command -v rtk >/dev/null 2>&1 && rtk hook claude || true`) so a missing
  `rtk` never blocks a Bash call; `/vwf:doctor` carries the warning instead,
  because a per-command warning would be unusable noise.
- `plugins/vwf/hooks/mempalace-checkpoint.sh` (`Stop`) and
  `mempalace-precompact.sh` (`PreCompact`) — the mempalace auto-save, **written
  here rather than vendored**. Upstream's counts human messages by parsing a
  Claude JSONL transcript and breaks its own loop with `stop_hook_active`. Ours
  counts *stops* in a state file under `$XDG_STATE_HOME/ai-plugins/mempalace`,
  speaks every 15th stop (`MEMPALACE_SAVE_INTERVAL` overrides), honours
  mempalace's own opt-out (`MEMPALACE_HOOKS_AUTO_SAVE`, or `hooks.auto_save` in
  `~/.mempalace/config.json`), and resets the counter on
  `stop_hook_active: true` so a save cycle cannot re-trigger itself. The
  pre-compact half is a **second file** that `exec`s the first with `--compact`.

  The reason for the separate file was the retired neutral schema, which named a
  script and passed it no arguments. It is now merely how it is; collapsing the
  two into one entry with an argument would be a fine simplification, and
  `cli/src/mempalace-checkpoint-script.test.ts` covers the behaviour either way.

## Three rules when editing a hook script

- **Portable to macOS BSD `sed`.** BSD sed supports neither `\s` nor `\b` — use
  POSIX classes (`[[:space:]]`) and explicit boundaries. `typescript:test`
  table-tests `npm-normalize.sh` through the system sed for exactly this, for
  both package managers, against `plugins/typescript/hooks/` — which is now both
  the source and what ships.
- **Plugin hooks are never written to `settings.json`.** They are
  auto-discovered from `hooks/hooks.json` and loaded in memory at session start.
  Verify active hooks with `/hooks`, not by inspecting `settings.json`.
- **The verdict shape follows the event.** There are two, and they are not
  interchangeable:

  | Event                | Denial                                                                  |
  | -------------------- | ----------------------------------------------------------------------- |
  | `PreToolUse`         | `hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision}` |
  | `Stop`, `PreCompact` | top-level `{"decision": "block", "reason": …}`                          |

  A `hookSpecificOutput` without a matching `hookEventName` makes Claude reject
  the **whole** verdict, and there is no variant of it that denies on `Stop`
  (its one field is `additionalContext`, which lets the stop through) or any
  variant at all on `PreCompact`. `mempalace-checkpoint.sh` shipped the
  `PreToolUse` spelling on a stop hook and was silently rejected every time — a
  rejected verdict is indistinguishable from a hook that chose to stay quiet,
  which is what let it survive.

## What retired with the other targets

Worth knowing only so you do not go looking for it: hooks used to be declared as
*intent* (`event`, `matcher`, `action`, `script`) in a `hooks.yaml`, with a
neutral event vocabulary in `schema/src/hooks.ts` and one emitter per target —
Claude's `updatedInput`, OpenCode a generated JS plugin mutating `output.args`,
Cursor and Oh-My-Pi a deny-with-correction because neither could rewrite a
command. Cursor had no compaction hook at all, reported as a coverage gap.

Gone with it: the `opencode-plugin/*.ts` modules (the mempalace autosave for the
one target the shell hooks skipped, and the statusline TUI feed), and the
`templates/` tsconfig project that existed only to type-check them.

A hook is now a thing another tool's agent adapts from `hooks.json` by the
prompt route, or does not get. `readme.md`'s "Other tools" section says so
plainly, and names the `rtk` rewrite as the concrete example of what a deny-only
hook system cannot express.
