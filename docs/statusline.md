# Statusline

A powerline-style
[Claude Code statusline](https://docs.claude.com/en/docs/claude-code/statusline)
installed by the `@askviraj/ai-plugins` CLI. One script drives **two surfaces**
— the main two-line status bar and the subagent panel — and everything it draws
is data-driven from JSON, so you can restyle it per repo without touching code.
The same flag brings the same information to [Oh-My-Pi](#oh-my-pi) and
[OpenCode](#opencode), each through its own mechanism.

- Script: [`tools/statusline/statusline`](../tools/statusline/statusline)
- Defaults:
  [`tools/statusline/statusline.json`](../tools/statusline/statusline.json)
- Schema: [`schemas/statusline.schema.json`](../schemas/statusline.schema.json)
- Caps hook:
  [`tools/statusline/context-caps.js`](../tools/statusline/context-caps.js)
- OpenCode TUI plugin:
  [`tools/statusline/opencode-tui.tsx`](../tools/statusline/opencode-tui.tsx)

> **Requires a [Nerd Font](https://www.nerdfonts.com/).** The separators and
> most symbols are private-use glyphs; without a patched font they render as
> boxes.

## What it looks like

![Statusline rendered in a terminal](./how-it-looks.png)

## Wiring it up

Run the installer with `pnpx` — no global install needed:

```sh
# install the statusline — both the main bar and the subagent panel
pnpx @askviraj/ai-plugins --statusline
```

**npm is the only channel.** There is deliberately no standalone binary, no
Homebrew tap and no Scoop bucket: a binary here could never be self-contained,
because the marketplace targets re-read a real rendered directory on every later
session, so the payload has to sit on disk beside the executable rather than
inside it. Windows runs the same `pnpx` command everyone else does.

`--all` installs the whole toolkit and so brings the statusline with it; pass
`--no-statusline` alongside it for a plugins-only run.

On Claude Code, the CLI:

- copies the statusline script into `~/.claude/scripts/` (made executable),
- seeds `~/.config/statusline.json` with the bundled defaults — or, if it
  already exists, deep-merges any missing settings into it (your edits are
  preserved),
- writes the requested key(s) into `~/.claude/settings.json`, leaving any other
  settings untouched, and
- whenever the main bar is installed, wires the
  [context & rate-limit caps hook](#context--rate-limit-caps-vwf).

If a target key already exists, the CLI prints the current value and asks before
overwriting. Pass `--yes` (`-y`) to overwrite without prompting.

Everything above describes the **Claude Code** surface (it lives under
`~/.claude`). The CLI drives four targets — `claude`, `cursor`, `ohmypi` and
`opencode` — and `--statusline` installs whichever surfaces the selected targets
have: the script bar for Claude Code, [Oh-My-Pi's own status line](#oh-my-pi)
for `ohmypi`, a [TUI plugin](#opencode) for `opencode`. **Cursor** is the one
target exposing none, so on a run reaching only it (`--platform cursor`)
`--statusline` is skipped with a note. The note is printed only when you asked
for it **explicitly**, so a bare `--all` on a Cursor-only machine stays quiet.

The blocks it writes:

```json
{
  "statusLine": {
    "type": "command",
    "command": "${HOME}/.claude/scripts/statusline",
    "padding": 0,
    "refreshInterval": 4
  },
  "subagentStatusLine": {
    "type": "command",
    "command": "${HOME}/.claude/scripts/statusline"
  }
}
```

The script reads the Claude Code payload on stdin and detects the surface: a
payload with a `tasks` array renders the subagent panel, anything else renders
the main bar. Errors go to stderr so they never corrupt the line.

## Context & rate-limit caps (vwf)

Installing the **main** status bar (`--statusline`, or `--all`) also wires a
`PostToolUse` hook —
[`tools/statusline/context-caps.js`](../tools/statusline/context-caps.js) — that
pauses long autonomous `vwf` runs before they exhaust a budget. It is **bundled
with `statusLine`** because it relies on that script as its sensor.

How it works: the main bar already receives `context_window` and `rate_limits`
on its stdin payload — numbers a hook never sees. The script mirrors them, per
session, to `$AI_PLUGINS_USAGE_DIR/<session_id>.json` (the installer sets
`AI_PLUGINS_USAGE_DIR` to `${HOME}/.claude/usage`). After each tool call the
hook reads that file and, when a cap is breached, tells the agent to snapshot
via `/vwf:handoff` — with no argument, so it writes the reserved `next` handoff
to both mempalace and `docs/memory/handoff/next.md` — and halt:

| Cap            | Threshold | Action                                                          |
| -------------- | --------- | --------------------------------------------------------------- |
| Context window | > 65%     | handoff, then `/clear` (or `/compact`) + `/vwf:recall next`     |
| 5-hour limit   | > 90%     | handoff, then pause until reset; resume with `/vwf:recall next` |
| 7-day limit    | > 80%     | handoff, then stop with the reset time                          |

A repo may **tighten** (never loosen) these thresholds via its vwf config —
`.config/vwf.yaml`, keys `pipeline.execute_caps.context` / `.five_hour` /
`.seven_day` (the legacy `pipeline.autopilot_caps` name is still honored) — the
hook reads the session's working directory and clamps any value above the
shipped defaults.

A hook can't clear context or invoke slash commands, so resuming is one
keystroke from you. The hook is **inert** until the main bar runs (no usage file
is written otherwise) and its directives reference `vwf` commands, so it's only
useful with the `vwf` plugin installed. `--uninstall --statusline` removes the
hook, its env var, and the script.

## Oh-My-Pi

Oh-My-Pi exposes no scriptable status surface — there is no key to point at a
script of ours. It ships a segment renderer instead, so `--statusline` on a run
targeting `ohmypi` configures **that**, through four `omp config set` calls:

```sh
omp config set statusLine.preset custom
omp config set statusLine.leftSegments '["model","path","git"]'
omp config set statusLine.rightSegments '["context_pct","usage","cost","time_spent"]'
omp config set statusLine.segmentOptions '{"model":{"showThinkingLevel":true},"path":{"abbreviate":true,"maxLength":40,"stripWorkPrefix":true},"git":{"showBranch":true,"showStaged":true,"showUnstaged":true,"showUntracked":true}}'
```

`preset: custom` is what makes the other three take effect; the named presets
ignore the segment lists entirely. Everything lands in Oh-My-Pi's global
`config.yml` (under `$HOME/.omp/agent`, or wherever `PI_CODING_AGENT_DIR`
points), written by `omp` itself — this CLI never opens it.

**Information parity, not visual parity.** The powerline styling is deliberately
dropped: the separators and palette are Oh-My-Pi's, and reproducing ours would
mean fighting a renderer we do not own. What is mirrored is the *content* of the
Claude bar:

| Claude bar            | Oh-My-Pi      | Note                                   |
| --------------------- | ------------- | -------------------------------------- |
| `model` (+ `effort`)  | `model`       | `showThinkingLevel` carries the effort |
| `project`, `worktree` | `path`        | abbreviated, work prefix stripped      |
| `branch`              | `git`         | built in there; we shell out to git    |
| `context`             | `context_pct` | already carries the total              |
| `cost`                | `cost`        |                                        |
| `duration`            | `time_spent`  | active agent time, not wall clock      |
| `rl5h` + `rl7d`       | `usage`       | **not an equivalent** — see below      |

`usage` is the closest available and is **not** the same reading: Oh-My-Pi
exposes no Anthropic 5-hour / 7-day window percentages, and what `usage` reports
is provider-dependent. That is a known gap, not parity.

**Two segments are deliberately not carried, and both are width decisions.** The
bar is one line and Oh-My-Pi pads every segment, so a segment costs space
whether or not it says anything new:

- **`context_total` is redundant, not missing.** `context_pct` renders the
  window alongside the percentage (`7.1%/1M`), and `context_total` renders that
  same window and nothing else — so the pair drew `1M` twice.
- **`session_name` is dropped for width.** It is the one segment whose length is
  unbounded: a session title runs to a full sentence and crowded the numeric
  segments off the line. The Claude and OpenCode bars keep theirs; this is the
  one place the three diverge on content rather than styling.

The **caps hook is not installed here**, for the same reason: its sensor is the
Claude bar, which mirrors `context_window` and `rate_limits` to a usage file
after every render. Nothing equivalent exists on this side.

`--uninstall --statusline` puts each key back to the value it had before the
install — read with `omp config get` first, and recorded only for keys that
actually changed, so a setting you chose yourself is never overwritten by an
uninstall that changed nothing. One caveat, and it is Oh-My-Pi's:
`omp config reset` does not *remove* a key, it writes the default back as
explicit YAML. So a key that was absent from a `config.yml` you already had
comes back as its explicit default — semantically identical, a couple of lines
longer. A `config.yml` that did not exist at all is deleted outright, which is
the ordinary case.

If `omp` is not on `PATH`, this is skipped with a note rather than failing — the
same rule the plugin targets follow.

## OpenCode

OpenCode has neither a config key to point at a script nor a status renderer to
configure. What it has is an **extension point**: a TUI plugin can register a
slot, and `app_bottom` is the bottom row. So `--statusline` on a run targeting
`opencode` copies
[`tools/statusline/opencode-tui.tsx`](../tools/statusline/opencode-tui.tsx) into
the OpenCode config dir as `ai-plugins-statusline.tsx` and registers it:

```jsonc
// ~/.config/opencode/tui.json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./ai-plugins-statusline.tsx"],
}
```

Three things about that are worth knowing, none of which the published docs get
right:

- **`tui.json` is a different file from `opencode.json`.** OpenCode routes
  plugins by kind — a `server` plugin goes in `opencode.json`, everything else
  in `tui.json`. An entry in the wrong one is accepted and never loaded.
- **TUI plugins are not auto-discovered.** The `{plugin,plugins}/*.{ts,js}` glob
  that picks up server plugins (vwf's mempalace auto-save among them) does not
  reach them. The `tui.json` entry *is* the registration.
- **There is no build step.** The plugin ships as authored `.tsx`. OpenCode's
  loader is Bun: it honours the `@jsxImportSource` pragma and resolves both
  `@opentui/solid` and `@opencode-ai/plugin/tui` itself, so nothing is
  transpiled, bundled, or installed alongside it.

**Information parity, not visual parity** — the same trade as Oh-My-Pi, for the
same reason. OpenCode owns the frame and the palette, so the line is drawn with
its styling and none of ours:

| Claude bar            | OpenCode                                | Note                                      |
| --------------------- | --------------------------------------- | ----------------------------------------- |
| `model` (+ `effort`)  | `session.get(id).model`                 | `variant` is the nearest thing to effort  |
| `context`             | last assistant `tokens` ÷ model `limit` | summed here; a single number there        |
| `cost`                | `session.get(id).cost`                  |                                           |
| `duration`            | `session.get(id).time`                  | **wall clock**, not Claude's active time  |
| `session`             | `session.get(id).title`                 |                                           |
| `project`, `worktree` | `state.path()`                          | worktree basename + the subpath inside it |
| `branch`              | `state.vcs().branch`                    | branch only — no dirty or ahead counts    |
| `rl5h` + `rl7d`       | **omitted**                             | no ambient rate-limit state — see below   |

Two of those rows are gaps rather than translations, and both are deliberate:

- **The rate-limit windows are omitted, not approximated.** OpenCode exposes no
  ambient rate-limit state at all — it parses provider headers on error paths
  and nowhere else. Oh-My-Pi at least has a `usage` segment to record as a known
  gap; here there is nothing to point at, and a made-up number would be worse
  than a missing one.
- **The branch carries no dirty or ahead marks.** `state.vcs()` returns the
  branch and the default branch, and that is all. The Claude bar gets the rest
  by shelling out to git, which this must not do: the slot renders on every
  frame, and a `git` process per frame is not a status line.

The **caps hook is not installed here** either, for the Oh-My-Pi reason: its
sensor is the Claude bar, which mirrors `context_window` and `rate_limits` to a
usage file after every render.

`--uninstall --statusline` removes the copied plugin and takes the entry back
out of `tui.json` — deleting the file outright if this CLI created it, and
otherwise restoring it key by key so a TUI plugin you registered yourself
survives. If `opencode` is not on `PATH`, the install is skipped with a note
rather than failing.

## Configuration

Everything from here down describes the **Claude Code** script. Oh-My-Pi's
status line is configured through `omp config`, and OpenCode's is a TUI plugin
with no configuration of its own — neither reads these files.

Configuration is layered. Two files are deep-merged at render time, in
increasing precedence (a higher layer overrides the same key in a lower one):

1. **Per-user** (lowest) — `~/.config/statusline.json`. The installer seeds this
   with the **full** default config (palette, symbols, per-segment styling, line
   layout, subagent panel, …) and, on re-run, deep-merges any settings you're
   missing while preserving your edits. This is your global, editable config and
   the source of all defaults.
2. **Per-repo overrides** (highest) — `<repo-root>/.config/statusline.json`.

Either layer may be absent. Merge semantics: **objects merge key-by-key, arrays
replace wholesale.** So a repo (or user) can set just `projectName` and inherit
everything else, override a single nested value (one segment's `bg`, one symbol,
the gauge width, a status colour), or replace `lines` entirely.

Add the published schema for editor autocompletion and validation (already
present in the defaults):

```json
"$schema": "https://raw.githubusercontent.com/virajp/ai-plugins/main/schemas/statusline.schema.json"
```

### Colours

Anywhere a colour is expected you can use one of three forms:

| Form         | Example               |
| ------------ | --------------------- |
| Palette name | `"blue"`              |
| Hex string   | `"#458588"`, `"#abc"` |
| RGB triple   | `[69, 133, 136]`      |

Palette names resolve against the `palette` map, so define a name once and reuse
it everywhere.

### Top-level keys

| Key               | Type            | Purpose                                                                                                        |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| `projectName`     | string          | Project display name for the `project` segment (glyph from `symbols.project`). Unset → the segment is omitted. |
| `palette`         | map<name,RGB>   | Named colours as `[r,g,b]` triples.                                                                            |
| `powerline`       | object          | Divider glyphs: `sep`, `sepThin`, `cap`, and `thinFg` (colour of the thin divider).                            |
| `defaultFg`       | colour          | Foreground for segments that don't set their own `fg`.                                                         |
| `gauge`           | object          | The `context` meter: `width`, `filled` glyph, `empty` glyph.                                                   |
| `worktreePattern` | regex string    | Path component that marks a git worktree; the subpath after it feeds the `worktree` segment.                   |
| `symbols`         | map<key,glyph>  | Glyph per data type (see below).                                                                               |
| `typeSymbols`     | map<type,glyph> | Subagent `type` → glyph; `_default` is the fallback.                                                           |
| `segments`        | map<id,style>   | Default styling (`bg`/`fg`/`bold`) per main-bar segment.                                                       |
| `lines`           | array of rows   | The layout (see below).                                                                                        |
| `subagent`        | object          | The subagent panel config (see below).                                                                         |

`symbols` keys consumed by the script: `model`, `context`, `win5h`, `win7d`,
`reset`, `session`, `cost`, `duration`, `project`, `worktree`, `folder`,
`branch`, `ahead`, `dirtyAdd`, `dirtyDel`, `dirtyMix`, `agent`, `tokens`.

The `branch` segment appends markers after the branch name: `ahead` (default
`↑`) when the branch is ahead of its upstream — i.e. there are local commits not
yet pushed — followed by the dirty marker (`dirtyAdd`/`dirtyDel`/`dirtyMix`).
Each is shown only when it applies; `ahead` is omitted when the branch is in
sync or has no upstream.

### Lines and segments

`lines` is a list of rows; each row is a list of segment entries. An entry is
either a **segment id string** or an **object** `{ name, bg?, fg?, bold? }` that
overrides that segment's styling inline. Both resolve their default styling from
the `segments` map. A row that resolves to no visible segments is dropped.

Available segment ids: `model`, `context`, `rl5h`, `rl7d`, `session`, `cost`,
`duration`, `project`, `worktree`, `branch`. Several render conditionally and
disappear when their data is absent (e.g. `session` with no session name,
`project` with no `projectName`, `worktree`/`branch` outside a repo).

```json
"lines": [
  ["model", "context", "rl5h", "rl7d", "session", "cost"],
  ["project", "worktree", "branch"]
]
```

### Subagent panel

The `subagent` block configures the panel surface:

| Key                  | Purpose                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `descBudgetFraction` | Fraction of terminal width given to the description before it's truncated (default `0.45`).                                                     |
| `statuses`           | Status buckets, tried in order. First whose `match` regex hits wins; empty `match` = fallback.                                                  |
| `segments`           | Styling per row segment: `head` (status + type glyph), `name` (subagent name, falling back to its type), `model`, `desc`, `tokens`, `duration`. |

Each `statuses` entry is `{ match, symbol, bg }` — `match` is a case-insensitive
regex against the lower-cased task status, `symbol` is the status glyph, and
`bg` colours the head segment. The head segment's background always comes from
the matched status; the subagent `name` renders as its own segment (styled via
`subagent.segments.name`) when the task has a name.

## Examples

**Just rename the project (and change its glyph), keep everything else:**

```json
{
  "$schema": "https://raw.githubusercontent.com/virajp/ai-plugins/main/schemas/statusline.schema.json",
  "projectName": "my-project",
  "symbols": { "project": "" }
}
```

**Override one segment's colour and the gauge width:**

```json
{
  "segments": { "model": { "bg": "#d65d0e" } },
  "gauge": { "width": 16 }
}
```

**Replace the layout (arrays replace wholesale):**

```json
{
  "lines": [["model", "context", "cost"], ["branch"]]
}
```

**Recolour a subagent status:**

```json
{
  "subagent": {
    "statuses": { "running": { "bg": "purple" } },
    "segments": { "desc": { "bg": "grey" } }
  }
}
```

## Testing locally

```sh
# main bar
echo '{"model":{"display_name":"Opus 4.8"},"effort":{"level":"high"},"cost":{"total_cost_usd":46.51,"total_duration_ms":33540000},"context_window":{"used_percentage":26,"context_window_size":1000000,"total_input_tokens":259000},"rate_limits":{"five_hour":{"used_percentage":7,"resets_at":1774200000},"seven_day":{"used_percentage":1.0,"resets_at":1774600000}}}' | node tools/statusline/statusline

# subagent panel
echo '{"columns":120,"tasks":[{"id":"t1","name":"reviewer","type":"review","status":"running","description":"Auditing auth flow","tokenCount":18234,"startTime":1774200000000}]}' | node tools/statusline/statusline
```

## See also

- [../readme.md](../readme.md) — the marketplace overview and the installer CLI
  this ships inside.
- [vwf](./vwf.md) — the workflow the caps hook pauses, and the `/vwf:handoff` /
  `/vwf:recall next` pair it directs you to.
