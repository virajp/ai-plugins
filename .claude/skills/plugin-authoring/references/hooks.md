# Hooks

Hooks are authored as **intent** in each plugin's `hooks/hooks.yaml` — `event`,
`matcher`, `action`, `script` — so every renderer emits its own mechanism. For a
`PreToolUse` / `Bash` rewrite that means Claude gets a `hooks.json` with
`updatedInput`, OpenCode a generated JS plugin mutating `output.args`, and
Cursor and Oh-My-Pi a deny-with-correction, since neither can rewrite a command.

## The neutral events

`schema/src/hooks.ts` holds the vocabulary. Two of them exist for the mempalace
auto-save:

| Neutral      | Claude       | Oh-My-Pi                 | Cursor                  |
| ------------ | ------------ | ------------------------ | ----------------------- |
| `stop`       | `Stop`       | `session_stop`           | `stop`                  |
| `preCompact` | `PreCompact` | `session_before_compact` | **none** — gap-reported |

Cursor has no compaction hook at all; that is reported as a gap rather than
silently dropped.

Oh-My-Pi's renderer grew a **session-shaped wrapper variant** for these. A
session event carries `{session_id, stop_hook_active}` rather than
`{tool_name, tool_input}`, and its answer is `additionalContext` under
`continue: true` rather than `reason` under `block: true`.

## What ships today

- `templates/typescript/hooks/npm-normalize.sh` — rewrites `npm`/`npx` to the
  repo's package manager. Exactly two are allowed for JS/TS, **pnpm** and
  **bun**, and the hook resolves which by walking up from cwd for a lockfile
  (`bun.lock`/`bun.lockb` → bun, `pnpm-lock.yaml` → pnpm), then a
  `package_manager: bun` line in `.config/vwf.yaml`, then defaulting to pnpm.
  The lockfile is ground truth because bun reuses npm's `workspaces` field, so
  nothing else distinguishes them. It lives in the **language** plugin, not vwf:
  a JS/TS rewrite is a TypeScript fact, and vwf names no technology.
- `templates/vwf/hooks/hooks.yaml` → `rtk hook claude`, vwf's only `Bash` hook
  and **optional**. The entry is guarded
  (`command -v rtk >/dev/null 2>&1 && rtk hook claude || true`) so a missing
  `rtk` never blocks a Bash call; `/vwf:doctor` carries the warning instead,
  because a per-command warning would be unusable noise.
- `templates/vwf/hooks/mempalace-checkpoint.sh` (`stop`) and
  `mempalace-precompact.sh` (`preCompact`) — the mempalace auto-save, **written
  here rather than vendored**. Upstream's counts human messages by parsing a
  Claude JSONL transcript and breaks its own loop with `stop_hook_active`, both
  Claude-only — wrapping it for the other targets would yield a hook that runs,
  finds no transcript and does nothing: green in the coverage report, dead in
  practice. Counting *stops* in a state file under
  `$XDG_STATE_HOME/ai-plugins/mempalace` needs only a session id, which every
  target supplies. It speaks every 15th stop (`MEMPALACE_SAVE_INTERVAL`
  overrides), honours mempalace's own opt-out (`MEMPALACE_HOOKS_AUTO_SAVE`, or
  `hooks.auto_save` in `~/.mempalace/config.json`), and resets the counter on
  `stop_hook_active: true` so a save cycle cannot re-trigger itself. The
  pre-compact half is a **second file** that `exec`s the first with `--compact`,
  because the neutral schema names a script and passes it no arguments.
- `templates/vwf/opencode-plugin/mempalace-autosave.ts` — the same behaviour for
  the one target the shell hooks skip (`skipTargets: [ opencode ]`). OpenCode
  has no stop to block; its equivalent surface is a bus event plus a server API
  you inject a message into, so this counts real user messages on `session.idle`
  and re-saves after `session.compacted`.

## OpenCode plugin modules

`opencode-plugin/*.{ts,js}` exists for behaviour no neutral hook can express.
`source.ts` reads them into `openCodePlugins`, deliberately **not** into
`files`, so the other three targets never ship them as dead bundle files; the
OpenCode target copies each to `plugin/<plugin>-<basename>` with an ownership
stamp, so the existing install/uninstall/receipt machinery covers them with no
adapter change.

They ship as **authored TypeScript, untranspiled** — verified against OpenCode's
source: its discovery glob is `{plugin,plugins}/*.{ts,js}` and its loader is
Bun. No transform, no new dependency. The `templates/` tsconfig project exists
solely to type-check them (`include: */opencode-plugin/*.ts`); the rest of
`templates/` is prose.

## Two rules when editing a hook script

- **Portable to macOS BSD `sed`.** BSD sed supports neither `\s` nor `\b` — use
  POSIX classes (`[[:space:]]`) and explicit boundaries. `typescript:test`
  table-tests `npm-normalize.sh` through the system sed for exactly this, for
  both package managers, against `templates/typescript/hooks/` — hook scripts
  are copied byte for byte rather than rendered, so the source is exactly what
  every target ships.
- **Plugin hooks are never written to `settings.json`.** They are
  auto-discovered from the rendered `hooks/hooks.json` and loaded in memory at
  session start. Verify active hooks with `/hooks`, not by inspecting
  `settings.json`.
