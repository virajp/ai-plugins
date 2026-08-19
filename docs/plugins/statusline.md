# Statusline

A powerline-style
[Claude Code statusline](https://docs.claude.com/en/docs/claude-code/statusline)
installed by the `@askviraj/ai-plugins` CLI. One script drives **two surfaces**
— the main two-line status bar and the subagent panel — and everything it draws
is data-driven from JSON, so you can restyle it per repo without touching code.
Claude Code is the only agent it draws in; the two other bars this page used to
document are [discontinued](#discontinued-surfaces).

- Script: [`tools/statusline/statusline`](../../tools/statusline/statusline)
- Defaults:
  [`tools/statusline/statusline.json`](../../tools/statusline/statusline.json)
- Schema:
  [`schemas/statusline.schema.json`](../../schemas/statusline.schema.json)
- Caps hook:
  [`tools/statusline/context-caps.js`](../../tools/statusline/context-caps.js)

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
Homebrew tap and no Scoop bucket: what the package carries is a handful of files
that have to end up on disk — the script, the caps hook and the seeded config —
and `pnpx` already puts them there without a global install to keep current.
Windows runs the same `pnpx` command everyone else does.

**`--statusline` is the only way to ask for the bar.** The plugin flags
(`--all`, `--user`, `--project`) never bring the statusline along — a toolkit
install and choosing to replace your status bar are separate questions, asked
separately. Parsing is strict, so the retired `--platform` and `--upgrade` fail
naming themselves rather than being quietly ignored. `--no-statusline` remains,
and a run that asks for nothing at all prints the help and exits 1.

The one other flag that changes what happens here is `--force`. Writing a
`statusLine` key into `~/.claude/settings.json` for a Claude Code that is not on
the machine leaves config behind for something that will never read it, so a run
that cannot find `claude` on `PATH` stops and says so; `--force` is the
override, for a machine where Claude Code is installed somewhere off `PATH`.

The CLI then:

- copies the statusline script into `~/.claude/scripts/` (made executable),
- seeds `~/.config/statusline.json` with the bundled defaults — or, if it
  already exists, deep-merges any missing settings into it (your edits are
  preserved),
- writes both bar keys into `~/.claude/settings.json`, leaving any other
  settings untouched, and
- wires the [context & rate-limit caps hook](#context--rate-limit-caps-vwf).

The settings file follows `CLAUDE_CONFIG_DIR` where you have set one, because
that is where Claude Code reads it back from. The script and the hook do not:
the values written *into* settings name `${HOME}` literally and are expanded by
Claude Code at run time, so those two files land under `$HOME` wherever the
config itself lives.

### Consent before replacing a statusline you already have

If Claude Code is already pointed at a bar **this installer did not write**, the
run asks before overwriting it, naming what it found. The test is ownership, not
existence: a bar already running our command is one of our own earlier runs, so
a repeat install never asks about itself.

- **`--statusline` is consent**, and the only thing that is. It used to share
  the job with `--all`, which asked for the whole toolkit — and a toolkit that
  happens to include a status bar is not the same as choosing to replace the one
  you have. `--all` is back for plugins but **never installs the bar**, so
  **every statusline install run is explicit and this gate grants every time**;
  the branches that ask are kept rather than deleted, because the day anything
  other than the flag can trigger an install, deleting them would be the silent
  overwrite they exist to prevent.
- **With no terminal to ask in** — a setup script, CI, anything piping stdin —
  the run **fails** rather than guessing. Silently overwriting is the thing this
  gate exists to prevent, and silently skipping would let an unattended install
  report success with the bar unconfigured.
- **Declining is remembered.** Answering no writes `"autoConfigure": false` into
  `~/.config/statusline.json`, and later runs stop asking. The key is
  deliberately not per surface — it was one answer across the three bars this
  CLI used to install, so declining once was declining — and a machine still
  carrying one from then has it **cleared by the next `--statusline`**. That is
  the live path through this gate now: an old refusal being lifted.
- **The bar is installed either way.** Declining withholds only the
  `settings.json` keys pointing Claude at it — the script and the caps hook
  still land — so a declined machine is one `--statusline` from a working
  statusline rather than back at the start.

Whatever you allow is captured in the receipt, so `--uninstall` puts the
previous bar back byte for byte.

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
the main bar. Errors go to stderr so they never corrupt the line. Two
invocations read no payload: `--refresh-spend`, the background child described
under [Monthly spend budget](#monthly-spend-budget-spend), and `--version`.

### Checking which version you have

```sh
pnpx @askviraj/ai-plugins --version
```

Three things are reported: this CLI's own version against the latest on npm, the
**statusline on disk** against the one this run carries, and the plugins
`virajp-plugins` currently offers on `main`. It exits non-zero when the network
could not be reached, since a report that compared against nothing answered half
the question.

The statusline line is the one worth explaining, because it used to be wrong.
The script now **reports its own version** — `statusline --version` prints a
constant stamped into it by `i:version` at bump time, which `i:test` asserts
equals `package.json` — and the CLI runs the *installed* copy to ask. Before
that it printed the running package's version beside the bar, annotated "bundled
with the CLI"; under `pnpx` that is whatever was just downloaded, so the number
actually sitting in `~/.claude/scripts/` was never shown and a stale bar was
invisible. "Bundled" is now only ever context for the installed number rather
than the answer itself.

An install predating the flag reads as `unknown (predates self-reporting)`, and
the report tells you to re-run `--statusline`. That state is detected from the
*shape* of the answer, never the exit code: an old script does not recognise
`--version`, so it does what it always does with a payload-less run and renders
a bar, exiting 0 either way.

## Context & rate-limit caps (vwf)

Installing the status bar (`--statusline`) also wires a `PostToolUse` hook —
[`tools/statusline/context-caps.js`](../../tools/statusline/context-caps.js) —
that pauses long autonomous `vwf` runs before they exhaust a budget. It is
**bundled with `statusLine`** because it relies on that script as its sensor.

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
useful with the `vwf` plugin installed. Removing the statusline in `--uninstall`
takes the hook, its env var and the script with it.

## Discontinued surfaces

**If you have an Oh-My-Pi or an OpenCode status bar from this toolkit, it is no
longer maintained and no later install will put it back.** Both were
discontinued in the Claude-first release, and since this page is where you would
come looking, here is what happened to them.

"The statusline" was three installs of one idea, because none of those agents
offers the hook Claude Code does. Only Claude Code can be pointed at a script,
so only Claude Code ever ran the script this page documents. **Oh-My-Pi** has no
scriptable status surface at all — it ships a segment renderer, so the install
was four `omp config set` calls selecting its own segments to approximate ours.
**OpenCode** has neither a key nor a renderer, so the install copied a TUI
plugin (`ai-plugins-statusline.tsx`) into `~/.config/opencode/` and registered
it in `tui.json`; that plugin redrew the bar from OpenCode's own session state,
in OpenCode's own styling. Each was information parity at best, never visual
parity, and neither could carry the [caps hook](#context--rate-limit-caps-vwf) —
its sensor is the Claude bar, which mirrors `context_window` and `rate_limits`
to a usage file after every render, and nothing equivalent existed on either
side. **Cursor** exposes no status surface whatever, and never did; there is
nothing discontinued there because there was never anything to install.

**`--uninstall` still cleans them up.** Every receipt in the receipt directory
other than the statusline's is the record of an install by a multi-target
version of this CLI, and reading them back is the one piece of multi-target code
deliberately kept: without it a machine carrying those bars is orphaned rather
than cleaned, because nothing else knows those paths. So an uninstall lists them
under **Older multi-target installs**, and removing them does what the install's
own undo always did — each `omp config` key back to the value it held before
(and Oh-My-Pi's own caveat still applies: `omp config reset` writes the default
back as explicit YAML rather than removing the key, so one that was absent from
a `config.yml` you already had returns as its explicit default), the copied TUI
plugin deleted and its `tui.json` entry taken back out, deleting that file
outright if this CLI created it and otherwise restoring it key by key so a
plugin you registered yourself survives. A tool that is no longer on `PATH` is
skipped with a note rather than failing the run.

That reader is **kept for a release or two and then removed**, once no supported
version can have written one of those receipts. Until then it costs nothing and
it is the only migration path off the discontinued bars.

## Configuration

Everything from here down describes the script Claude Code runs.

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
| `spend`           | object          | The monthly-budget segment: `refreshMinutes`, `show` (see below).                                              |
| `lines`           | array of rows   | The layout (see below).                                                                                        |
| `subagent`        | object          | The subagent panel config (see below).                                                                         |

`symbols` keys consumed by the script: `model`, `context`, `win5h`, `win7d`,
`reset`, `session`, `cost`, `spend`, `duration`, `project`, `worktree`,
`folder`, `branch`, `ahead`, `dirtyAdd`, `dirtyDel`, `dirtyMix`, `agent`,
`tokens`.

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

Available segment ids: `model`, `context`, `rl5h`, `rl7d`, `spend`, `session`,
`cost`, `duration`, `project`, `worktree`, `branch`. Several render
conditionally and disappear when their data is absent (e.g. `session` with no
session name, `project` with no `projectName`, `worktree`/`branch` outside a
repo).

```json
"lines": [
  ["model", "context", "rl5h", "rl7d", "spend", "cost"],
  ["project", "worktree", "branch"]
]
```

### Monthly spend budget (`spend`)

The `spend` segment shows the account's monthly budget — the gauge from
claude.ai → Settings → Usage — as `$75.93/$150 (51%)`. It exists for the seats
whose limit is a **monthly spend cap** rather than the 5-hour/7-day windows:
team and enterprise plans, for whom `rl5h`/`rl7d` have nothing to render.

It is in the default layout but renders **only on team/enterprise plans** (read
from the plan tag in Claude Code's stored credentials), so everyone else sees no
change. One caveat for a machine installed before the segment existed: the
installer never rewrites a config key you already have, and `lines` is one you
do — so an existing seeded config keeps its old layout, and adopting the segment
there means adding `"spend"` to a row yourself. Two knobs, under the top-level
`spend` key:

| Key              | Default  | Purpose                                                                                                                               |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `refreshMinutes` | `15`     | Minimum minutes between fetches — the file-based timer. `0` disables the background refresh (the segment renders whatever is cached). |
| `show`           | `"auto"` | `"auto"` renders only for team/enterprise seats; `"always"` renders whenever budget data exists — e.g. a Pro/Max extra-usage cap.     |

Where the number comes from, and why it is cached: Claude Code's statusline
payload carries **no** spend fields — only the Pro/Max rate-limit windows — so
the script asks the same OAuth usage endpoint Claude Code's own `/usage` command
uses, authenticating with the OAuth token Claude Code already stores
(`~/.claude/.credentials.json` where that file exists, else the macOS keychain,
whose first read may prompt once). That endpoint throttles on **accumulated**
usage — an account that trips it stays rate-limited for half an hour or more —
and the bar can re-render every few seconds, so a render **never fetches**:

- Results land in one **machine-global cache**
  (`~/.cache/ai-plugins/spend.json`, override with `$AI_PLUGINS_SPEND_CACHE`),
  shared by every session and worktree — one fetch per interval per machine,
  however many bars are running.
- When the cache is older than `refreshMinutes`, the render spawns a
  **detached** refresh and draws the cached value now; a lock file keeps the
  refresh single-flight across concurrent sessions. On a plan `auto` draws
  nothing for, that timer stretches to once a day, so a Pro/Max machine checks
  daily rather than every quarter-hour.
- A 429 records an exponential backoff (doubling from the interval, capped at
  six hours) and the bar keeps showing the last good value. A missing token or a
  network failure just leaves the cache as it was.

The endpoint is the one Claude Code itself uses but is **not publicly
documented**, so the segment degrades to invisible if its shape changes.
Dropping `spend` from `lines` switches the whole mechanism off — the cache is
read, and a refresh spawned, only when the layout names the segment.

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

# spend refresh — one-shot fetch into a cache file of your choosing, renders nothing
AI_PLUGINS_SPEND_CACHE=/tmp/spend.json node tools/statusline/statusline --refresh-spend && cat /tmp/spend.json
```

## See also

- [../../readme.md](../../readme.md) — the marketplace overview and the
  installer CLI this ships inside.
- [vwf](./vwf.md) — the workflow the caps hook pauses, and the `/vwf:handoff` /
  `/vwf:recall next` pair it directs you to.
