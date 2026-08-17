# Statusline

The statusline is **not a plugin** — it ships inside `@askviraj/ai-plugins` and
is wired straight from the router, each surface with **its own receipt file**,
so uninstalling one never touches another.

**"The statusline" is three installs of one idea**, because each target offers a
different kind of hook and none of them offers ours. In the two non-Claude
surfaces the target is **information parity, not visual parity**: the same
segments, drawn with their separators and palette. **Cursor exposes no status
surface at all**, so a run targeting only it installs nothing — and only an
*explicit* `--statusline` on such a run prints the skip note.

| Surface  | Mechanism                                            | Installer                        |
| -------- | ---------------------------------------------------- | -------------------------------- |
| Claude   | a config key → the powerline script + the caps hook  | `cli/src/statusline.ts`          |
| Oh-My-Pi | four `omp config set` keys against its own renderer  | `cli/src/statusline-ohmypi.ts`   |
| OpenCode | a TUI plugin copied into the config dir + `tui.json` | `cli/src/statusline-opencode.ts` |

`omp` or `opencode` missing from `PATH` is a skip with a note, not a failure —
the same rule the plugin targets follow. The OpenCode **uninstall** needs no
binary, since everything it wrote is files this CLI owns.

## The consent gate

`cli/src/statusline-consent.ts`. **Installing the bar and configuring the host
tool are separate**, and only the second is gated. The private `run` in
`statusline.ts` and `statusline-opencode.ts` takes a `configure` flag and drops
its last step when it is false, so a declined surface still lands the script,
the caps hook and the TUI plugin. **Oh-My-Pi has no install half at all** — it
is `omp config` keys and no files — so declining skips that surface outright.
That is a property of the target, not a choice.

This reinstates a prompt that was **deliberately removed**, and the reasoning
that removed it is worth keeping straight. `statusline.ts` argued the old
`bin/claude.mjs` prompted only because it could not put the previous bar back,
and the receipt made that unnecessary. True of the *undo*; never true of the
interval before it. **Reversibility is not consent.**

Three rules, in `resolveConsent` — a pure function, so every branch is testable
without a terminal:

- **Ours is not foreign.** Compare what is on disk against what our own write
  would produce, never `existsSync`. Same ownership rule as the receipt entries,
  same reason: on run 2 what is sitting there is run 1's own output. Skip this
  and every repeat run prompts about the bar it installed itself.
- **`--statusline` is the only consent.** `--all` asks for the toolkit; that is
  not the same as asking to replace a bar. Checked **before** the remembered
  refusal, or the flag could never undo one.
- **No TTY fails the run.** Not overwrite, not skip. Overwriting silently is the
  bug; skipping silently makes an unattended install report success with the bar
  unconfigured.

A refusal is remembered as `"autoConfigure": false` in
`~/.config/statusline.json` — **one flag for all three surfaces**, and the key
is declared in `schemas/statusline.schema.json`, which sets
`additionalProperties: false`, so an undeclared key would show as an error in
the user's editor forever. `setAutoConfigure(ctx, true)` *deletes* the key
rather than writing `true`: absent is the default, and a stray `true` says
nothing.

Foreign-detection differs by how each surface is configured, and the OpenCode
one has a trap. Claude and Oh-My-Pi are **overwritten**, so the question is
whether the current value is ours. OpenCode is **appended to**, so the question
is whether `tui.json` is a file we authored — but its `ours` test is deep
equality against the whole file, which goes false the moment anything else is in
the array, *including after the user consented and we appended alongside them*.
`opencodeStatuslineConflict` therefore returns nothing once **our entry** is
present, whoever else is in there. Without that it asks on every run forever.

## Claude

`tools/statusline/statusline` is the executable Node script (node shebang) and
drives **both** surfaces from one file: a stdin payload with a `tasks` array
renders the subagent panel, anything else the main two-line bar. `--statusline`
installs `statusLine` and `subagentStatusLine` plus
`tools/statusline/context-caps.js`, the `PostToolUse` caps hook.

**The caps hook is Claude-only and stays that way**: its sensor is the Claude
bar, which mirrors `context_window` / `rate_limits` to a usage file. Neither of
the other surfaces exposes the equivalent — OpenCode surfaces no ambient
rate-limit state at all, which is also why its bar carries no 5-hour / 7-day
segments.

