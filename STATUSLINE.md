# Statusline

A powerline-style
[Claude Code statusline](https://docs.claude.com/en/docs/claude-code/statusline)
that ships with the `vwf` plugin. One script drives **two surfaces** — the main
two-line status bar and the subagent panel — and everything it draws is
data-driven from JSON, so you can restyle it per repo without touching code.

- Script: [`plugins/vwf/bin/statusline`](plugins/vwf/bin/statusline)
- Defaults: [`plugins/vwf/bin/statusline.json`](plugins/vwf/bin/statusline.json)
- Schema:
  [`plugins/vwf/schemas/statusline.schema.json`](plugins/vwf/schemas/statusline.schema.json)

> **Requires a [Nerd Font](https://www.nerdfonts.com/).** The separators and
> most symbols are private-use glyphs; without a patched font they render as
> boxes.

## What it looks like

```text
⚡ Opus 4.8 [high]   ▰▰▰▱▱▱▱▱▱▱ 259k/1M (26%)   7.0% ↻ 4h36m   1.0% ↻ 5d2h   users-and-groups   46.51
my-project   🌲  users-and-groups/backend   🌲  feat/users-and-groups +
```

## Wiring it up

Point both statusline keys at the script in `~/.claude/settings.json` (or a
project `.claude/settings.json`). Replace the path with the installed plugin
location:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /absolute/path/to/plugins/vwf/bin/statusline",
    "padding": 0
  },
  "subagentStatusLine": {
    "type": "command",
    "command": "node /absolute/path/to/plugins/vwf/bin/statusline"
  }
}
```

The script reads the Claude Code payload on stdin and detects the surface: a
payload with a `tasks` array renders the subagent panel, anything else renders
the main bar. Errors go to stderr so they never corrupt the line.

## Configuration

Configuration is layered. Two files are deep-merged at render time:

1. **Defaults** — `statusline.json` next to the script. Holds **every**
   constant: palette, separators, symbols, per-segment styling, the line layout,
   and the whole subagent panel. This is the baseline for everyone.
2. **Per-repo overrides** — `<repo-root>/.config/statusline.json`. Merged on top
   of the defaults.

Merge semantics: **objects merge key-by-key, arrays replace wholesale.** So a
repo can set just `repo` and `symbol` and inherit everything else, override a
single nested value (one segment's `bg`, one symbol, the gauge width, a status
colour), or replace `lines` entirely.

Add the published schema for editor autocompletion and validation (already
present in the defaults):

```json
"$schema": "https://raw.githubusercontent.com/virajp/ai-plugins/main/plugins/vwf/schemas/statusline.schema.json"
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

| Key               | Type            | Purpose                                                                                      |
| ----------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `repo` / `name`   | string          | Project display name for the `project` segment. Unset → a shortened cwd is shown.            |
| `symbol`          | string          | Glyph before the project name. Defaults to `symbols.repo`.                                   |
| `palette`         | map<name,RGB>   | Named colours as `[r,g,b]` triples.                                                          |
| `powerline`       | object          | Divider glyphs: `sep`, `sepThin`, `cap`, and `thinFg` (colour of the thin divider).          |
| `defaultFg`       | colour          | Foreground for segments that don't set their own `fg`.                                       |
| `gauge`           | object          | The `context` meter: `width`, `filled` glyph, `empty` glyph.                                 |
| `worktreePattern` | regex string    | Path component that marks a git worktree; the subpath after it feeds the `worktree` segment. |
| `symbols`         | map<key,glyph>  | Glyph per data type (see below).                                                             |
| `typeSymbols`     | map<type,glyph> | Subagent `type` → glyph; `_default` is the fallback.                                         |
| `segments`        | map<id,style>   | Default styling (`bg`/`fg`/`bold`) per main-bar segment.                                     |
| `lines`           | array of rows   | The layout (see below).                                                                      |
| `subagent`        | object          | The subagent panel config (see below).                                                       |

`symbols` keys consumed by the script: `model`, `context`, `win5h`, `win7d`,
`reset`, `session`, `cost`, `duration`, `repo`, `worktree`, `folder`, `branch`,
`dirtyAdd`, `dirtyDel`, `dirtyMix`, `agent`, `tokens`.

### Lines and segments

`lines` is a list of rows; each row is a list of segment entries. An entry is
either a **segment id string** or an **object** `{ name, bg?, fg?, bold? }` that
overrides that segment's styling inline. Both resolve their default styling from
the `segments` map. A row that resolves to no visible segments is dropped.

Available segment ids: `model`, `context`, `rl5h`, `rl7d`, `session`, `cost`,
`duration`, `project`, `worktree`, `branch`. Several render conditionally and
disappear when their data is absent (e.g. `session` with no session name,
`worktree`/`branch` outside a repo).

```json
"lines": [
  ["model", "context", "rl5h", "rl7d", "session", "cost"],
  ["project", "worktree", "branch"]
]
```

### Subagent panel

The `subagent` block configures the panel surface:

| Key                  | Purpose                                                                                        |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `descBudgetFraction` | Fraction of terminal width given to the description before it's truncated (default `0.45`).    |
| `statuses`           | Status buckets, tried in order. First whose `match` regex hits wins; empty `match` = fallback. |
| `segments`           | Styling for each row segment: `head`, `model`, `desc`, `tokens`, `duration`.                   |

Each `statuses` entry is `{ match, symbol, bg }` — `match` is a case-insensitive
regex against the lower-cased task status, `symbol` is the status glyph, and
`bg` colours the head segment. The head segment's background always comes from
the matched status.

## Examples

**Just rename the project, keep everything else:**

```json
{
  "$schema": "https://raw.githubusercontent.com/virajp/ai-plugins/main/plugins/vwf/schemas/statusline.schema.json",
  "repo": "my-project",
  "symbol": ""
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
echo '{"model":{"display_name":"Opus 4.8"},"effort":{"level":"high"},"cost":{"total_cost_usd":46.51,"total_duration_ms":33540000},"context_window":{"used_percentage":26,"context_window_size":1000000,"total_input_tokens":259000},"rate_limits":{"five_hour":{"used_percentage":7,"resets_at":1774200000},"seven_day":{"used_percentage":1.0,"resets_at":1774600000}}}' | node plugins/vwf/bin/statusline

# subagent panel
echo '{"columns":120,"tasks":[{"id":"t1","name":"reviewer","type":"review","status":"running","description":"Auditing auth flow","tokenCount":18234,"startTime":1774200000000}]}' | node plugins/vwf/bin/statusline
```