**The `spend` segment is Claude-only too, and is the one segment whose data is
not on the stdin payload.** The payload carries no spend fields, so the script
reads the OAuth usage endpoint Claude Code's own `/usage` uses — token from
Claude Code's stored credentials — through a machine-global cache
(`~/.cache/ai-plugins/spend.json`, `$AI_PLUGINS_SPEND_CACHE` override) refreshed
by a detached `--refresh-spend` child on a file-based timer
(`spend.refreshMinutes`, default 15). A render never fetches: the endpoint
throttles on accumulated usage and a tripped account stays 429 for 30+ minutes,
so the child is single-flight behind a lock file and records exponential backoff
on 429. Under `show: "auto"` it renders only for team/enterprise plans (the
`subscriptionType` tag stored beside the token), which is what lets it sit in
the default layout. The script tests zero `refreshMinutes` in their seeded
config — the keychain is not `$HOME`-scoped, so a spawned refresh would escape
the fake home.

## Oh-My-Pi

Sets `statusLine.preset` to `custom` plus `leftSegments` / `rightSegments` /
`segmentOptions`, reading each prior value first so the undo restores it, and
recording an undo **only when the value changed** — re-setting an identical
value is a no-op whose undo would clobber a choice the user made.

Two verified `omp` facts shape it:

- `omp config get` prints exactly the form `set` takes back — bare for an enum,
  compact JSON otherwise.
- **`omp config reset` does not remove a key.** It writes the default back as
  explicit YAML.

So byte-identity on uninstall rests on one extra receipt entry filing the
`config.yml` that `omp` created, and a key absent from a *pre-existing* config
comes back as its explicit default: semantically identical, not byte-identical.
That is the price of restoring key by key rather than rewriting a file the user
also edits.

**`omp` does not validate segment names** — a typo installs cleanly and draws
nothing.

## OpenCode

Copies `tools/statusline/opencode-tui.tsx` into the config dir (reusing the
OpenCode adapter's `configDir`, so the two cannot disagree about where OpenCode
reads) and appends its relative path to **`tui.json`** through the same
format-preserving JSONC helpers the adapter uses.

Three verified facts, none of them in the published docs:

- **`tui.json` is a separate file from `opencode.json`.** OpenCode routes
  `server` plugins to the latter and everything else to the former; the wrong
  one is accepted and never loaded.
- **TUI plugins are not auto-discovered.** The `{plugin,plugins}/*.{ts,js}` glob
  that loads vwf's mempalace auto-save does not reach them, so the `tui.json`
  entry *is* the registration.
- **There is no build step** — OpenCode's loader is Bun and resolves the
  plugin's two imports itself.

A `tui.json` this CLI created is undone by deleting it; one that already existed
is undone key by key at the **shallowest new key**. Which of the two it is comes
from **ownership, not `existsSync`** — the file is ours when it matches what
this installer's own merge produces from empty, so a repeat install still claims
the file its first run wrote (see [receipts.md](receipts.md)). The `$schema` key
and the formatting pass are both creation-only, because on the user's file a
reflow would break the byte-identical round-trip the receipt promises.

`tools/statusline/opencode-tui.tsx` is **deliberately not covered by any
tsconfig**: type-checking it would mean adding `@opentui/solid` and
`@opencode-ai/plugin` as devDependencies purely to resolve two imports in a file
nothing here builds — two packages in the lockfile and the osv scan that ship
nothing, pinned against an OpenCode runtime we do not control. What stands in
for the compiler is the file's own discipline: **every read is optional and
every segment is built inside a `try`**, because a plugin that throws in a
render slot takes the frame down with it.

## Config

Two layers, deep-merged low → high (objects merge key by key, arrays replace
wholesale; either layer may be absent):

1. `~/.config/statusline.json` — per user; the installer seeds this with the
   full defaults and deep-merges missing settings on re-run. The script reads
   defaults **only** from here, never from a file beside itself.
2. `<repo-root>/.config/statusline.json` — per repo, highest.

Uninstall deliberately **leaves** the seeded `~/.config/statusline.json`, since
it may hold user edits.

**Four files move together** when the config shape changes:

- `tools/statusline/statusline` (the script)
- `tools/statusline/statusline.json` (the bundled defaults)
- `schemas/statusline.schema.json` (at the repo root, consumed only via its raw
  GitHub URL from `$schema`)
- `docs/plugins/statusline.md` (the user-facing reference)
